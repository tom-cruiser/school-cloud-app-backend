const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// All routes require authentication
router.use(authenticate);

// Get all departments - accessible by all authenticated users
router.get('/', departmentController.getAllDepartments);

// Get department by ID
router.get('/:id', departmentController.getDepartmentById);

// Create department - admin only
router.post(
  '/',
  authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  departmentController.createDepartment
);

// Update department - admin only
router.put(
  '/:id',
  authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  departmentController.updateDepartment
);

// Delete department - admin only
router.delete(
  '/:id',
  authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  departmentController.deleteDepartment
);

module.exports = router;
