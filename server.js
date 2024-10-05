const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Product = require('./models/Product'); // นำเข้าโมเดลจากไฟล์แยก
const path = require('path');

// สร้างแอป Express
const app = express();

// ตั้งค่า middleware
app.use(cors()); // เปิดใช้งาน CORS เพื่ออนุญาตการเข้าถึงจากแหล่งอื่น ๆ
app.use(bodyParser.json()); // รองรับ JSON requests
app.use(express.static(path.join(__dirname, 'public')));

// เชื่อมต่อ MongoDB
mongoose.connect('mongodb+srv://puntuch66:Toey1234@cluster0.1zty8.mongodb.net/test', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
})
.then(() => console.log('เชื่อมต่อ MongoDB สำเร็จ'))
.catch((err) => console.log('เชื่อมต่อ MongoDB ล้มเหลว', err));

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

// API สำหรับเพิ่มสินค้าใหม่
app.post('/products', async (req, res) => {
  console.log('Request body:', req.body);  // ตรวจสอบข้อมูลที่ส่งมาจาก Frontend
  const newProduct = new Product(req.body);
  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(400).json({ error: 'Error saving product' });
  }
});

// API สำหรับแก้ไขสินค้า
app.put('/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: 'Error updating product' });
  }
});

// API สำหรับลบสินค้า
app.delete('/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error deleting product' });
  }
});

// เปิดใช้งานเซิร์ฟเวอร์ที่พอร์ต 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
