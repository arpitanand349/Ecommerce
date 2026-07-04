const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, phone, paymentMethod } = req.body;

    if (!shippingAddress || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide shipping address and phone number' });
    }

    // Retrieve user's cart populated with product info
    const cart = await Cart.findOne({ user: req.user._id }).populate('products.product');

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty' });
    }

    // Verify stock and form transaction snapshot
    const orderProducts = [];
    for (const item of cart.products) {
      const product = item.product;
      if (!product) {
        return res.status(404).json({ success: false, message: 'One of the items in your cart is no longer available.' });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: "${product.title}". Stock available: ${product.stock}, you requested: ${item.quantity}. Please update your cart.`,
        });
      }

      orderProducts.push({
        product: product._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Deduct stock for each product
    for (const item of cart.products) {
      const product = item.product;
      product.stock -= item.quantity;
      await product.save();
    }

    // Create order document
    const order = await Order.create({
      user: req.user._id,
      products: orderProducts,
      shippingAddress,
      phone,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      totalPrice: cart.totalPrice,
    });

    // Reset user's cart
    cart.products = [];
    cart.totalPrice = 0;
    await cart.save();

    return res.status(201).json({ success: true, order, message: 'Order placed successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.status;

    // Handle stock adjustments for cancelled order transitions
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      // Put stock back
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    } else if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
      // User is restoring from cancelled state, deduct stock again
      // 1. Verify availability first
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (!product || product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot revert Cancelled status. Stock is insufficient for item: "${item.title}". Available: ${product ? product.stock : 0}`,
          });
        }
      }
      // 2. Perform deductions
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        product.stock -= item.quantity;
        await product.save();
      }
    }

    order.status = status;
    const updatedOrder = await order.save();

    return res.json({ success: true, order: updatedOrder, message: 'Order status updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
