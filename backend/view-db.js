const Database = require('better-sqlite3');
const path = require('path');

// Open the database
const dbPath = path.join(__dirname, 'nexuschat.db');
const db = new Database(dbPath);

console.log('🗄️ NexusChat SQLite Database Contents:\n');

// Show all tables
console.log('📋 Tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(table => {
  console.log(`  - ${table.name}`);
});

console.log('\n👥 Users:');
const users = db.prepare('SELECT id, username, name, email, status, created_at FROM users').all();
if (users.length === 0) {
  console.log('  No users found');
} else {
  users.forEach(user => {
    console.log(`  ID: ${user.id}, Username: ${user.username}, Name: ${user.name || 'N/A'}, Status: ${user.status}, Created: ${user.created_at}`);
  });
}

console.log('\n💬 DM Conversations:');
const conversations = db.prepare('SELECT id, type, name, created_by, created_at FROM dm_conversations').all();
if (conversations.length === 0) {
  console.log('  No conversations found');
} else {
  conversations.forEach(conv => {
    console.log(`  ID: ${conv.id}, Type: ${conv.type}, Name: ${conv.name || 'N/A'}, Created by: ${conv.created_by}, Created: ${conv.created_at}`);
  });
}

console.log('\n📝 DM Messages:');
const messages = db.prepare('SELECT id, dm_id, sender_id, content, created_at FROM dm_messages LIMIT 10').all();
if (messages.length === 0) {
  console.log('  No messages found');
} else {
  messages.forEach(msg => {
    console.log(`  ID: ${msg.id}, DM: ${msg.dm_id}, Sender: ${msg.sender_id}, Content: ${msg.content.substring(0, 50)}..., Created: ${msg.created_at}`);
  });
}

console.log('\n👫 Friends:');
const friends = db.prepare('SELECT id, user_id, friend_id, created_at FROM friends').all();
if (friends.length === 0) {
  console.log('  No friends found');
} else {
  friends.forEach(friend => {
    console.log(`  ID: ${friend.id}, User: ${friend.user_id}, Friend: ${friend.friend_id}, Created: ${friend.created_at}`);
  });
}

console.log('\n📨 Friend Requests:');
const requests = db.prepare('SELECT id, sender_id, recipient_id, status, created_at FROM friend_requests').all();
if (requests.length === 0) {
  console.log('  No friend requests found');
} else {
  requests.forEach(req => {
    console.log(`  ID: ${req.id}, From: ${req.sender_id}, To: ${req.recipient_id}, Status: ${req.status}, Created: ${req.created_at}`);
  });
}

db.close();
console.log('\n✅ Database view complete!'); 