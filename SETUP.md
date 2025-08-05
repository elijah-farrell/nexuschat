# NexusChat Deployment Guide

## Quick Setup

### 1. Database (Supabase)
- Create project at [supabase.com](https://supabase.com)
- Run `schema.sql` in SQL Editor

### 2. Backend (Render)
- Connect GitHub repo
- Set environment variables:
  ```
  NODE_ENV=production
  JWT_SECRET=<64-char-random-string>
  FRONTEND_URL=https://your-frontend.vercel.app
  DATABASE_URL=<supabase-session-pooler-url>
  ```

### 3. Frontend (Vercel)
- Connect GitHub repo
- Set environment variable:
  ```
  VITE_BACKEND_URL=https://your-backend.onrender.com
  ```

## Environment Templates

### Backend (.env)
```
JWT_SECRET=your_secure_jwt_secret_here

DATABASE_URL=postgresql://postgres.[project]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres 
- **Important**: Use Session Pooler connection (not direct) for Render compatibility

NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env)
```
VITE_BACKEND_URL=https://your-backend.onrender.com
``` 