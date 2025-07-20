# NexusChat

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0.0-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://www.mysql.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7.0-010101?style=flat&logo=socket.io)](https://socket.io/)

A real-time chat application built with React, Node.js, and WebSocket technology. Think Discord but simpler - direct messaging, group conversations, friend management, and a clean interface.

## What it does

Users can register accounts, add friends, and start conversations. Messages are delivered in real-time using WebSocket connections. The interface includes a dashboard showing recent activity, friend status updates, and conversation history.

The app handles user authentication with JWT tokens, stores messages in a MySQL database, and provides a responsive interface that works on both desktop and mobile.

## Tech Stack

**Frontend:** React 18, Vite, Material-UI, Socket.io Client  
**Backend:** Node.js, Express, Socket.io, MySQL  
**Database:** MySQL with connection pooling  
**Authentication:** JWT tokens, bcrypt password hashing  
**Development:** ESLint, Git  

## Getting Started

See [SETUP.md](SETUP.md) for installation and setup instructions.

## Features

### User management
- Account registration and login
- Profile customization with avatars
- Username changes and account deletion
- Online/offline status tracking

### Messaging
- Direct messages between users
- Group conversations
- Real-time message delivery
- Message history and unread indicators

### Social features
- Friend requests and management
- User profiles and activity feeds
- Friend status monitoring

### Interface
- Dark and light themes
- Responsive design for mobile and desktop
- Real-time status indicators
- Smooth animations and transitions


## Future plans

See `future_features.md` for planned features including message reactions, file sharing, server/channel systems, and video calls.
