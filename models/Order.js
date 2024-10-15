const mongoose = require('mongoose');

// สร้าง schema สำหรับ order items
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },  // เชื่อมโยงกับ Product model
  quantity: { type: Number, required: true },  // จำนวนสินค้าที่สั่งซื้อ
});

// สร้าง schema สำหรับ orders
const orderSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },  // ชื่อผู้สั่งซื้อ
  order_items: [orderItemSchema],  // รายการสินค้าที่สั่งซื้อ
  delivery_price: { type: Number, required: true },  // ราคาค่าจัดส่ง
  delivery_date: { type: Date, default: Date.now },  // วันที่จัดส่ง (ค่าเริ่มต้นเป็นวันที่ปัจจุบัน)
  total_item_price: { type: Number, required: true },  // ราคาสินค้ารวมทั้งหมด
});

// สร้าง model
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
