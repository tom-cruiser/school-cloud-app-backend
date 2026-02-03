const express = require('express');
const router = express.Router();
const houseController = require('../controllers/houseController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', houseController.getAllHouses);
router.post('/', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), houseController.createHouse);
router.put('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), houseController.updateHouse);
router.delete('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), houseController.deleteHouse);

module.exports = router;
