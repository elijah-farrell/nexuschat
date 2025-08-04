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

  // Message reactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS message_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (message_id, user_id, emoji),
      FOREIGN KEY (message_id) REFERENCES dm_messages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Message attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS message_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES dm_messages(id) ON DELETE CASCADE
    )
  `);

  // Servers table (for future server functionality)
  db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon_url TEXT,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Server members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS server_members (
      server_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (server_id, user_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Channels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice', 'announcement')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    )
  `);

  // Server messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'embed')),
      file_url TEXT,
      is_pinned BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
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
  db.exec('CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_servers_owner_id ON servers(owner_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)');
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