const mongoose = require('mongoose');

// สร้าง schema สำหรับ order items
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },  // เชื่อมโยงกับ Product model
  quantity: Number  // จำนวนสินค้าที่สั่งซื้อ
});

// สร้าง schema สำหรับ orders
const orderSchema = new mongoose.Schema({
  customer_name: String,
  order_items: [orderItemSchema],  // รายการสินค้าที่สั่งซื้อ
  delivery_price: Number,
  delivery_date: Date,
  total_item_price: Number,
});

// สร้าง model
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
