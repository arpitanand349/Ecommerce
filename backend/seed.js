const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

// Load environment config
dotenv.config({ path: path.join(__dirname, '.env') });

const products = [
  {
    title: 'Organic Wildflower Honey (500g)',
    description: 'Pure, raw, unpasteurized wildflower honey gathered from mountain forests. Naturally sweet, full of nutrients and enzymes, and perfect as a sugar substitute.',
    price: 12.99,
    category: 'Food',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400'
  },
  {
    title: 'Wireless Mechanical Keyboard',
    description: 'Premium mechanical keyboard with clicky blue switches, customizable RGB backlighting, Bluetooth multi-pairing, and a massive rechargeable battery.',
    price: 89.99,
    category: 'Electronics',
    stock: 12,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400'
  },
  {
    title: 'Medium-Roasted Coffee Beans (1kg)',
    description: 'Organic Arabica coffee beans sustainably sourced from high-altitude farms. Medium-roasted to preserve notes of dark chocolate and vanilla.',
    price: 24.50,
    category: 'Beverages',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=400'
  },
  {
    title: 'Full-Grain Leather Backpack',
    description: 'Classic, durable leather backpack featuring double straps, a cushioned laptop compartment, brass buckles, and hidden exterior slots.',
    price: 119.99,
    category: 'Fashion',
    stock: 8,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400'
  },
  {
    title: 'Smartwatch Sport Fit',
    description: 'High-performance smartwatch featuring optical heart rate tracking, auto sleep logs, integrated GPS, and smart notifications with a 7-day battery.',
    price: 149.99,
    category: 'Electronics',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'
  },
  {
    title: 'Ceramic Succulent Plant Pot',
    description: 'Minimalist white ceramic geometric succulent planter complete with bamboo tray. Perfect for small desk plants or kitchen herb gardens.',
    price: 15.75,
    category: 'Home',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=400'
  }
];

const seedData = async () => {
  try {
    // Establish connection
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/simple-ecommerce');
    console.log('Connected to MongoDB for database seeding...');

    // Delete existing documents
    await User.deleteMany();
    await Product.deleteMany();
    await Cart.deleteMany();
    await Order.deleteMany();
    console.log('Cleared existing collections (Users, Products, Carts, Orders)...');

    // Create products
    const seededProducts = await Product.insertMany(products);
    console.log(`Seeded ${seededProducts.length} mock products.`);

    // Create administrator
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'adminpassword', // Will be hashed pre-save by User model middleware
      role: 'admin'
    });
    console.log('Seeded Admin Account -> Username: admin@example.com / Password: adminpassword');

    // Create user
    const normalUser = await User.create({
      name: 'Jane Doe',
      email: 'user@example.com',
      password: 'userpassword',
      role: 'user'
    });
    console.log('Seeded Normal Account -> Username: user@example.com / Password: userpassword');

    // Create carts for accounts
    await Cart.create({
      user: adminUser._id,
      products: [],
      totalPrice: 0
    });
    await Cart.create({
      user: normalUser._id,
      products: [],
      totalPrice: 0
    });
    console.log('Generated empty shopping carts for seeded accounts.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Database Seeding Failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
