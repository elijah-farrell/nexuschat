const express = require('express');
const router = express.Router();
const messagingController = require('./messaging.controller');
const auth = require('../../middleware/auth');

// ===== DM ROUTES =====
router.get('/dms', auth, messagingController.getEnhancedDMs); // Using enhanced version
router.get('/dms/:dmId', auth, messagingController.getDMInfo);
router.get('/dms/:dmId/messages', auth, messagingController.getDMMessages);
router.post('/dms/:dmId/messages', auth, messagingController.sendDMMessage);
router.get('/users/:userId/dm', auth, messagingController.getOrCreateDM);
router.post('/mark-read/:dmId', auth, messagingController.markDMAsRead);

// ===== GROUP DM ROUTES =====
router.post('/group-dms', auth, messagingController.createGroupDM);
router.get('/group-dms/:dmId', auth, messagingController.getGroupDMDetails);
router.put('/group-dms/:dmId/name', auth, messagingController.updateGroupDMName);
router.post('/group-dms/:dmId/members', auth, messagingController.addGroupMembers);
router.delete('/group-dms/:dmId/members/:userId', auth, messagingController.removeGroupMember);

// ===== ENHANCED FEATURES =====


// ===== ACTIVITY ROUTES =====
router.get('/activity/dms', auth, messagingController.getDMActivity);

// ===== NOTIFICATION ROUTES =====
router.get('/unread-count', auth, messagingController.getUnreadMessageCount);

// Keep only the after-auth logger for userId, remove any other unnecessary log statements
router.use((req, res, next) => {
  const user = req.user ? `userId=${req.user.id}` : 'unauthenticated';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${user}`);
  next();
});

module.exports = router; 