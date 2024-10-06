const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Product = require('./models/Product'); // นำเข้าโมเดลสินค้า
const Order = require('./models/Order'); // นำเข้าโมเดลคำสั่งซื้อ
const path = require('path');

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
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const statuses = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ status: statuses[dbState] });
});

// API สำหรับดึงสินค้าทั้งหมด
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();  // ดึงสินค้าทั้งหมด
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
app.post('/products', async (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || !price || !stock) {
    return res.status(400).json({ error: 'Missing required fields: name, price, stock' });
  }

  const newProduct = new Product(req.body);
  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(400).json({ error: 'Error saving product' });
  }
});

// API สำหรับแก้ไขสินค้า พร้อมการตรวจสอบข้อมูล
app.put('/products/:id', async (req, res) => {
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
app.delete('/products/:id', async (req, res) => {
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
