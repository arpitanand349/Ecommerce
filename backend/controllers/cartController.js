const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to recalculate cart totalPrice based on current db prices
const updateCartTotals = async (cart) => {
  let total = 0;
  for (const item of cart.products) {
    const product = await Product.findById(item.product);
    if (product) {
      total += product.price * item.quantity;
    }
  }
  cart.totalPrice = Number(total.toFixed(2));
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('products.product');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, products: [], totalPrice: 0 });
    }

    return res.json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add product to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = quantity ? Number(quantity) : 1;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, products: [], totalPrice: 0 });
    }

    // Check if item already exists in the cart
    const itemIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      const newQty = cart.products[itemIndex].quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} units available in stock. You already have ${cart.products[itemIndex].quantity} in cart.` });
      }
      cart.products[itemIndex].quantity = newQty;
    } else {
      if (qty > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} units available in stock.` });
      }
      cart.products.push({ product: productId, quantity: qty });
    }

    await updateCartTotals(cart);
    await cart.save();

    await cart.populate('products.product');
    return res.json({ success: true, cart, message: 'Product added to cart' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
const updateCartQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity are required' });
    }

    const qty = Number(quantity);
    if (qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (qty > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available in stock.` });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.products[itemIndex].quantity = qty;
      await updateCartTotals(cart);
      await cart.save();

      await cart.populate('products.product');
      return res.json({ success: true, cart, message: 'Cart quantity updated' });
    } else {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove product from cart
// @route   DELETE /api/cart/remove/:id
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const productId = req.params.id;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.products = cart.products.filter(
      (item) => item.product.toString() !== productId
    );

    await updateCartTotals(cart);
    await cart.save();

    await cart.populate('products.product');
    return res.json({ success: true, cart, message: 'Product removed from cart' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
};
