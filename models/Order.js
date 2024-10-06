// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer_name: String,
    order_items: Array,
    delivery_price: Number,
    delivery_date: Date,
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
