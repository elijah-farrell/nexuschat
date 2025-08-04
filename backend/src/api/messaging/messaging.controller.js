const { query } = require('../../config/database');

// ===== USER APIs =====

// Get all users
const getUsers = async (_req, res) => {
  try {
    const users = query(
      'SELECT id, username, name, profile_picture, status, last_seen FROM users ORDER BY name ASC'
    );

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const users = query(
      'SELECT id, username, name, profile_picture, status, last_seen FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// ===== DIRECT MESSAGE APIs =====

// List all DMs for a user (with members and type)
const getAllDMs = async (req, res) => {
  const userId = req.user.id;
  const dms = query(`
    SELECT dc.id, dc.type, dc.name, dc.created_by, dc.created_at
    FROM dm_conversations dc
    INNER JOIN dm_members dm ON dc.id = dm.dm_id
    WHERE dm.user_id = ?
    ORDER BY dc.created_at DESC
  `, [userId]);
  for (const dm of dms) {
    const members = query(`
      SELECT u.id, u.username, u.name, u.profile_picture
      FROM dm_members m
      INNER JOIN users u ON m.user_id = u.id
      WHERE m.dm_id = ?
    `, [dm.id]);
    dm.members = members;
  }
  res.json({ success: true, dms });
};

// Get DM info (with members)
const getDMInfo = async (req, res) => {
  const userId = req.user.id;
  const { dmId } = req.params;
  const membership = query('SELECT 1 FROM dm_members WHERE dm_id = ? AND user_id = ?', [dmId, userId]);
  if (!membership.length) return res.status(403).json({ error: 'Not a member' });
  const dm = query('SELECT * FROM dm_conversations WHERE id = ?', [dmId]);
  if (!dm.length) return res.status(404).json({ error: 'DM not found' });
  const members = query(`
    SELECT u.id, u.username, u.name, u.profile_picture
    FROM dm_members m
    INNER JOIN users u ON m.user_id = u.id
    WHERE m.dm_id = ?
  `, [dmId]);
  res.json({ success: true, dm: { ...dm[0], members } });
};

// Get messages for a DM
const getDMMessages = async (req, res) => {
  const userId = req.user.id;
  const { dmId } = req.params;
  const membership = query('SELECT 1 FROM dm_members WHERE dm_id = ? AND user_id = ?', [dmId, userId]);
  if (!membership.length) return res.status(403).json({ error: 'Not a member' });
  const messages = query(`
    SELECT m.*, u.username, u.name, u.profile_picture
    FROM dm_messages m
    INNER JOIN users u ON m.sender_id = u.id
    WHERE m.dm_id = ?
    ORDER BY m.created_at ASC
  `, [dmId]);
  res.json({ success: true, messages });
};

// Create 1:1 DM
const getOrCreateDM = async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.userId;
  const existing = query(`
    SELECT dc.id FROM dm_conversations dc
    INNER JOIN dm_members m1 ON dc.id = m1.dm_id
    INNER JOIN dm_members m2 ON dc.id = m2.dm_id
    WHERE dc.type = 'dm' AND m1.user_id = ? AND m2.user_id = ?
  `, [userId, otherUserId]);
  let dmId;
  if (existing.length) {
    dmId = existing[0].id;
  } else {
    const result = query('INSERT INTO dm_conversations (type, created_by) VALUES (\'dm\', ?)', [userId]);
    dmId = result.insertId;
    query('INSERT INTO dm_members (dm_id, user_id) VALUES (?, ?), (?, ?)', [dmId, userId, dmId, otherUserId]);
  }
  res.json({ success: true, dm_id: dmId });
};

// Send a message to a DM conversation
const sendDMMessage = async (req, res) => {
  try {
    const { dmId } = req.params;
    const senderId = req.user.id;
    const { content, messageType = 'text' } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if user is member of this DM conversation
    const membership = query(
      'SELECT 1 FROM dm_members WHERE dm_id = ? AND user_id = ?',
      [dmId, senderId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = query(
      'INSERT INTO dm_messages (dm_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)',
      [dmId, senderId, content.trim(), messageType]
    );

    // Get the created message with user info
    const messages = query(`
      SELECT dm.*, u.username, u.name, u.profile_picture
      FROM dm_messages dm
      INNER JOIN users u ON dm.sender_id = u.id
      WHERE dm.id = ?
    `, [result.insertId]);

    // Emit the new message to all users in the DM
    if (req.io) {
      req.io.to(`dm_${dmId}`).emit('new_message', {
        dm_id: dmId,
        message: messages[0]
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      message: messages[0]
    });
  } catch (error) {
    console.error('Send DM message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get total unread message count for notifications
const getUnreadMessageCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const result = query(`
      SELECT COUNT(*) as unread_count
      FROM dm_messages dm
      INNER JOIN dm_members dm_m ON dm.dm_id = dm_m.dm_id
      WHERE dm_m.user_id = ? AND dm.sender_id != ? AND dm.is_read = 0
    `, [currentUserId, currentUserId]);

    res.json({
      success: true,
      unread_count: result[0].unread_count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Get detailed DM activity
const getDMActivity = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get recent DM conversations with last message info
    const dmConversations = query(`
      SELECT 
        dc.id,
        dc.created_at as conversation_created,
        dc.type,
        dc.created_by,
        u.id as other_user_id,
        u.username,
        u.name,
        u.profile_picture,
        u.status,
        u.last_seen,
        (SELECT COUNT(*) FROM dm_messages dm WHERE dm.dm_id = dc.id AND dm.is_read = 0 AND dm.sender_id != ?) as unread_count,
        (SELECT dm.content FROM dm_messages dm WHERE dm.dm_id = dc.id ORDER BY dm.created_at DESC LIMIT 1) as last_message,
        (SELECT dm.created_at FROM dm_messages dm WHERE dm.dm_id = dc.id ORDER BY dm.created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM dm_messages dm WHERE dm.dm_id = dc.id) as total_messages,
        creator.username as created_by_username
      FROM dm_conversations dc
      INNER JOIN dm_members dm1 ON dc.id = dm1.dm_id
      INNER JOIN dm_members dm2 ON dc.id = dm2.dm_id
      INNER JOIN users u ON (dm2.user_id = u.id AND dm2.user_id != ?)
      LEFT JOIN users creator ON dc.created_by = creator.id
      WHERE dm1.user_id = ? AND dm2.user_id != ?
      ORDER BY (last_message_time IS NULL), last_message_time DESC, dc.created_at DESC
      LIMIT 20
    `, [currentUserId, currentUserId, currentUserId, currentUserId]);

    // Get recent DM messages (last 24 hours)
    const recentDMMessages = query(`
      SELECT 
        dm.id,
        dm.content,
        dm.created_at,
        dm.is_read,
        dm.sender_id,
        u.username,
        u.name,
        u.profile_picture,
        dc.id as conversation_id
      FROM dm_messages dm
      INNER JOIN dm_conversations dc ON dm.dm_id = dc.id
      INNER JOIN dm_members dm_m ON dc.id = dm_m.dm_id
      INNER JOIN users u ON dm.sender_id = u.id
      WHERE dm_m.user_id = ? AND dm.created_at > datetime('now', '-24 hours')
      ORDER BY dm.created_at DESC
      LIMIT 15
    `, [currentUserId]);

    // Get unread message summary
    const unreadSummary = query(`
      SELECT 
        COUNT(*) as total_unread,
        COUNT(DISTINCT dm.dm_id) as conversations_with_unread
      FROM dm_messages dm
      INNER JOIN dm_members dm_m ON dm.dm_id = dm_m.dm_id
      WHERE dm_m.user_id = ? AND dm.sender_id != ? AND dm.is_read = 0
    `, [currentUserId, currentUserId]);

    res.json({
      success: true,
      dmConversations,
      recentDMMessages,
      unreadSummary: unreadSummary[0] || { total_unread: 0, conversations_with_unread: 0 }
    });
  } catch (error) {
    console.error('Get DM activity error:', error);
    res.status(500).json({ error: 'Failed to get DM activity' });
  }
};

// ===== GROUP DM APIs =====

// Create a new group DM
const createGroupDM = async (req, res) => {
  const userId = req.user.id;
  const { name, memberIds } = req.body;
  if (!name || !Array.isArray(memberIds) || memberIds.length < 2) {
    return res.status(400).json({ error: 'Group name and at least 2 members required' });
  }
  const allMemberIds = memberIds.includes(userId) ? memberIds : [userId, ...memberIds];
  const result = query('INSERT INTO dm_conversations (type, name, created_by) VALUES (\'group\', ?, ?)', [name, userId]);
  const dmId = result.insertId;
  const memberValues = allMemberIds.map(uid => [dmId, uid]);
  query('INSERT INTO dm_members (dm_id, user_id) VALUES ?', [memberValues]);
  res.status(201).json({ success: true, dm_id: dmId });
};

// Add members to a group DM
const addGroupMembers = async (req, res) => {
  try {
    const { dmId } = req.params;
    const currentUserId = req.user.id;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ error: 'Member IDs array is required' });
    }

    // Check if user is member of the group DM
    const membership = query(
      'SELECT 1 FROM dm_members WHERE dm_id = ? AND user_id = ?',
      [dmId, currentUserId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if it's a group DM
    const conversation = query(
      'SELECT type FROM dm_conversations WHERE id = ?',
      [dmId]
    );

    if (conversation.length === 0 || conversation[0].type !== 'group') {
      return res.status(400).json({ error: 'Not a group DM' });
    }

    // Add new members
    const memberValues = memberIds.map(userId => [dmId, userId]);
    query(
      'INSERT IGNORE INTO dm_members (dm_id, user_id) VALUES ?',
      [memberValues]
    );

    res.json({
      success: true,
      message: 'Members added successfully'
    });
  } catch (error) {
    console.error('Add group members error:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
};

// Remove member from group DM
const removeGroupMember = async (req, res) => {
  try {
    const { dmId, userId } = req.params;
    const currentUserId = req.user.id;

    // Check if user is member of the group DM
    const membership = query(
      'SELECT 1 FROM dm_members WHERE dm_id = ? AND user_id = ?',
      [dmId, currentUserId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if it's a group DM
    const conversation = query(
      'SELECT type, created_by FROM dm_conversations WHERE id = ?',
      [dmId]
    );

    if (conversation.length === 0 || conversation[0].type !== 'group') {
      return res.status(400).json({ error: 'Not a group DM' });
    }

    // Only creator can remove members (or user can leave themselves)
    if (conversation[0].created_by !== currentUserId && currentUserId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Only group creator can remove members' });
    }

    query(
      'DELETE FROM dm_members WHERE dm_id = ? AND user_id = ?',
      [dmId, userId]
    );

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove group member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

// Get group DM details with members
const getGroupDMDetails = async (req, res) => {
  try {
    const { dmId } = req.params;
    const currentUserId = req.user.id;

    // Check if user is member of the DM
    const membership = query(
      'SELECT 1 FROM dm_members WHERE dm_id = ? AND user_id = ?',
      [dmId, currentUserId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const groupDetails = query(`
      SELECT 
        dc.id,
        dc.name,
        dc.type,
        dc.created_by,
        dc.created_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', u.id,
            'username', u.username,
            'name', u.name,
            'profile_picture', u.profile_picture,
            'status', u.status,
            'last_seen', u.last_seen
          )
        ) as members
      FROM dm_conversations dc
      INNER JOIN dm_members dm ON dc.id = dm.dm_id
      INNER JOIN users u ON dm.user_id = u.id
      WHERE dc.id = ?
      GROUP BY dc.id
    `, [dmId]);

    if (groupDetails.length === 0) {
      return res.status(404).json({ error: 'Group DM not found' });
    }

    res.json({
      success: true,
      groupDM: groupDetails[0]
    });
  } catch (error) {
    console.error('Get group DM details error:', error);
    res.status(500).json({ error: 'Failed to get group DM details' });
  }
};

// Update group DM name
const updateGroupDMName = async (req, res) => {
  try {
    const { dmId } = req.params;
    const currentUserId = req.user.id;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Check if user is creator of the group DM
    const conversation = query(
      'SELECT created_by FROM dm_conversations WHERE id = ? AND type = "group"',
      [dmId]
    );

    if (conversation.length === 0) {
      return res.status(404).json({ error: 'Group DM not found' });
    }

    if (conversation[0].created_by !== currentUserId) {
      return res.status(403).json({ error: 'Only group creator can update name' });
    }

    query(
      'UPDATE dm_conversations SET name = ? WHERE id = ?',
      [name.trim(), dmId]
    );

    res.json({
      success: true,
      message: 'Group name updated successfully'
    });
  } catch (error) {
    console.error('Update group DM name error:', error);
    res.status(500).json({ error: 'Failed to update group name' });
  }
};

// ===== ENHANCED MESSAGE FEATURES =====

// Add reaction to a message
const addMessageReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    // Check if user has access to the message
    const message = query(`
      SELECT m.channel_id, dm.dm_id, m.sender_id, dm.sender_id as dm_sender_id
      FROM messages m
      LEFT JOIN dm_messages dm ON dm.id = ?
      WHERE m.id = ? OR dm.id = ?
    `, [messageId, messageId, messageId]);

    if (message.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Add reaction (you'll need to create a reactions table)
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Reaction added successfully'
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

// ===== ENHANCED DM FUNCTIONS =====

// Enhanced getDMs with better group DM support
const getEnhancedDMs = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all DM conversations with enhanced info
    const [dms] = query(`
      SELECT 
        dc.id,
        dc.type,
        dc.name,
        dc.created_at,
        dc.created_by,
        CASE 
          WHEN dc.type = 'dm' THEN (
            SELECT u.id FROM users u 
            INNER JOIN dm_members dm2 ON u.id = dm2.user_id 
            WHERE dm2.dm_id = dc.id AND dm2.user_id != ?
          )
          ELSE NULL
        END as other_user_id,
        CASE 
          WHEN dc.type = 'dm' THEN (
            SELECT u.username FROM users u 
            INNER JOIN dm_members dm2 ON u.id = dm2.user_id 
            WHERE dm2.dm_id = dc.id AND dm2.user_id != ?
          )
          ELSE dc.name
        END as display_name,
        CASE 
          WHEN dc.type = 'dm' THEN (
            SELECT u.name FROM users u 
            INNER JOIN dm_members dm2 ON u.id = dm2.user_id 
            WHERE dm2.dm_id = dc.id AND dm2.user_id != ?
          )
          ELSE dc.name
        END as display_full_name,
        CASE 
          WHEN dc.type = 'dm' THEN (
            SELECT u.profile_picture FROM users u 
            INNER JOIN dm_members dm2 ON u.id = dm2.user_id 
            WHERE dm2.dm_id = dc.id AND dm2.user_id != ?
          )
          ELSE NULL
        END as profile_picture,
        CASE 
          WHEN dc.type = 'dm' THEN (
            SELECT u.status FROM users u 
            INNER JOIN dm_members dm2 ON u.id = dm2.user_id 
            WHERE dm2.dm_id = dc.id AND dm2.user_id != ?
          )
          ELSE 'offline'
        END as status,
        (SELECT COUNT(*) FROM dm_messages dm WHERE dm.dm_id = dc.id AND dm.is_read = 0 AND dm.sender_id != ?) as unread_count,
        (SELECT dm.content FROM dm_messages dm WHERE dm.dm_id = dc.id ORDER BY dm.created_at DESC LIMIT 1) as last_message,
        (SELECT dm.created_at FROM dm_messages dm WHERE dm.dm_id = dc.id ORDER BY dm.created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM dm_members WHERE dm_id = dc.id) as member_count
      FROM dm_conversations dc
      INNER JOIN dm_members dm1 ON dc.id = dm1.dm_id
      WHERE dm1.user_id = ?
      ORDER BY (last_message_time IS NULL), last_message_time DESC, dc.created_at DESC
    `, [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId]);

    // Attach members array to each DM
    for (const dm of dms) {
      const [members] = query(`
        SELECT u.id, u.username, u.name, u.profile_picture
        FROM dm_members m
        INNER JOIN users u ON m.user_id = u.id
        WHERE m.dm_id = ?
      `, [dm.id]);
      dm.members = members;
    }

    res.json({
      success: true,
      dms
    });
  } catch (error) {
    console.error('Get enhanced DMs error:', error);
    res.status(500).json({ error: 'Failed to get DMs' });
  }
};

// Ensure markDMAsRead is defined above module.exports and exported correctly
const markDMAsRead = async (req, res) => {
  const userId = req.user.id;
  const dmId = req.params.dmId;
  try {
    query(
      `UPDATE dm_messages SET is_read = 1 WHERE dm_id = ? AND sender_id != ?`,
      [dmId, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error in markDMAsRead:', err); // Log the real error
    res.status(500).json({ error: 'Failed to mark DM as read' });
  }
};

module.exports = {
  // User APIs
  getUsers,
  getUserById,
  
  // Direct Message APIs
  getAllDMs,
  getDMInfo,
  getDMMessages,
  getOrCreateDM,
  sendDMMessage,
  getUnreadMessageCount,
  
  // Activity APIs
  getDMActivity,

  // Group DM APIs
  createGroupDM,
  addGroupMembers,
  removeGroupMember,
  getGroupDMDetails,
  updateGroupDMName,

  // Enhanced Message Features
  addMessageReaction,

  // Enhanced DM Functions
  getEnhancedDMs,
  markDMAsRead
}; 