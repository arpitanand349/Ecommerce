# Simple E-Commerce Store

A complete, production-ready MERN Stack E-Commerce Store featuring a Node.js/Express MVC backend and a highly polished, responsive HTML5/CSS3/Vanilla JS frontend. The application runs on a single server, preventing CORS issues.

---

## 🛠️ Technology Stack
- **Frontend**: HTML5, CSS3 (Custom Variables, CSS Grids, Glassmorphism, Micro-animations), Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose ORM
- **Authentication**: JSON Web Tokens (JWT) + bcryptjs password hashing
- **File Uploads**: Multer
- **Environment**: dotenv

---

## 📂 Folder Structure

```
ecommerce-store/
│
├── backend/
│   ├── config/          # DB connection configuration
│   ├── controllers/     # Controller logic (Auth, Product, Cart, Order)
│   ├── middleware/      # Auth validator & Multer upload filter
│   ├── models/          # Mongoose Schemas (User, Product, Cart, Order)
│   ├── routes/          # Express routing (Auth, Product, Cart, Order)
│   ├── uploads/         # Uploaded product image files
│   ├── utils/           # JWT token generation
│   ├── .env             # Port, Mongo URI and JWT secret
│   ├── server.js        # Main server entrypoint
│   └── seed.js          # Database seeding script
│
├── frontend/
│   ├── css/
│   │   └── styles.css   # Main stylesheet (White + Green theme)
│   ├── js/
│   │   ├── api.js       # HTTP client and authentication handler
│   │   ├── toast.js     # Global toast notification alerts
│   │   ├── layout.js    # Shared header/footer layout generator
│   │   ├── index.js     # Home catalog controller
│   │   ├── login.js     # Login controller
│   │   ├── register.js  # Registration controller
│   │   ├── product.js   # Product details controller
│   │   ├── cart.js      # Cart controller
│   │   ├── checkout.js  # Checkout controller
│   │   ├── orders.js    # Order history controller
│   │   └── admin.js     # Admin panel controller
│   ├── index.html       # Products catalog home
│   ├── login.html       # Sign-in page
│   ├── register.html    # Sign-up page
│   ├── product.html     # Product detail sheet
│   ├── cart.html        # Shopping cart view
│   ├── checkout.html    # Address and billing details
│   ├── orders.html      # Personal order tracking
│   └── admin.html       # Admin dashboard
│
├── package.json         # Server scripts & dependencies
└── README.md            # Installation & guide
```

---
The application will be served at: **[https://ecommerce-backend-xxxx.onrender.com](https://ecommerce-backend-xxxx.onrender.com)**

---

## 🔑 Seeded Demo Accounts

You can log in immediately using the following accounts:

### 👤 Standard Customer Account
- **Email**: `user@example.com`
- **Password**: `userpassword`
- **Permissions**: Browse products, manage personal cart, place orders (Cash on Delivery), view order history.

### 🛡️ Administrator Account
- **Email**: `admin@example.com`
- **Password**: `adminpassword`
- **Permissions**: Add/edit/delete products (with image uploads), view all system orders, update order status.

---

## 🌐 API Routes Reference

### Authentication
- `POST /api/auth/register` - Create user account & auto-creates cart.
- `POST /api/auth/login` - Validate credentials & return JWT.
- `GET /api/auth/profile` - Retrieve account profile details (JWT protected).

### Products
- `GET /api/products` - List products (supports query parameters `?search=...` and `?category=...`).
- `GET /api/products/:id` - Fetch single product.
- `POST /api/products` - Create new product with image file upload (JWT + Admin only).
- `PUT /api/products/:id` - Update existing product with optional image file replacement (JWT + Admin only).
- `DELETE /api/products/:id` - Delete product and delete associated file from storage (JWT + Admin only).

### Cart
- `GET /api/cart` - Retrieve current user's shopping cart (JWT protected).
- `POST /api/cart/add` - Add product or raise quantity (JWT protected).
- `PUT /api/cart/update` - Set exact item quantity (JWT protected).
- `DELETE /api/cart/remove/:id` - Remove product from cart (JWT protected).

### Orders
- `POST /api/orders` - Place order, deduct stock, and empty cart (JWT protected).
- `GET /api/orders/myorders` - List personal order history (JWT protected).
- `GET /api/orders` - List all system orders (JWT + Admin only).
- `PUT /api/orders/:id` - Shift order status; restores product stock if status shifts to Cancelled (JWT + Admin only).
