# NexusChat

A real-time messaging application built with React, Node.js, and Socket.IO - inspired by Discord.

## 🚀 Current Status

**Backend**: ✅ Deployed to Render (SQLite database)
**Frontend**: 🔄 In progress - deploying to Vercel
**Database**: ✅ SQLite (file-based, no external dependencies)
**Real-time Chat**: ✅ Working with Socket.IO

## 🛠️ Tech Stack

### Frontend
- **React** with Vite
- **Material-UI** for components
- **Socket.IO Client** for real-time communication
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time messaging
- **SQLite** database (file-based, no external dependencies)
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Winston** for logging

### Security Features
- Account lockout protection (5 failed attempts = 15min lock)
- Input sanitization to prevent SQL injection
- Rate limiting (5 login attempts per 15min)
- JWT token authentication
- Password hashing with bcrypt

## 🏗️ Architecture

### Core Features
- **Real-time messaging** with Socket.IO
- **User authentication** with JWT tokens
- **Friend system** with requests and management
- **Direct messaging** (1-on-1 and group DMs)
- **User profiles** with status indicators
- **Real-time status updates** (online/offline)

### Database Schema
- **Users**: Authentication, profiles, status
- **DM Conversations**: 1-on-1 and group chats
- **DM Messages**: Message content and metadata
- **Friends**: Mutual friendship relationships
- **Friend Requests**: Pending friend requests

## 🚀 Deployment

### Render Deployment (Current)
- **Backend**: Node.js service on Render with SQLite
- **Database**: SQLite file-based database (no external dependencies)
- **Frontend**: Static site on Vercel (in progress)

### Environment Variables
Backend requires:
```
JWT_SECRET=your_secure_jwt_secret
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
LOG_LEVEL=info
```

Frontend requires:
```
VITE_BACKEND_URL=https://your-backend-domain.onrender.com
```

## 📁 Project Structure

```
nexuschat/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── api/            # Route handlers
│   │   ├── config/         # Database, auth config
│   │   ├── middleware/     # Auth middleware
│   │   └── utils/          # Utilities
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utilities
│   └── package.json
├── database/               # Database schemas
│   ├── schema-postgres.sql # Current PostgreSQL schema
│   └── schema-mysql-deprecated.sql # Old MySQL schema
└── README.md
```

## 🔧 Development

### Prerequisites
- Node.js 16+
- PostgreSQL (for local development)
- npm or yarn

### Local Setup
1. **Clone repository**
   ```bash
   git clone https://github.com/elijah-farrell/nexuschat.git
   cd nexuschat
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your database details
   npm run dev
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Update .env with backend URL
   npm run dev
   ```

4. **Database setup**
   ```bash
   # SQLite database is created automatically on first run
   # No additional setup required
   ```

## 🎯 Features

### Authentication
- User registration and login
- JWT token-based authentication
- Account lockout protection
- Secure password hashing

### Messaging
- Real-time direct messaging
- Group DM support
- Message read status
- Typing indicators

### User Management
- Friend requests and management
- User profiles with status
- Real-time status updates
- Profile picture uploads

### Security
- Input sanitization
- Rate limiting
- CORS protection
- SQL injection prevention

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions, please open an issue on GitHub.