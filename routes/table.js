const express = require('express');
const router = express.Router();
const {
  createTable,
  getAllTables,
  getTableById,
  updateTable,
  deleteTable,
  getTableByQRCode,
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/qr/:qrCode', getTableByQRCode);

// Restaurant owner routes
router.use(protect);
router.use(authorize('restaurant'));

router.post('/', createTable);
router.get('/restaurant/:restaurantId', getAllTables);
router.get('/:id', getTableById);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);

module.exports = router;