# NexusChat Technical Setup Guide

This guide covers the complete technical setup for NexusChat, including the PostgreSQL migration and deployment configuration.

## 🗄️ Database Migration: SQLite → PostgreSQL

### Migration Overview
- **From**: SQLite (file-based database)
- **To**: PostgreSQL (client-server database)
- **Reason**: Better scalability, concurrent connections, and cloud deployment support

### Database Schema
The complete PostgreSQL schema is in `backend/schema.sql`. Key tables:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  email VARCHAR(255),
  bio TEXT,
  profile_picture VARCHAR(255),
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Friends table
CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)
);

-- Friend requests table
CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, recipient_id)
);

-- DM conversations table
CREATE TABLE dm_conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) DEFAULT 'dm',
  name VARCHAR(255),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DM messages table
CREATE TABLE dm_messages (
  id SERIAL PRIMARY KEY,
  dm_id INTEGER REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Backend Configuration

### Environment Variables
Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### Database Connection
The backend uses the `pg` library for PostgreSQL connections:

```javascript
// src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  family: 4 // Force IPv4
});
```

### Key Changes from SQLite
1. **Parameter Placeholders**: `?` → `$1, $2, $3...`
2. **Boolean Values**: `0/1` → `true/false`
3. **Return Values**: `lastInsertRowid` → `RETURNING id`
4. **Result Access**: Direct array → `.rows` property

## 🚀 Deployment Setup

### Backend Deployment (Render)

1. **Create Render Account**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub repository

2. **Create Web Service**
   - **Name**: nexuschat-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment Variables**
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. **Database Setup**
   - Use Supabase (recommended) or Render PostgreSQL
   - Run `backend/schema.sql` in your database
   - Update `DATABASE_URL` with your connection string

### Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Environment Variables**
   ```
   VITE_BACKEND_URL=https://your-backend.onrender.com
   ```

3. **Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

## 🔒 Security Configuration

### Authentication
- **JWT Tokens**: 7-day expiration
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: 5 login attempts per 15 minutes
- **Account Lockout**: 15 minutes after 5 failed attempts

### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Input Sanitization
All user inputs are sanitized to prevent SQL injection:
```javascript
const sanitize = require('mongo-sanitize');
const sanitizedInput = sanitize(userInput);
```

## 📊 Database Optimization

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friend_requests_recipient ON friend_requests(recipient_id);
CREATE INDEX idx_dm_messages_dm_id ON dm_messages(dm_id);
CREATE INDEX idx_dm_messages_created_at ON dm_messages(created_at);
```

### Connection Pooling
```javascript
// Optimized pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check connection
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Verify environment variables
   echo $DATABASE_URL
   ```

2. **CORS Errors**
   - Ensure `FRONTEND_URL` is set correctly
   - Check that frontend URL matches exactly

3. **Socket.IO Connection Issues**
   - Verify backend URL in frontend environment
   - Check for firewall/proxy issues

4. **PostgreSQL Syntax Errors**
   - Ensure all queries use `$1, $2` placeholders
   - Check boolean values use `true/false`
   - Verify `.rows` access for query results

### Debug Mode
Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📈 Performance Monitoring

### Database Queries
Monitor slow queries:
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();
```

### Application Metrics
- **Response Times**: Monitor API endpoint performance
- **Memory Usage**: Track Node.js memory consumption
- **Connection Pool**: Monitor database connection usage

## 🔄 Migration Scripts

### Data Migration (if needed)
```javascript
// Example migration script
const migrateData = async () => {
  // Export from SQLite
  const sqliteData = await sqlite.all('SELECT * FROM users');
  
  // Import to PostgreSQL
  for (const user of sqliteData) {
    await pg.query(
      'INSERT INTO users (username, password, created_at) VALUES ($1, $2, $3)',
      [user.username, user.password, user.created_at]
    );
  }
};
```

## 📝 Development Workflow

### Local Development
1. **Start PostgreSQL**: `brew services start postgresql` (macOS)
2. **Create Database**: `createdb nexuschat`
3. **Run Schema**: `psql nexuschat < backend/schema.sql`
4. **Start Backend**: `cd backend && npm run dev`
5. **Start Frontend**: `cd frontend && npm run dev`

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Production Checklist

- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] SSL certificates configured
- [ ] CORS settings updated
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented

---

For more information, see the main [README.md](README.md) or open an issue on GitHub. 