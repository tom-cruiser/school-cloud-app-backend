const express = require('express');
const router = express.Router();
const termController = require('../controllers/termController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', termController.getAllTerms);
router.post('/', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), termController.createTerm);
router.put('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), termController.updateTerm);
router.delete('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), termController.deleteTerm);

module.exports = router;
