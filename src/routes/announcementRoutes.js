const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate } = require('../middleware/auth');

// All announcement endpoints require authentication
router.use(authenticate);

// Create announcement (Admin only)
router.post('/', announcementController.createAnnouncement);

// Get announcements for school
router.get('/', announcementController.getAnnouncements);

// Get announcement by ID
router.get('/:id', announcementController.getAnnouncementById);

// Update announcement (Admin only)
router.put('/:id', announcementController.updateAnnouncement);

// Delete announcement (Admin only)
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;
