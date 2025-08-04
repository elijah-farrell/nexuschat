-- ========================================
-- DEPRECATED: MySQL Schema (No longer used)
-- ========================================
-- This file is kept for reference only.
-- Current deployment uses PostgreSQL schema in schema-postgres.sql
-- ========================================

-- NexusChat Database Schema

-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS nexuschat;
USE nexuschat;

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS message_reactions;
DROP TABLE IF EXISTS message_attachments;
DROP TABLE IF EXISTS dm_messages;
DROP TABLE IF EXISTS dm_members;
DROP TABLE IF EXISTS dm_conversations;
DROP TABLE IF EXISTS direct_messages;
DROP TABLE IF EXISTS friend_requests;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS server_members;
DROP TABLE IF EXISTS servers;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  email VARCHAR(255),
  bio TEXT,
  profile_picture TEXT,
  banner_color VARCHAR(7) DEFAULT '#5865F2',
  status ENUM('online', 'offline', 'away', 'dnd') DEFAULT 'offline',
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DM conversations table (for 1-on-1 and group DMs)
CREATE TABLE dm_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('dm', 'group') NOT NULL DEFAULT 'dm',
  name VARCHAR(100), -- for group DM names
  created_by INT,    -- user who created the group DM
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- DM members table (who's in each DM conversation)
CREATE TABLE dm_members (
  dm_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (dm_id, user_id),
  FOREIGN KEY (dm_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- DM messages table (messages in DM conversations)
CREATE TABLE dm_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dm_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  message_type ENUM('text', 'file', 'image', 'embed') DEFAULT 'text',
  file_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dm_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Friends table (mutual friendship)
CREATE TABLE friends (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  friend_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_friendship (user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Friend requests table
CREATE TABLE friend_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_request (sender_id, recipient_id),
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

SELECT 'NexusChat database schema created successfully!' as status; 