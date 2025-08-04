const express = require('express');
const router = express.Router();
const authController = require('./auth.controller.js');
const authMiddleware = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/check-username', authController.checkUsername);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/profile/:userId', authMiddleware, authController.getUserProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/upload-profile-picture', authMiddleware, upload.single('profile_picture'), authController.uploadProfilePicture);
router.put('/status', authMiddleware, authController.updateStatus);
router.post('/logout', authMiddleware, authController.logout);
router.put('/username', authMiddleware, authController.updateUsername);
router.delete('/account', authMiddleware, authController.deleteAccount);
router.get('/stats', authMiddleware, authController.getUserStats);

// Temporary database viewer endpoint (remove in production)
router.get('/db-view', async (req, res) => {
  try {
    const { query } = require('../../config/database');
    
    // Get all tables
    const tables = query("SELECT name FROM sqlite_master WHERE type='table'");
    
    const dbInfo = {};
    
    for (const table of tables) {
      const tableName = table.name;
      
      // Get table schema
      const schema = query(`PRAGMA table_info(${tableName})`);
      
      // Get sample data (first 5 rows)
      const sampleData = query(`SELECT * FROM ${tableName} LIMIT 5`);
      
      dbInfo[tableName] = {
        schema: schema,
        sampleData: sampleData,
        rowCount: query(`SELECT COUNT(*) as count FROM ${tableName}`)[0].count
      };
    }
    
    res.json({
      success: true,
      database: dbInfo
    });
  } catch (error) {
    console.error('Database viewer error:', error);
    res.status(500).json({ error: 'Failed to view database' });
  }
});

module.exports = router; 