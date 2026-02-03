const express = require('express');
const router = express.Router();
const transportRouteController = require('../controllers/transportRouteController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', transportRouteController.getAllTransportRoutes);
router.post('/', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), transportRouteController.createTransportRoute);
router.put('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), transportRouteController.updateTransportRoute);
router.delete('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), transportRouteController.deleteTransportRoute);

module.exports = router;
