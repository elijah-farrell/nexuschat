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

module.exports = router; 