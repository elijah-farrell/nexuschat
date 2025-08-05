require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validateEnv = require('./src/config/validateEnv');
const socketAuth = require('./src/middleware/socketAuth');
const { query } = require('./src/config/database');
const auth = require('./src/middleware/auth');

// Validate environment variables
validateEnv();

// Import routes
const authRoutes = require('./src/api/auth/auth.routes');
const messagingRoutes = require('./src/api/messaging/messaging.routes');
const friendRoutes = require('./src/api/friends/friend.routes');

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Additional security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Origin"],
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 minutes
  message: { error: 'Too many login attempts from this IP, please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: { error: 'Too many requests from this IP, please try again later.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api', generalLimiter);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use(socketAuth);

// Store user socket connections
const userSockets = new Map(); // userId -> Set of socket IDs

io.on('connection', async (socket) => {
  // Join user's personal room
  socket.join(`user_${socket.userId}`);
  
  // Add socket to user's session set
  if (!userSockets.has(socket.userId)) {
    userSockets.set(socket.userId, new Set());
  }
  userSockets.get(socket.userId).add(socket.id);

  // Update user status to online (only if this is the first session)
  if (userSockets.get(socket.userId).size === 1) {
    try {
      await query(
        'UPDATE users SET status = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2',
        ['online', socket.userId]
      );
      io.emit('user_online', { userId: socket.userId });
      io.emit('user_status_update', { userId: socket.userId, status: 'online' });
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  }

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const room = data.channel_id ? `channel_${data.channel_id}` : `dm_${data.dm_id}`;
    socket.to(room).emit('user_typing', {
      user_id: data.user_id,
      username: data.username,
      channel_id: data.channel_id,
      dm_id: data.dm_id
    });
  });

  socket.on('typing_stop', (data) => {
    const room = data.channel_id ? `channel_${data.channel_id}` : `dm_${data.dm_id}`;
    socket.to(room).emit('user_stop_typing', {
      user_id: data.user_id,
      username: data.username,
      channel_id: data.channel_id,
      dm_id: data.dm_id
    });
  });

  // Join user to their channels and DMs
  socket.on('join_rooms', async (data) => {
    try {
      if (data.channels) {
        data.channels.forEach(channelId => {
          socket.join(`channel_${channelId}`);
        });
      }
      
      if (data.dms) {
        data.dms.forEach(dmId => {
          socket.join(`dm_${dmId}`);
        });
      }
    } catch (error) {
      console.error('Error joining rooms:', error);
    }
  });

  socket.on('disconnect', async () => {
    if (userSockets.has(socket.userId)) {
      const userSessionSet = userSockets.get(socket.userId);
      userSessionSet.delete(socket.id);
      
      if (userSessionSet.size === 0) {
        userSockets.delete(socket.userId);
        
        try {
          await query(
            'UPDATE users SET status = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2',
            ['offline', socket.userId]
          );
          io.emit('user_offline', { userId: socket.userId });
          io.emit('user_status_update', { userId: socket.userId, status: 'offline' });
        } catch (err) {
          console.error('Error updating user status to offline:', err);
        }
      }
    }
  });
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
  
  try {
    const { testConnection } = require('./src/config/database');
    const isConnected = await testConnection();
    healthData.database = isConnected ? 'connected' : 'disconnected';
  } catch (error) {
    healthData.database = 'disconnected';
  }
  
  res.json(healthData);
});

// Auth middleware for API routes
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth') || req.path === '/health') return next();
  return auth(req, res, next);
});

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  req.userSockets = userSockets;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/friends', friendRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.NODE_ENV === 'production' 
  ? process.env.PORT || 10000  // Production: require PORT or default to 10000
  : process.env.PORT || 3000;   // Development: default to 3000

// Start server
const startServer = async () => {
  try {
    // Test database connection on startup (silent)
    try {
      const { testConnection } = require('./src/config/database');
      await testConnection();
    } catch (error) {
      console.error('⚠️  Database connection failed on startup');
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 NexusChat server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    server.on('error', (error) => {
      console.error('❌ Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`   Port ${PORT} is already in use`);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
