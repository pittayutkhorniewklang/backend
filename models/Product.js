const mongoose = require('mongoose');

// สร้าง schema สำหรับสินค้า
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },  // ชื่อสินค้า
  price: { type: Number, required: true },  // ราคาสินค้า
  category: String,
  brand: String,
  stock: Number,
  description: String,
  imageUrl: String,  // URL รูปภาพ
  quantitySold: { type: Number, default: 0 }, // ตั้งค่าเริ่มต้นเป็น 0
});

module.exports = mongoose.model('Product', productSchema);