const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

router.post('/create', async (req, res) => {
  console.log(req.body);  // Log ข้อมูลที่รับมาเพื่อดูว่าถูกต้องหรือไม่

  const { customer_name, order_items, delivery_price } = req.body;

  if (!customer_name || !order_items || order_items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: customer_name, order_items' });
  }

  let totalItemPrice = 0;
  order_items.forEach(item => {
    totalItemPrice += item.price * item.quantity;
  });

  const newOrder = new Order({
    customer_name,
    order_items,
    delivery_price,
    total_item_price: totalItemPrice,
    delivery_date: new Date()
  });

  try {
    const savedOrder = await newOrder.save();

      // อัปเดต quantitySold ของสินค้าที่ขายได้
      order_items.forEach(async (item) => {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantitySold: item.quantity } // เพิ่มจำนวนที่ขายได้
        });
      });

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error creating order' });
  }
});

// API สำหรับดึงคำสั่งซื้อทั้งหมด
router.get('/', async (req, res) => {
  try {
    // ดึงข้อมูลคำสั่งซื้อทั้งหมดและ populate ข้อมูลสินค้าตาม productId
    const orders = await Order.find()
      .populate({
        path: 'order_items.productId', // populate รายการสินค้าตาม productId
        select: 'name price'  // ดึงเฉพาะ name และ price
      })
      .lean(); // lean เพื่อให้ได้ข้อมูลในรูปแบบ JSON ธรรมดา

    res.status(200).json(orders);  // ส่งข้อมูลกลับไปให้ frontend
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error fetching orders' });
  }
});



router.delete('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error });
  }
});




module.exports = router;
