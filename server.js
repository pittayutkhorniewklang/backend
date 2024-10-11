const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const Product = require('./models/Product');
const path = require('path');
const Order = require('./models/Order');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('./models/User');
const bcrypt = require('bcrypt'); // ใช้สำหรับการเข้ารหัสรหัสผ่าน

// ตั้งค่า middleware
app.use(cors({
  origin: 'http://localhost:4200',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type, Authorization'
}));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// เชื่อมต่อ MongoDB
mongoose.connect('mongodb+srv://puntuch66:Toey1234@cluster0.1zty8.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('เชื่อมต่อ MongoDB สำเร็จ'))
  .catch((err) => console.log('เชื่อมต่อ MongoDB ล้มเหลว', err));

// ตั้งค่า storage สำหรับ multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// ตั้งค่า express-session
app.use(session({
  secret: 'your_secret_key', // คีย์สำหรับเข้ารหัส session
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: 'mongodb+srv://puntuch66:Toey1234@cluster0.1zty8.mongodb.net/test' }),
  cookie: { secure: false }
}));

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Please log in first' });
  }
};

// Middleware สำหรับตรวจสอบว่าเป็นแอดมิน
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admins only' });
  }
};

// API การลงทะเบียน
app.post('/register', async (req, res) => {
  const { username, email, phone, address, province, district, postalCode, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      phone,
      address,
      province,
      district,
      postalCode,
      password: hashedPassword,
      role: role || 'user' // ถ้าไม่ได้ส่ง role มา จะตั้งค่าเป็น 'user' เริ่มต้น
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});


// API การล็อกอิน
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { username: user.username, role: user.role };
      res.json({ message: 'Login successful', role: user.role });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// API สำหรับดึงสินค้าทั้งหมด (ผู้ใช้ทั่วไปสามารถเข้าถึงได้)

// API สำหรับดึงสินค้าทั้งหมด
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// API สำหรับดึงสินค้าตาม ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid Product ID' });
    }
    res.status(500).json({ error: 'Error fetching product by ID' });
  }
});

app.delete('/products/:id',isAdmin, async (req, res) => {
  console.log('Deleting Product ID:', req.params.id); // ดูค่า ID ที่รับเข้ามา
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid Product ID' });
    }
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// API สำหรับเพิ่มสินค้าใหม่
app.post('/products',isAdmin, upload.single('image'), async (req, res) => {
  const { name, category, brand, stock, price, description } = req.body;
  if (!name || !category || !brand || !stock || !price || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let imageUrl = '';
  if (req.file) {
    imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  }

  const newProduct = new Product({
    name,
    category,
    brand,
    stock,
    price,
    description,
    imageUrl
  });

  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error saving product' });
  }
});

// API สำหรับอัปเดตสินค้า
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, brand, stock, price, description } = req.body;

  if (!name || !category || !brand || !stock || !price || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log('Form Data:', req.body); // แสดงข้อมูล req.body แทน

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, {
      name,
      category,
      brand,
      stock,
      price,
      description
    }, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error updating product' });
  }
});

// API สำหรับลบสินค้า
app.delete('/orders/:id', async (req, res) => {
  console.log('Deleting Order ID:', req.params.id); // เพิ่มบรรทัดนี้เพื่อดูค่า ID ที่ได้รับ
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }
    res.status(500).json({ error: 'Error deleting order' });
  }
});

// API สำหรับสร้างคำสั่งซื้อใหม่
app.post('/orders/create', async (req, res) => {
  const { customer_name, order_items } = req.body;
  if (!customer_name || !order_items || order_items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: customer_name, order_items' });
  }

  try {
    const newOrder = req.body;
    const result = await Order.create(newOrder);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error creating order' });
  }
});

// API สำหรับดึงคำสั่งซื้อทั้งหมด
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().lean();
    orders.forEach(order => {
      order.id = order._id;
      delete order._id;
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// เปิดใช้งานเซิร์ฟเวอร์ที่พอร์ต 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
