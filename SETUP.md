# Setup & Installation

## Prerequisites
- Node.js 18 or higher
- npm or yarn
- **No database setup required** (SQLite is file-based)

## Setup

1. Clone the repository and navigate to the project directory
   ```bash
   git clone https://github.com/yourusername/nexuschat.git
   cd nexuschat
   ```

2. Configure environment variables
   
   Create `.env` files in both backend and frontend directories:
   
   **Backend (.env):**
   ```
   JWT_SECRET=your_secret_key
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   LOG_LEVEL=info
   ```
   
   **Frontend (.env):**
   ```
   VITE_BACKEND_URL=http://localhost:3000
   ```

3. Install dependencies and start the servers
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

4. Open http://localhost:5173 in your browser

## Database

The application uses **SQLite** which is:
- **File-based**: No external database server required
- **Automatic**: Database and tables are created automatically on first run
- **Portable**: Database file is included in the project (but not tracked in Git)
- **Zero-config**: No additional setup required

The SQLite database file (`nexuschat.db`) will be created automatically in the `backend/` directory when you first run the application. 