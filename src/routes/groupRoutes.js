const express = require('express');
const router = express.Router({ mergeParams: true });
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');

// Get all groups for a school
router.get('/schools/:schoolId/groups', authenticate, groupController.getSchoolGroups);

// Create group
router.post('/schools/:schoolId/groups', authenticate, groupController.createGroup);

// Get group details
router.get('/groups/:groupId', authenticate, groupController.getGroupDetail);

// Update group
router.put('/groups/:groupId', authenticate, groupController.updateGroup);

// Add member to group
router.post('/groups/:groupId/members', authenticate, groupController.addGroupMember);

// Remove member from group
router.delete('/groups/:groupId/members/:userId', authenticate, groupController.removeGroupMember);

// Send group message
router.post('/groups/:groupId/messages', authenticate, groupController.sendGroupMessage);

// Get group messages
router.get('/groups/:groupId/messages', authenticate, groupController.getGroupMessages);

// Delete group
router.delete('/groups/:groupId', authenticate, groupController.deleteGroup);

module.exports = router;
