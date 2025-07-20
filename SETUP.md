# Setup & Installation

## Prerequisites
- Node.js 18 or higher
- MySQL 8.0 or higher
- npm or yarn

## Setup

1. Clone the repository and navigate to the project directory
   ```bash
   git clone https://github.com/yourusername/nexuschat.git
   cd nexuschat
   ```

2. Set up the database
   ```bash
   mysql -u root -p
   CREATE DATABASE nexuschat;
   USE nexuschat;
   SOURCE database/schema.sql;
   ```

3. Configure environment variables
   
   Create `.env` files in both backend and frontend directories:
   
   **Backend (.env):**
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=nexuschat
   JWT_SECRET=your_secret_key
   PORT=3000
   ```
   
   **Frontend (.env):**
   ```
   VITE_BACKEND_URL=http://localhost:3000
   ```

4. Install dependencies and start the servers
   ```bash
   # Backend
   cd backend
   npm install
   npm start
   
   # Frontend (new terminal)
   cd frontend
   npm install
   npm run dev
   ```

5. Open http://localhost:5173 in your browser 