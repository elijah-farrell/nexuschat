# Deployment Guide

## Current Setup

This project is deployed using:
- **Backend**: Render (Node.js service with SQLite)
- **Frontend**: Vercel (React static site)
- **Database**: SQLite (file-based, no external dependencies)

## Backend Deployment (Render)

### 1. Create Render Account
- Sign up at [render.com](https://render.com)
- Connect your GitHub repository

### 2. Deploy Backend Service
1. **Create New Web Service**
   - Connect your GitHub repository
   - Select the `backend` directory as the root
   - Choose **Node.js** as the runtime

2. **Configure Build Settings**
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your_secure_jwt_secret_here
   LOG_LEVEL=info
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend

### 3. Get Your Backend URL
- After deployment, note your backend URL (e.g., `https://nexuschat-backend.onrender.com`)

## Frontend Deployment (Vercel)

### 1. Create Vercel Account
- Sign up at [vercel.com](https://vercel.com)
- Connect your GitHub repository

### 2. Deploy Frontend
1. **Import Project**
   - Connect your GitHub repository
   - Select the `frontend` directory as the root
   - Choose **Vite** as the framework

2. **Environment Variables**
   ```
   VITE_BACKEND_URL=https://your-backend-domain.onrender.com
   ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your frontend

### 3. Get Your Frontend URL
- After deployment, note your frontend URL (e.g., `https://nexuschat-frontend.vercel.app`)

## Update Backend with Frontend URL

1. **Go back to Render**
2. **Edit your backend service**
3. **Add/Update Environment Variable**:
   ```
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```
4. **Redeploy** the backend service

## Database (SQLite)

### Local Development
- SQLite database file (`nexuschat.db`) is created automatically
- Located in `backend/nexuschat.db`
- **Not tracked in Git** (included in .gitignore)

### Production (Render)
- SQLite database is created automatically on first run
- Persists between deployments
- No external database setup required

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
PORT=3000
JWT_SECRET=your_secure_jwt_secret_here
LOG_LEVEL=info
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Frontend (Vercel)
```
VITE_BACKEND_URL=https://your-backend-domain.onrender.com
```

## Testing Deployment

1. **Test Backend Health**
   ```
   GET https://your-backend-domain.onrender.com/api/health
   ```

2. **Test Frontend**
   - Visit your Vercel URL
   - Try registering/logging in
   - Test real-time messaging

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is set correctly in backend
   - Check that the URL matches your Vercel domain exactly

2. **Database Issues**
   - SQLite database is created automatically
   - No manual database setup required

3. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version is compatible (18+)

4. **Real-time Connection Issues**
   - Verify Socket.IO is working
   - Check that backend URL is correct in frontend

## Security Notes

- **JWT_SECRET**: Use a strong, random secret
- **CORS**: Backend is configured to accept requests from your frontend domain
- **SQLite**: File-based database is suitable for small to medium scale
- **No External Dependencies**: No database server required

## Scaling Considerations

- **SQLite**: Good for up to ~1000 concurrent users
- **Render**: Free tier suitable for development and small projects
- **Vercel**: Excellent for static frontend hosting
- **Future**: Can migrate to PostgreSQL if needed for larger scale 