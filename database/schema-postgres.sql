-- NexusChat PostgreSQL Schema

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  email VARCHAR(255),
  bio TEXT,
  profile_picture TEXT,
  banner_color VARCHAR(7) DEFAULT '#5865F2',
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'dnd')),
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DM conversations table (for 1-on-1 and group DMs)
CREATE TABLE dm_conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL DEFAULT 'dm' CHECK (type IN ('dm', 'group')),
  name VARCHAR(100), -- for group DM names
  created_by INTEGER,    -- user who created the group DM
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- DM members table (who's in each DM conversation)
CREATE TABLE dm_members (
  dm_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (dm_id, user_id),
  FOREIGN KEY (dm_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- DM messages table (messages in DM conversations)
CREATE TABLE dm_messages (
  id SERIAL PRIMARY KEY,
  dm_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(10) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'embed')),
  file_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dm_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Friends table (mutual friendship)
CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Friend requests table
CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (sender_id, recipient_id),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_dm_messages_dm_id ON dm_messages(dm_id);
CREATE INDEX idx_dm_messages_created_at ON dm_messages(created_at);
CREATE INDEX idx_dm_messages_sender_id ON dm_messages(sender_id);
CREATE INDEX idx_dm_members_dm_id ON dm_members(dm_id);
CREATE INDEX idx_dm_members_user_id ON dm_members(user_id);
CREATE INDEX idx_dm_conversations_type ON dm_conversations(type);
CREATE INDEX idx_dm_conversations_created_by ON dm_conversations(created_by);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_recipient_id ON friend_requests(recipient_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for dm_messages
CREATE TRIGGER update_dm_messages_updated_at BEFORE UPDATE ON dm_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for friend_requests
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON friend_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'NexusChat PostgreSQL database schema created successfully!' as status; 