const mongoose = require('mongoose');

// สร้าง schema สำหรับสินค้า
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },  // ชื่อสินค้า
  price: { type: Number, required: true },  // ราคาสินค้า
  category: String,
  brand: String,
  stock: Number,
  description: String,
  imageUrl: String  // URL รูปภาพถ้ามี
});

module.exports = mongoose.model('Product', productSchema);
