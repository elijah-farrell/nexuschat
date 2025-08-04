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
const { pool, query } = require('./src/config/database');
const auth = require('./src/middleware/auth'); // <-- moved up here

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

// Rate limiting for security
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again later.'
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/auth', authLimiter);
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

io.on('connection', (socket) => {
  // Join user's personal room
  socket.join(`user_${socket.userId}`);
  
  // Add socket to user's session set
  if (!userSockets.has(socket.userId)) {
    userSockets.set(socket.userId, new Set());
  }
  userSockets.get(socket.userId).add(socket.id);

  // Update user status to online (only if this is the first session)
  if (userSockets.get(socket.userId).size === 1) {
    query(
      'UPDATE users SET status = ?, last_seen = NOW() WHERE id = ?',
      ['online', socket.userId]
    ).then(() => {
      // Emit user online event to all clients
      io.emit('user_online', { userId: socket.userId });
      // Emit user_status_update event to all clients
      io.emit('user_status_update', { userId: socket.userId, status: 'online' });
    }).catch(err => console.error('Error updating user status:', err));
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

  socket.on('disconnect', (_reason) => {
    // Remove this specific socket from user's session set
    if (userSockets.has(socket.userId)) {
      const userSessionSet = userSockets.get(socket.userId);
      userSessionSet.delete(socket.id);
      const remainingSessions = userSessionSet.size;
      
      // If no more sessions, remove the user entry entirely and mark offline immediately
      if (remainingSessions === 0) {
        userSockets.delete(socket.userId);
        
        // Mark user offline immediately since no sessions remain
        query(
          'UPDATE users SET status = ?, last_seen = NOW() WHERE id = ?',
          ['offline', socket.userId]
        ).then(() => {
          // Emit user offline event to all clients
          io.emit('user_offline', { userId: socket.userId });
          // Emit user_status_update event to all clients
          io.emit('user_status_update', { userId: socket.userId, status: 'offline' });
        }).catch(err => console.error('Error updating user status to offline:', err));
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
app.get('/api/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - health`);
  res.json({ status: 'ok' });
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

// Test DB connection and start server only if successful
pool.query('SELECT 1')
  .then(() => {
    server.listen(PORT, () => {
      console.log(`\n✅ NexusChat server running!`);
      console.log(`   🚀 Port: ${PORT}`);
      console.log(`   🌐 API: http://localhost:${PORT}/api`);
      console.log(`   🩺 Health: http://localhost:${PORT}/api/health`);
      console.log(`   🔌 WebSocket: Ready`);
      console.log(`   🗄️ Database: Connected\n`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
