const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../../config/database');
const { sanitizeUsername, sanitizePassword, sanitizeString } = require('../../utils/sanitize');
const logger = require('../../utils/logger'); // Add logger

// Track failed login attempts
const failedAttempts = new Map(); // username -> { count: number, lockedUntil: timestamp }

// Check if account is locked
const isAccountLocked = (username) => {
  const attempts = failedAttempts.get(username);
  if (!attempts) return false;
  
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return true;
  }
  
  // Clear if lock has expired
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    failedAttempts.delete(username);
  }
  
  return false;
};

// Record failed login attempt
const recordFailedAttempt = (username) => {
  const attempts = failedAttempts.get(username) || { count: 0 };
  attempts.count++;
  
  // Lock account after 5 failed attempts for 15 minutes
  if (attempts.count >= 5) {
    attempts.lockedUntil = Date.now() + (15 * 60 * 1000); // 15 minutes
  }
  
  failedAttempts.set(username, attempts);
};

// Clear failed attempts on successful login
const clearFailedAttempts = (username) => {
  failedAttempts.delete(username);
};

// Register new user
const register = async (req, res) => {
  try {
    logger.info(`[REGISTER] Attempt from IP: ${req.ip} - Body: ${JSON.stringify(req.body)}`);
    
    const { username, password, name } = req.body;

    // Validate input
    if (!username || !password) {
      logger.warn(`[REGISTER] Missing fields - Username: ${!!username}, Password: ${!!password}`);
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Sanitize inputs
    const sanitizedUsername = sanitizeUsername(username);
    const sanitizedPassword = sanitizePassword(password);
    const sanitizedName = name ? sanitizeString(name) : null;

    logger.info(`[REGISTER] Sanitized username: ${sanitizedUsername}`);

    // Username validation
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 20) {
      logger.warn(`[REGISTER] Username length invalid: ${sanitizedUsername.length}`);
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
      logger.warn(`[REGISTER] Username contains invalid characters: ${sanitizedUsername}`);
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    if (password.length < 6) {
      logger.warn(`[REGISTER] Password too short: ${password.length}`);
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (sanitizedPassword.length > 128) {
      logger.warn(`[REGISTER] Password too long: ${sanitizedPassword.length}`);
      return res.status(400).json({ error: 'Password is too long' });
    }

    // Check if username already exists (case-insensitive)
    logger.info(`[REGISTER] Checking if username exists: ${sanitizedUsername}`);
    const existingUser = queryOne(
      'SELECT id FROM users WHERE LOWER(username) = ?',
      [sanitizedUsername.toLowerCase()]
    );

    if (existingUser) {
      logger.warn(`[REGISTER] Username already exists: ${sanitizedUsername}`);
      return res.status(400).json({ error: 'Username already exists' });
    }

    logger.info(`[REGISTER] Creating new user: ${sanitizedUsername}`);
    // Hash password
    const hashedPassword = await bcrypt.hash(sanitizedPassword, 10);

    // Create user (do not set name on registration)
    const result = query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [sanitizedUsername, hashedPassword]
    );

    logger.info(`[REGISTER] User created successfully with ID: ${result.lastInsertRowid}`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.lastInsertRowid, username: sanitizedUsername },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`[REGISTER] Registration successful for user: ${sanitizedUsername}`);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result.lastInsertRowid,
        username: sanitizedUsername,
        email: null,
        bio: null,
        profile_picture: null,
        status: 'online'
      }
    });
  } catch (error) {
    logger.error(`[REGISTER] Error: ${error.message}`, error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    logger.info(`[LOGIN] Attempt from IP: ${req.ip} - Username: ${req.body.username || 'none'}`);
    
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      logger.warn(`[LOGIN] Missing fields - Username: ${!!username}, Password: ${!!password}`);
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Sanitize inputs
    const sanitizedUsername = sanitizeUsername(username);
    const sanitizedPassword = sanitizePassword(password);

    logger.info(`[LOGIN] Sanitized username: ${sanitizedUsername}`);

    // Basic input validation
    if (sanitizedUsername.length > 50 || sanitizedPassword.length > 128) {
      logger.warn(`[LOGIN] Input too long - Username: ${sanitizedUsername.length}, Password: ${sanitizedPassword.length}`);
      return res.status(400).json({ error: 'Invalid input length' });
    }

    // Check if account is locked
    if (isAccountLocked(sanitizedUsername)) {
      logger.warn(`[LOGIN] Account locked for: ${sanitizedUsername}`);
      return res.status(429).json({ error: 'Account temporarily locked. Please try again later.' });
    }

    // Find user
    logger.info(`[LOGIN] Looking up user: ${sanitizedUsername}`);
    const user = queryOne(
      'SELECT * FROM users WHERE username = ?',
      [sanitizedUsername]
    );

    if (!user) {
      logger.warn(`[LOGIN] User not found: ${sanitizedUsername}`);
      recordFailedAttempt(sanitizedUsername);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info(`[LOGIN] User found, checking password for: ${sanitizedUsername}`);
    // Check password
    const isValidPassword = await bcrypt.compare(sanitizedPassword, user.password);
    if (!isValidPassword) {
      logger.warn(`[LOGIN] Invalid password for: ${sanitizedUsername}`);
      recordFailedAttempt(sanitizedUsername);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info(`[LOGIN] Password valid for: ${sanitizedUsername}`);
    // Clear failed attempts on successful login
    clearFailedAttempts(sanitizedUsername);

    // Update user status to online
    query(
      'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      ['online', user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`[LOGIN] Login successful for: ${sanitizedUsername}`);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profile_picture: user.profile_picture,
        status: 'online'
      }
    });
  } catch (error) {
    logger.error(`[LOGIN] Error: ${error.message}`, error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = queryOne(
      'SELECT id, username, name, email, bio, profile_picture, banner_color, status, last_seen, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, bio, profile_picture, banner_color } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      // Validate name length
      if (name && (name.length < 1 || name.length > 50)) {
        return res.status(400).json({ error: 'Name must be between 1 and 50 characters' });
      }
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (bio !== undefined) {
      // Validate bio length
      if (bio && (bio.length < 1 || bio.length > 500)) {
        return res.status(400).json({ error: 'Bio must be between 1 and 500 characters' });
      }
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }

    if (profile_picture !== undefined) {
      updateFields.push('profile_picture = ?');
      updateValues.push(profile_picture);
    }

    if (banner_color !== undefined) {
      updateFields.push('banner_color = ?');
      updateValues.push(banner_color);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(userId);

    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const profilePictureUrl = `/uploads/${req.file.filename}`;

    // Update user's profile picture in database
    await query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [profilePictureUrl, userId]
    );

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profile_picture_url: profilePictureUrl
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

// Update user status
const updateStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.body;

    // Allowable statuses: online, offline, away, busy
    const allowedStatuses = ['online', 'offline', 'away', 'busy'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status is required and must be one of: online, offline, away, busy' });
    }

    // Update user status and last_seen
    await query(
      'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [status, userId]
    );

    // Emit real-time status update to all clients
    if (req.io) {
      req.io.emit('user_status_update', { userId, status });
    }

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// Logout user (update status to offline only if no other sessions)
const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has other active socket sessions
    const userSockets = req.userSockets;
    const hasOtherSessions = userSockets && userSockets.has(userId) && userSockets.get(userId).size > 0;

    if (!hasOtherSessions) {
      // Only update status to offline if no other sessions exist
      await query(
        'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        ['offline', userId]
      );

      // Emit real-time status update to all clients
      if (req.io) {
        req.io.emit('user_status_update', { userId, status: 'offline' });
      }
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Get other user's profile
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Get user profile (excluding sensitive info like password and email)
    const users = query(
      'SELECT id, username, name, bio, profile_picture, banner_color, status, last_seen, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Check if current user and viewed user are friends
    const friendRows = query(
      `SELECT created_at FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      [currentUserId, userId, userId, currentUserId]
    );
    if (friendRows.length > 0) {
      user.is_friend = true;
      user.friendship_date = friendRows[0].created_at;
    } else {
      user.is_friend = false;
      user.friendship_date = null;
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

const checkUsername = async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const existingUser = queryOne(
    'SELECT id FROM users WHERE LOWER(username) = ?',
    [username.toLowerCase()]
  );
  if (existingUser) {
    return res.json({ available: false });
  }
  res.json({ available: true });
};

// Update username
const updateUsername = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    // Validate input
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Username validation (same as registration)
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Check if username already exists (case-insensitive, but allow same user to keep their username)
    const existingUser = queryOne(
      'SELECT id FROM users WHERE LOWER(username) = ? AND id != ?',
      [username.toLowerCase(), userId]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Update username
    query(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, userId]
    );

    res.json({
      success: true,
      message: 'Username updated successfully',
      user: { username }
    });
  } catch (error) {
    console.error('Update username error:', error);
    res.status(500).json({ error: 'Failed to update username' });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    // Validate input
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get current user's username
    const user = queryOne(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUsername = user.username;

    // Check if provided username matches exactly (case-sensitive)
    if (username !== currentUsername) {
      return res.status(400).json({ error: 'Username does not match' });
    }

    // Delete user (cascade will handle related data)
    query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// Get user stats
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get message count
    const messageCount = query(
      'SELECT COUNT(*) as count FROM dm_messages WHERE sender_id = ?',
      [userId]
    );

    // Get friend count
    const friendCount = query(
      'SELECT COUNT(*) as count FROM friends WHERE user_id = ?',
      [userId]
    );

    // Get DM conversation count
    const dmCount = query(
      'SELECT COUNT(*) as count FROM dm_members WHERE user_id = ?',
      [userId]
    );

    // Get account age
    const userData = query(
      'SELECT created_at FROM users WHERE id = ?',
      [userId]
    );

    const accountAge = userData.length > 0 ? 
      Math.floor((Date.now() - new Date(userData[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    res.json({
      success: true,
      stats: {
        messages: messageCount[0]?.count || 0,
        friends: friendCount[0]?.count || 0,
        conversations: dmCount[0]?.count || 0,
        accountAge: accountAge
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  updateStatus,
  logout,
  getUserProfile,
  checkUsername,
  updateUsername,
  deleteAccount,
  getUserStats
}; 