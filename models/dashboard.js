
const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  date: { type: Date, required: true },  // วันที่สั่งซื้อ
  month: { type: String, required: true },  // เดือนในรูปแบบ 'YYYY-MM'
  totalPrice: { type: Number, required: true },  // ยอดรวมของการสั่งซื้อ
  productId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],  // อ้างอิงไปยังสินค้า
});

module.exports = mongoose.model('dashboard', dashboardSchema);


