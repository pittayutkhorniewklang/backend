const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const Product = require('./models/Product');
const path = require('path');
const Order = require('./models/Order'); //
const app = express();

// ตั้งค่า middleware
app.use(cors({
  origin: 'http://localhost:4200', // URL ของ Frontend
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type, Authorization'
}));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ให้บริการไฟล์ static จากโฟลเดอร์ uploads

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
      // จัดการกรณีที่ ID ไม่ถูกต้อง
      return res.status(400).json({ error: 'Invalid Product ID' });
    }
    res.status(500).json({ error: 'Error fetching product by ID' });
  }
});

// API สำหรับเพิ่มสินค้าใหม่
app.post('/products', upload.single('image'), async (req, res) => {
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

// API สำหรับลบสินค้า
app.delete('/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      // จัดการกรณีที่ ID ไม่ถูกต้อง
      return res.status(400).json({ error: 'Invalid Product ID' });
    }
    res.status(500).json({ error: 'Error deleting product' });
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

app.get('/orders/sales/monthly/:month', async (req, res) => {
  const month = req.params.month;
  try {
      const sales = await Order.aggregate([
          { $match: { createdAt: { $gte: new Date(`${month}-01`), $lt: new Date(`${month}-31`) } } },
          { $group: { _id: null, totalSales: { $sum: '$amount' } } }
      ]);
      res.status(200).json(sales);
  } catch (error) {
      res.status(500).json({ error: 'Error fetching monthly sales' });
  }
});

// API สำหรับรายงานสินค้าขายดี
app.get('/products/top-selling', async (req, res) => {
  try {
      const topSelling = await Order.aggregate([
          { $unwind: '$order_items' },
          { $group: { _id: '$order_items.productId', quantitySold: { $sum: '$order_items.quantity' } } },
          { $sort: { quantitySold: -1 } },
          { $limit: 10 }
      ]);
      res.status(200).json(topSelling);
  } catch (error) {
      res.status(500).json({ error: 'Error fetching top selling products' });
  }
});

// เปิดใช้งานเซิร์ฟเวอร์ที่พอร์ต 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
