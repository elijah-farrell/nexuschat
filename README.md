# NexusChat

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.0-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0.0-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://www.mysql.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7.0-010101?style=flat&logo=socket.io)](https://socket.io/)

A full-stack real-time messaging web application

## What it does

NexusChat is a comprehensive messaging platform where users can register accounts, customize profiles with avatars, and manage their online presence. Users can send friend requests, build their social network using both direct messages and group conversations with real-time message delivery via WebSocket connections.

The platform features a modern dashboard showing recent activity, friend status updates, and conversation history. Users can change usernames, delete their account, and enjoy a responsive interface with dark/light themes that works seamlessly on both desktop and mobile devices.

The app handles user authentication with JWT tokens and bcrypt password hashing for secure login, stores messages in a MySQL database with connection pooling for optimal performance, and provides real-time status indicators with smooth animations and transitions for an engaging user experience.

## Tech Stack

**Frontend:** React 18, Vite, Material-UI, Socket.io Client  
**Backend:** Node.js, Express, Socket.io, MySQL  
**Database:** MySQL with connection pooling  
**Authentication:** JWT tokens, bcrypt password hashing  
**Development:** ESLint, Git  

## Getting Started

See [SETUP.md](SETUP.md) for installation and setup instructions.