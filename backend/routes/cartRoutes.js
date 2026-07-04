const express = require('express');
const {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection to all routes in this file
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartQuantity);
router.delete('/remove/:id', removeFromCart);

module.exports = router;
