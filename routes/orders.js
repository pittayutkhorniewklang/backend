const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.post('/create', async (req, res) => {
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
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Error creating order' });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'order_items.productId',
        select: 'name price'
      })
      .lean();
      
    orders.forEach(order => {
      order.id = order._id;
      delete order._id;

      order.order_items.forEach(item => {
        if (!item.productId) {
          item.productId = { name: 'No Product', price: 0 };
        }
      });
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting order' });
  }
});

module.exports = router;
