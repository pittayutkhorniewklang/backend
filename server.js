const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const Product = require('./models/Product');
const path = require('path');
const Order = require('./models/Order');
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

// API สำหรับอัปเดตสินค้า
// API สำหรับอัปเดตสินค้า
app.put('/products/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, category, brand, stock, price, description } = req.body;

  if (!name || !category || !brand || !stock || !price || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ตรวจสอบการอัปโหลดไฟล์
  let imageUrl = '';
  if (req.file) {
    imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, {
      name,
      category,
      brand,
      stock,
      price,
      description,
      imageUrl: imageUrl || req.body.imageUrl // ใช้ imageUrl ใหม่ถ้ามีการอัปโหลดไฟล์
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
  const { customer_name, order_items, delivery_price } = req.body;

  if (!customer_name || !order_items || order_items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: customer_name, order_items' });
  }

  // คำนวณราคารวมของสินค้าที่สั่งซื้อ
  let totalItemPrice = 0;
  
  order_items.forEach(item => {
    totalItemPrice += item.price * item.quantity;
  });

  const newOrder = new Order({
    customer_name,
    order_items,
    delivery_price,
    total_item_price: totalItemPrice,
    delivery_date: new Date()  // เพิ่มวันที่สั่งซื้อ
  });

  try {
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Error creating order' });
  }
});



// API สำหรับดึงคำสั่งซื้อทั้งหมด
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'order_items.productId',  // ทำการ populate ข้อมูลสินค้าจาก productId
        select: 'name price'  // เลือกเฉพาะฟิลด์ name และ price ของสินค้า
      })
      .lean();  // ใช้ lean() เพื่อแปลงข้อมูลเป็น JSON ที่จัดการได้ง่าย

    orders.forEach(order => {
      order.id = order._id;  // กำหนด _id จาก MongoDB เป็น id เพื่อใช้ใน frontend
      delete order._id;  // ลบ _id เพื่อหลีกเลี่ยงความซ้ำซ้อน
    });

    res.status(200).json(orders);  // ส่งข้อมูลคำสั่งซื้อทั้งหมดกลับไปยัง frontend
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});




// เปิดใช้งานเซิร์ฟเวอร์ที่พอร์ต 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});