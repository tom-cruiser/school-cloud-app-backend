const express = require('express');
const router = express.Router({ mergeParams: true });
const discussionController = require('../controllers/discussionController');
const { authenticate } = require('../middleware/auth');

// Get discussions for a group
router.get('/groups/:groupId/discussions', authenticate, discussionController.getDiscussions);

// Create discussion
router.post('/groups/:groupId/discussions', authenticate, discussionController.createDiscussion);

// Get discussion details
router.get('/discussions/:discussionId', authenticate, discussionController.getDiscussionDetail);

// Update discussion
router.put('/discussions/:discussionId', authenticate, discussionController.updateDiscussion);

// Add reply to discussion
router.post('/discussions/:discussionId/replies', authenticate, discussionController.addReply);

// Update reply
router.put('/replies/:replyId', authenticate, discussionController.updateReply);

// Delete reply
router.delete('/replies/:replyId', authenticate, discussionController.deleteReply);

// Delete discussion
router.delete('/discussions/:discussionId', authenticate, discussionController.deleteDiscussion);

module.exports = router;
