const Database = require('better-sqlite3');
const path = require('path');

// Create database file in the backend directory
const dbPath = path.join(__dirname, '../../nexuschat.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
const createTables = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      email TEXT,
      bio TEXT,
      profile_picture TEXT,
      banner_color TEXT DEFAULT '#5865F2',
      status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'dnd')),
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // DM conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dm_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'dm' CHECK (type IN ('dm', 'group')),
      name TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // DM members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dm_members (
      dm_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (dm_id, user_id),
      FOREIGN KEY (dm_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // DM messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dm_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dm_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'embed')),
      file_url TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dm_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Friends table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Friend requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (sender_id, recipient_id),
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);



  // Create indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_dm_messages_dm_id ON dm_messages(dm_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_dm_messages_created_at ON dm_messages(created_at)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_dm_messages_sender_id ON dm_messages(sender_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_dm_members_dm_id ON dm_members(dm_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_dm_members_user_id ON dm_members(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_dm_conversations_type ON dm_conversations(type)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_dm_conversations_created_by ON dm_conversations(created_by)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient_id ON friend_requests(recipient_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status)');


};

// Initialize database
createTables();

// Helper function for queries
const query = (sql, params = []) => {
  try {
    if (sql.trim().toLowerCase().startsWith('select')) {
      return db.prepare(sql).all(params);
    } else {
      return db.prepare(sql).run(params);
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function for single row queries
const queryOne = (sql, params = []) => {
  try {
    return db.prepare(sql).get(params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  db,
  query,
  queryOne
}; 