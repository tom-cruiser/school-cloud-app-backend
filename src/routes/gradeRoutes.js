const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// Get grades (all authenticated users)
router.get(
  '/',
  authenticate,
  authorize(['STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'ADMIN']),
  gradeController.getGrades
);

// Get grade statistics
router.get(
  '/stats',
  authenticate,
  authorize(['STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'ADMIN']),
  gradeController.getGradeStats
);

// Get grade by ID
router.get(
  '/:gradeId',
  authenticate,
  authorize(['STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'ADMIN']),
  gradeController.getGradeById
);

// Create a new grade
router.post(
  '/',
  authenticate,
  authorize(['TEACHER', 'SCHOOL_ADMIN', 'ADMIN']),
  gradeController.createGrade
);

// Update a grade
router.put(
  '/:gradeId',
  authenticate,
  authorize(['TEACHER', 'SCHOOL_ADMIN', 'ADMIN']),
  gradeController.updateGrade
);

// Delete a grade
router.delete(
  '/:gradeId',
  authenticate,
  authorize(['TEACHER', 'SCHOOL_ADMIN', 'ADMIN']),
  gradeController.deleteGrade
);

module.exports = router;
