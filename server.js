const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');
const User = require('./models/User'); // นำเข้าโมเดล User
const Product = require('./models/Product'); // นำเข้าโมเดล Product
const Order = require('./models/Order'); // นำเข้าโมเดล Order

const app = express();

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

// API สำหรับการสมัครสมาชิก
app.post('/register', async (req, res) => {
  const { username, email, phone, address, province, district, postalCode, password } = req.body;

  // ตรวจสอบว่าข้อมูลครบถ้วน
  if (!username || !email || !password || !phone || !address || !province || !district || !postalCode) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // ตรวจสอบว่ามีผู้ใช้ที่มีอีเมลนี้แล้วหรือไม่
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // เข้ารหัสรหัสผ่านก่อนบันทึก
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใหม่
    const newUser = new User({
      username,
      email,
      phone,
      address,
      province,
      district,
      postalCode,
      password: hashedPassword,
      role: 'user' // ค่าเริ่มต้นเป็น 'user'
    });

    // บันทึกผู้ใช้ลงฐานข้อมูล
    await newUser.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// API สำหรับล็อกอิน
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    res.status(200).json({
      message: 'Login successful',
      username: user.username,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

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

// API สำหรับลบสินค้า
app.delete('/products/:id', async (req, res) => {
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
app.post('/products', upload.single('image'), async (req, res) => {
  const { name, category, brand, stock, price, description } = req.body;

  if (!name || !category || !brand || !stock || !price || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ตรวจสอบการอัปโหลดไฟล์
  let imageUrl = '';
  if (req.file) {
    imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    console.log('Uploaded Image URL:', imageUrl); // แสดง URL ของภาพที่อัปโหลด
  } else {
    console.log('No file uploaded'); // ตรวจสอบว่าไม่มีไฟล์ถูกอัปโหลด
  }

  const newProduct = new Product({
    name,
    category,
    brand,
    stock,
    price,
    description,
    imageUrl // บันทึก URL ของภาพ
  });

  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error saving product' });
  }
});

// เปิดใช้งานเซิร์ฟเวอร์ที่พอร์ต 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
