// server.js
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
const auth = require('./src/middleware/auth'); // <-- moved up here
const logger = require('./src/utils/logger'); // Added for detailed logging

// Validate environment variables before starting
validateEnv();

// Import routes from new module structure
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

// CORS middleware (apply before rate limiting)
app.use(cors({
  origin: process.env.FRONTEND_URL || true, // Allow all origins if FRONTEND_URL not set
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Origin"],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add detailed request logging middleware
app.use((req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'} - User-Agent: ${req.headers['user-agent'] || 'none'}`);
  next();
});

// Add CORS debugging
app.use((req, res, next) => {
  logger.info(`[CORS DEBUG] Request from: ${req.headers.origin || 'no origin'} to ${req.path}`);
  next();
});

// Rate limiting for security
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per windowMs (increased from 5)
  message: { error: 'Too many login attempts from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many login attempts from this IP, please try again later.' });
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
  }
});

// Apply rate limiting more specifically
app.use('/api/auth/login', authLimiter); // Only apply to login endpoint
app.use('/api', generalLimiter);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || true, // Allow all origins if FRONTEND_URL not set
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO connection handling with authentication
io.use(socketAuth);

// Store user socket connections - support multiple sessions per user
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
      // Emit user online event to all clients
      io.emit('user_online', { userId: socket.userId });
      // Emit user_status_update event to all clients
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
      // Join user's channels
      if (data.channels) {
        data.channels.forEach(channelId => {
          socket.join(`channel_${channelId}`);
        });
      }
      
      // Join user's DMs
      if (data.dms) {
        data.dms.forEach(dmId => {
          socket.join(`dm_${dmId}`);
        });
      }
    } catch (error) {
      console.error('Error joining rooms:', error);
    }
  });

  socket.on('disconnect', async (_reason) => {
    // Remove this specific socket from user's session set
    if (userSockets.has(socket.userId)) {
      const userSessionSet = userSockets.get(socket.userId);
      userSessionSet.delete(socket.id);
      const remainingSessions = userSessionSet.size;
      
      // If no more sessions, remove the user entry entirely and mark offline immediately
      if (remainingSessions === 0) {
        userSockets.delete(socket.userId);
        
        // Mark user offline immediately since no sessions remain
        try {
          await query(
            'UPDATE users SET status = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2',
            ['offline', socket.userId]
          );
          // Emit user offline event to all clients
          io.emit('user_offline', { userId: socket.userId });
          // Emit user_status_update event to all clients
          io.emit('user_status_update', { userId: socket.userId, status: 'offline' });
        } catch (err) {
          console.error('Error updating user status to offline:', err);
        }
      }
    }
  });
});

// Add error handling for Socket.IO
io.engine.on('connection_error', (err) => {
  console.error('🔌 Socket.IO connection error:', err);
});

app.use(express.json({ limit: '10mb' }));

// Serve static files from uploads directory (public access for images)
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for image requests
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  // Log uploads requests simply
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - uploads`);
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Public health check endpoint
app.get('/api/health', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - health`);
  
  try {
    // Test database connection
    const result = await query('SELECT 1 as test');
    res.json({ 
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    
    let errorMessage = 'Database connection failed';
    if (error.message.includes('DATABASE_URL')) {
      errorMessage = 'Database configuration missing';
    } else if (error.code === 'ENETUNREACH' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Database server unreachable';
    }
    
    res.status(503).json({ 
      status: 'error',
      database: 'disconnected',
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Attach auth middleware for all /api routes except /api/auth and /api/health
app.use('/api', (req, res, next) => {
  // Skip auth for /api/auth and /api/health
  if (req.path.startsWith('/auth') || req.path === '/health') return next();
  return auth(req, res, next);
});

// Logging middleware after auth for /api routes
app.use('/api', (req, res, next) => {
  // Only log for non-auth, non-health routes
  if (req.path.startsWith('/auth') || req.path === '/health') return next();
  const user = req.user ? `userId=${req.user.id}` : 'unauthenticated';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${user}`);
  next();
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
  
  // Don't expose internal errors to clients
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT;

if (!PORT) {
  console.error('❌ PORT environment variable is required');
  process.exit(1);
}

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting NexusChat server...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
    

    
    // Start server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Ready to accept connections`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`   Port ${PORT} is already in use`);
        console.error('   Please use a different port or stop the existing server');
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
