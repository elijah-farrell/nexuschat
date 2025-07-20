const express = require('express');
const router = express.Router();
const friendController = require('./friend.controller.js');
const authMiddleware = require('../../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Keep only the after-auth logger for userId, remove any other unnecessary log statements
router.use((req, res, next) => {
  const user = req.user ? `userId=${req.user.id}` : 'unauthenticated';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${user}`);
  next();
});

// ===== FRIEND APIs =====
router.get('/friends', friendController.getFriends);
router.get('/friends/online', friendController.getOnlineFriends);
router.delete('/friends/:friendId', friendController.removeFriend);
router.get('/friends/of/:userId', friendController.getFriendsOfUser);

// ===== FRIEND REQUEST APIs =====
router.get('/requests', friendController.getFriendRequests);
router.get('/requests/sent', friendController.getSentFriendRequests);
router.post('/requests', friendController.sendFriendRequest);
router.put('/requests/:requestId/accept', friendController.acceptFriendRequest);
router.put('/requests/:requestId/reject', friendController.rejectFriendRequest);
router.delete('/requests/:requestId/cancel', friendController.cancelFriendRequest);

// ===== SEARCH APIs =====
router.get('/search', friendController.searchUsers);

// Friend activity API
router.get('/activity', friendController.getFriendActivity);

module.exports = router; 