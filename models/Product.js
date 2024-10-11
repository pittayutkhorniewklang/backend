const mongoose = require('mongoose');

// สร้าง schema สำหรับสินค้า
const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  brand: String,
  stock: Number,
  price: Number,
  description: String,
  imageUrl: String  // URL รูปภาพถ้ามี
});

module.exports = mongoose.model('Product', productSchema);
