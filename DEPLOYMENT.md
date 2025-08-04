# NexusChat Railway Deployment Guide

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected to Railway

## Step 1: Deploy Backend

1. **Create new Railway project**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your nexuschat repository

2. **Configure Backend Service**
   - Railway will detect the backend folder
   - Set the following environment variables:
     ```
     DB_HOST=your_railway_mysql_host
     DB_USER=your_railway_mysql_user
     DB_PASSWORD=your_railway_mysql_password
     DB_NAME=nexuschat
     PORT=3000
     NODE_ENV=production
     JWT_SECRET=your_secure_jwt_secret
     FRONTEND_URL=https://your-frontend-domain.railway.app
     LOG_LEVEL=info
     ```

3. **Add MySQL Database**
   - In Railway dashboard, add MySQL plugin
   - Copy the connection details to environment variables
   - Import the database schema from `database/schema.sql`

## Step 2: Deploy Frontend

1. **Create Frontend Service**
   - In the same Railway project, add another service
   - Select "Deploy from GitHub repo" again
   - Choose the frontend folder

2. **Configure Frontend Environment**
   - Set environment variable:
     ```
     VITE_BACKEND_URL=https://your-backend-domain.railway.app
     ```

3. **Build Configuration**
   - Railway will automatically run `npm run build`
   - The app will be served from the `dist` folder

## Step 3: Update CORS Settings

1. **Backend CORS**
   - Update `FRONTEND_URL` in backend environment to match your frontend domain
   - Restart the backend service

## Step 4: Test Deployment

1. **Health Check**
   - Visit `https://your-backend-domain.railway.app/api/health`
   - Should return `{"status":"ok"}`

2. **Frontend Test**
   - Visit your frontend domain
   - Test registration and login
   - Test real-time messaging

## Environment Variables Reference

### Backend (.env)
```
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=nexuschat
PORT=3000
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=https://your-frontend-domain.railway.app
LOG_LEVEL=info
```

### Frontend (.env)
```
VITE_BACKEND_URL=https://your-backend-domain.railway.app
```

## Troubleshooting

1. **Database Connection Issues**
   - Verify MySQL plugin is added
   - Check environment variables match Railway MySQL credentials
   - Import schema: `mysql -h host -u user -p database < database/schema.sql`

2. **CORS Errors**
   - Ensure `FRONTEND_URL` in backend matches actual frontend domain
   - Check that frontend is using correct backend URL

3. **Build Failures**
   - Check Railway logs for specific errors
   - Verify all dependencies are in package.json
   - Ensure Node.js version is compatible

## Custom Domains (Optional)

1. **Add Custom Domain**
   - In Railway dashboard, go to your service
   - Click "Settings" → "Domains"
   - Add your custom domain

2. **Update Environment Variables**
   - Update `FRONTEND_URL` to use custom domain
   - Update `VITE_BACKEND_URL` to use custom domain

## Monitoring

- Railway provides built-in monitoring
- Check logs in Railway dashboard
- Monitor resource usage
- Set up alerts for downtime 