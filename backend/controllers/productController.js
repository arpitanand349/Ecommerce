const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    // Filter by category if provided
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search by title (regex, case-insensitive)
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      return res.json({ success: true, product });
    } else {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Invalid product ID or server error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock } = req.body;

    if (!title || !description || !price || !category || stock === undefined) {
      // Clean up uploaded file if validation failed
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: 'Please provide all required fields (title, description, price, category, stock)' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a product image' });
    }

    // Path pattern: /uploads/image-fieldname-timestamp.jpg
    const imagePath = `/uploads/${req.file.filename}`;

    const product = new Product({
      title,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      image: imagePath,
    });

    const createdProduct = await product.save();
    return res.status(201).json({ success: true, product: createdProduct });
  } catch (error) {
    // Clean up file if server crashed
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.category = category || product.category;
    product.stock = stock !== undefined ? Number(stock) : product.stock;

    if (req.file) {
      // Unlink/Delete the previous image file if it exists
      if (product.image) {
        const oldImagePath = path.join(__dirname, '..', product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Failed to delete old image file:', err.message);
          });
        }
      }
      product.image = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await product.save();
    return res.json({ success: true, product: updatedProduct });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete image file from workspace uploads folder
    if (product.image) {
      const imagePath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Failed to delete product image file:', err.message);
        });
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
