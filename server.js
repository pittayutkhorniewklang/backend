const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // นำเข้า multer สำหรับการอัปโหลดไฟล์
const Product = require('./models/Product'); // นำเข้าโมเดลสินค้า
const Order = require('./models/Order'); // นำเข้าโมเดลคำสั่งซื้อ
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('./models/User');
const bcrypt = require('bcrypt'); // ใช้สำหรับการเข้ารหัสรหัสผ่าน
const app = express();


// ตั้งค่า middleware
app.use(cors());
app.use(bodyParser.json());

// ให้บริการไฟล์ Angular static จากโฟลเดอร์ dist/test7/browser
app.use(express.static(path.join(__dirname, 'dist/test7/browser')));

// เชื่อมต่อ MongoDB
mongoose.connect('mongodb+srv://puntuch66:Toey1234@cluster0.1zty8.mongodb.net/test', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
})
.then(() => console.log('เชื่อมต่อ MongoDB สำเร็จ'))
.catch((err) => console.log('เชื่อมต่อ MongoDB ล้มเหลว', err));

// ตรวจสอบสถานะการเชื่อมต่อ MongoDB
app.get('/db-status', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const statuses = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ status: statuses[dbState] });
});

// ตั้งค่า body-parser
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

// ตั้งค่า storage สำหรับ multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // โฟลเดอร์สำหรับจัดเก็บไฟล์
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // ตั้งชื่อไฟล์
  }
});

const upload = multer({ storage: storage });

// Middleware สำหรับตรวจสอบการล็อกอิน
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
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product by ID' });
  }
});

// API สำหรับเพิ่มสินค้าใหม่ พร้อมการตรวจสอบข้อมูล
app.post('/products',isAdmin, upload.single('image'), async (req, res) => {
  const { name, category, brand, stock, price, description } = req.body;

  // ตรวจสอบข้อมูล
  if (!name || !category || !brand || !stock || !price || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newProduct = new Product({
    name,
    category,
    brand,
    stock,
    price,
    description,
    imageUrl: `http://localhost:3000/uploads/${req.file.filename}` // เก็บ URL ของภาพ
  });

  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error saving product' });
  }
});

// API สำหรับแก้ไขสินค้า พร้อมการตรวจสอบข้อมูล
app.put('/products/:id',isAdmin, async (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || !price || !stock) {
    return res.status(400).json({ error: 'Missing required fields: name, price, stock' });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: 'Error updating product' });
  }
});

// API สำหรับลบสินค้า พร้อมการจัดการข้อผิดพลาดเพิ่มเติม
app.delete('/products/:id',isAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid Product ID' });
    }
    res.status(400).json({ error: 'Error deleting product' });
  }
});

// API สำหรับสร้างคำสั่งซื้อใหม่ พร้อมการตรวจสอบข้อมูล
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
      order.id = order._id;  // กำหนดค่า id จาก _id ของ MongoDB
      delete order._id;      // ลบฟิลด์ _id ถ้าไม่ต้องการใช้
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// API สำหรับอัปเดตสถานะคำสั่งซื้อ
app.put('/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(400).json({ error: 'Error updating order' });
  }
});

// API สำหรับลบคำสั่งซื้อ
app.delete('/orders/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error deleting order' });
  }
});

// จัดการกรณีไม่พบเส้นทาง (Route Not Found)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route Not Found' });
});

// Fallback สำหรับ Angular routes ทั้งหมด ใช้ไฟล์ index.html ในโฟลเดอร์ browser
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/test7/browser/index.html'));
});

// เปิดใช้งานเซิร์ฟเวอร์ที่พอร์ต 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
