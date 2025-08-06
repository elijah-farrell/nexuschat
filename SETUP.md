# NexusChat Setup Guide

## 🚀 Quick Deploy

### 1. Database (Supabase)
- Create project at [supabase.com](https://supabase.com)
- Run `schema.sql` in SQL Editor

### 2. Backend (Render)
- Connect GitHub repo
- Set environment variables (see templates below)

### 3. Frontend (Vercel)
- Connect GitHub repo
- Set `VITE_BACKEND_URL` to your backend URL

## 🛠️ Local Development

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Git

### Quick Start
```bash
git clone <your-repo-url>
cd nexuschat

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Create .env files (see templates below)
# Start servers
cd backend && npm run dev    # http://localhost:3000
cd ../frontend && npm run dev # http://localhost:5173
```

## Environment Variables

### Backend (.env)
```
JWT_SECRET=your_secret_here
DATABASE_URL=your_supabase_url
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_BACKEND_URL=http://localhost:3000
```

### Production Overrides
- **Backend**: `NODE_ENV=production`, `FRONTEND_URL=https://your-frontend.vercel.app`
- **Frontend**: `VITE_BACKEND_URL=https://your-backend.onrender.com`
- **Database**: Use Session Pooler connection for Render IPv4 connection 