const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },  // เชื่อมโยงกับ Product model
  quantity: Number  // จำนวนสินค้าที่สั่งซื้อ
});

const orderSchema = new mongoose.Schema({
  customer_name: String,
  order_items: [orderItemSchema],  // รายการสินค้าที่สั่งซื้อ
  delivery_price: Number,
  delivery_date: Date,
  total_item_price: Number,
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
