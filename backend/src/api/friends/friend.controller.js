const { query, execute } = require('../../config/database');

// ===== FRIEND APIs =====

// Get all friends for the authenticated user
const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const [friends] = await query(`
      SELECT u.id, u.username, u.name, u.profile_picture, u.status, u.last_seen, f.created_at as friendship_date
      FROM friends f
      INNER JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
      WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?
      ORDER BY u.status = 'online' DESC, u.name ASC
    `, [userId, userId, userId]);

    res.json({
      success: true,
      friends
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
};

// Get online friends
const getOnlineFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const [friends] = await query(`
      SELECT u.id, u.username, u.name, u.profile_picture, u.status, u.last_seen, f.created_at as friendship_date
      FROM friends f
      INNER JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
      WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ? AND u.status = 'online'
      ORDER BY u.name ASC
    `, [userId, userId, userId]);

    res.json({
      success: true,
      friends
    });
  } catch (error) {
    console.error('Get online friends error:', error);
    res.status(500).json({ error: 'Failed to get online friends' });
  }
};

// ===== FRIEND REQUEST APIs =====

// Get pending friend requests for the authenticated user
const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests] = await query(`
      SELECT fr.id, fr.status, fr.created_at,
             u.id as sender_id, u.username, u.name, u.profile_picture
      FROM friend_requests fr
      INNER JOIN users u ON fr.sender_id = u.id
      WHERE fr.recipient_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
};

// Get sent friend requests by the authenticated user
const getSentFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests] = await query(`
      SELECT fr.id, fr.status, fr.created_at,
             u.id as recipient_id, u.username, u.name, u.profile_picture
      FROM friend_requests fr
      INNER JOIN users u ON fr.recipient_id = u.id
      WHERE fr.sender_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get sent friend requests error:', error);
    res.status(500).json({ error: 'Failed to get sent friend requests' });
  }
};

// Send a friend request
const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientUsername, recipientId } = req.body;

    let targetUserId;

    if (recipientId) {
      targetUserId = recipientId;
    } else if (recipientUsername) {
      // Check if recipient exists
      const [recipients] = await query(
        'SELECT id FROM users WHERE username = ?',
        [recipientUsername]
      );

      if (recipients.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      targetUserId = recipients[0].id;
    } else {
      return res.status(400).json({ error: 'Recipient username or ID is required' });
    }

    if (senderId === targetUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if they are already friends
    const [existingFriends] = await query(`
      SELECT id FROM friends 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [senderId, targetUserId, targetUserId, senderId]);

    if (existingFriends.length > 0) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    // Check for existing requests
    const [existingRequests] = await query(`
      SELECT id, status FROM friend_requests 
      WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
    `, [senderId, targetUserId, targetUserId, senderId]);

    if (existingRequests.length > 0) {
      const request = existingRequests[0];
      if (request.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already pending' });
      } else if (request.status === 'rejected') {
        // If previously rejected, update the existing request to pending and update created_at
        await query(
          'UPDATE friend_requests SET status = ?, updated_at = CURRENT_TIMESTAMP, created_at = NOW() WHERE id = ?',
          ['pending', request.id]
        );
        // Emit real-time event to recipient (to all sockets)
        if (req.io && req.userSockets && req.userSockets.has(targetUserId)) {
          const userSocketSet = req.userSockets.get(targetUserId);
          console.log(`[Friend Request] Emitting to user ${targetUserId}, sockets: ${userSocketSet.size}`);
          for (const socketId of userSocketSet) {
            req.io.to(socketId).emit('friend_request_received', { senderId });
          }
        } else {
          console.log(`[Friend Request] User ${targetUserId} not online or no sockets available`);
        }
        res.json({
          success: true,
          message: 'Friend request sent successfully',
          requestId: request.id
        });
        return;
      }
    }

    // Create new friend request
    try {
      const [result] = await query(
        'INSERT INTO friend_requests (sender_id, recipient_id) VALUES (?, ?)',
        [senderId, targetUserId]
      );
      // Emit real-time event to recipient (to all sockets)
      if (req.io && req.userSockets && req.userSockets.has(targetUserId)) {
        const userSocketSet = req.userSockets.get(targetUserId);
        console.log(`[Friend Request] Emitting to user ${targetUserId}, sockets: ${userSocketSet.size}`);
        for (const socketId of userSocketSet) {
          req.io.to(socketId).emit('friend_request_received', { senderId });
        }
      } else {
        console.log(`[Friend Request] User ${targetUserId} not online or no sockets available`);
      }
      res.status(201).json({
        success: true,
        message: 'Friend request sent successfully',
        requestId: result.insertId
      });
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Friend request already pending' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
};

// Accept a friend request
const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    // Get the friend request
    const [requests] = await query(`
      SELECT * FROM friend_requests 
      WHERE id = ? AND recipient_id = ? AND status = 'pending'
    `, [requestId, userId]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const request = requests[0];

    // Update request status to accepted
    await query(
      'UPDATE friend_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['accepted', requestId]
    );

    // Create friendship (add to friends table)
    await query(
      'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
      [request.sender_id, request.recipient_id]
    );

    // Emit real-time event to sender (to all sockets)
    if (req.io && req.userSockets && req.userSockets.has(request.sender_id)) {
      const userSocketSet = req.userSockets.get(request.sender_id);
      for (const socketId of userSocketSet) {
        req.io.to(socketId).emit('friend_request_accepted', { recipientId: userId });
      }
    }

    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
};

// Reject a friend request
const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    // Update request status to rejected
    const [result] = await query(`
      UPDATE friend_requests 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND recipient_id = ? AND status = 'pending'
    `, ['rejected', requestId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Emit real-time event to sender (to all sockets)
    // Get sender_id for this request
    const [request] = await query('SELECT sender_id FROM friend_requests WHERE id = ?', [requestId]);
    if (request.length > 0 && req.io && req.userSockets && req.userSockets.has(request[0].sender_id)) {
      const userSocketSet = req.userSockets.get(request[0].sender_id);
      for (const socketId of userSocketSet) {
        req.io.to(socketId).emit('friend_request_rejected', { recipientId: userId });
      }
    }

    res.json({
      success: true,
      message: 'Friend request rejected successfully'
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
};

// Cancel a sent friend request
const cancelFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    // Get recipient_id before deleting
    const [request] = await query('SELECT recipient_id FROM friend_requests WHERE id = ?', [requestId]);
    // Delete the friend request (only if user is the sender)
    const [result] = await query(`
      DELETE FROM friend_requests 
      WHERE id = ? AND sender_id = ? AND status = 'pending'
    `, [requestId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    // Emit real-time event to recipient (to all sockets)
    if (request.length > 0 && req.io && req.userSockets && req.userSockets.has(request[0].recipient_id)) {
      const userSocketSet = req.userSockets.get(request[0].recipient_id);
      for (const socketId of userSocketSet) {
        req.io.to(socketId).emit('friend_request_cancelled', { senderId: userId });
      }
    }
    res.json({
      success: true,
      message: 'Friend request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({ error: 'Failed to cancel friend request' });
  }
};

// Remove a friend
const removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    // Remove friendship from both sides
    const [result] = await query(`
      DELETE FROM friends 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Friendship not found' });
    }
    // Emit real-time event to the other user (to all sockets)
    if (req.io && req.userSockets && req.userSockets.has(parseInt(friendId))) {
      const userSocketSet = req.userSockets.get(parseInt(friendId));
      for (const socketId of userSocketSet) {
        req.io.to(socketId).emit('friend_removed', { userId });
      }
    }
    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
};

// Search users (for adding friends)
const searchUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query: searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${searchQuery.trim()}%`;

    const [users] = await query(`
      SELECT u.id, u.username, u.name, u.profile_picture, u.status,
             CASE 
               WHEN f.id IS NOT NULL THEN 'friend'
               WHEN fr_sent.id IS NOT NULL AND fr_sent.status = 'pending' THEN 'request_sent'
               WHEN fr_received.id IS NOT NULL AND fr_received.status = 'pending' THEN 'request_received'
               ELSE 'none'
             END as relationship_status
      FROM users u
      LEFT JOIN friends f ON (f.user_id = ? AND f.friend_id = u.id) OR (f.user_id = u.id AND f.friend_id = ?)
      LEFT JOIN friend_requests fr_sent ON fr_sent.sender_id = ? AND fr_sent.recipient_id = u.id
      LEFT JOIN friend_requests fr_received ON fr_received.sender_id = u.id AND fr_received.recipient_id = ?
      WHERE u.id != ? AND (u.username LIKE ? OR u.name LIKE ?)
      ORDER BY u.name ASC
      LIMIT 20
    `, [userId, userId, userId, userId, userId, searchTerm, searchTerm]);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// Get detailed friend activity
const getFriendActivity = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get friend requests received (who added you)
    const [friendRequests] = await query(`
      SELECT 
        fr.id,
        fr.status,
        fr.created_at,
        fr.updated_at,
        u.id as requester_id,
        u.username,
        u.name,
        u.profile_picture,
        u.status as user_status
      FROM friend_requests fr
      INNER JOIN users u ON fr.sender_id = u.id
      WHERE fr.recipient_id = ?
      ORDER BY fr.created_at DESC
      LIMIT 20
    `, [currentUserId]);

    // Get friends list with join dates
    const [friends] = await query(`
      SELECT 
        f.id,
        f.created_at as friendship_date,
        u.id as friend_id,
        u.username,
        u.name,
        u.profile_picture,
        u.status,
        u.last_seen
      FROM friends f
      INNER JOIN users u ON (f.user_id = u.id OR f.friend_id = u.id)
      WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?
      ORDER BY f.created_at DESC
      LIMIT 20
    `, [currentUserId, currentUserId, currentUserId]);

    // Get recent friend status changes (online/offline)
    const [statusActivity] = await query(`
      SELECT 
        u.id,
        u.username,
        u.name,
        u.profile_picture,
        u.status,
        u.last_seen
      FROM friends f
      INNER JOIN users u ON (f.user_id = u.id OR f.friend_id = u.id)
      WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?
      AND u.last_seen > DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY u.last_seen DESC
      LIMIT 10
    `, [currentUserId, currentUserId, currentUserId]);

    res.json({
      success: true,
      friendRequests,
      friends,
      statusActivity
    });
  } catch (error) {
    console.error('Get friend activity error:', error);
    res.status(500).json({ error: 'Failed to get friend activity' });
  }
};

// Get friends for any user by userId (for profile viewing)
const getFriendsOfUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const [friends] = await query(
      `SELECT u.id, u.username, u.name, u.profile_picture, u.status, u.last_seen, f.created_at as friendship_date
       FROM friends f
       INNER JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
       WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?
       ORDER BY u.status = 'online' DESC, u.name ASC`,
      [userId, userId, userId]
    );
    res.json({ success: true, friends });
  } catch (error) {
    console.error('Get friends of user error:', error);
    res.status(500).json({ error: 'Failed to get friends for user' });
  }
};

module.exports = {
  // Friend APIs
  getFriends,
  getOnlineFriends,
  
  // Friend Request APIs
  getFriendRequests,
  getSentFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  
  // Friend Management APIs
  removeFriend,
  
  // Search APIs
  searchUsers,
  
  // New API
  getFriendActivity,
  getFriendsOfUser
}; 