const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// API สำหรับดึงยอดขายรายเดือน
router.get('/sales/monthly/:month', async (req, res) => {
  const { month } = req.params;
  
  try {
    const salesData = await Order.aggregate([
      { $match: { delivery_date: { $regex: month } } }, // Match เดือนที่เลือก
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total_item_price" }
        }
      }
    ]);

    res.status(200).json(salesData[0] || { totalSales: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching monthly sales', details: err });
  }
});

// API สำหรับดึงสินค้าขายดี
router.get('/products/top-selling', async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$order_items" },
      { $group: { _id: "$order_items.productId", quantitySold: { $sum: "$order_items.quantity" } } },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json(topProducts);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching top-selling products', details: err });
  }
});

// API สำหรับดึงยอดขายตามช่วง
router.get('/sales/range', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const salesRange = await Order.aggregate([
      { 
        $match: { 
          delivery_date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      { 
        $group: {
          _id: null,
          totalSales: { $sum: "$total_item_price" }
        }
      }
    ]);

    res.status(200).json(salesRange[0] || { totalSales: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching sales range', details: err });
  }
});

// API สำหรับดึงข้อมูลยอดขายในกราฟ
router.get('/sales/chart', async (req, res) => {
  try {
    const chartData = await Order.aggregate([
      {
        $group: {
          _id: { year: { $year: "$delivery_date" }, month: { $month: "$delivery_date" } },
          totalSales: { $sum: "$total_item_price" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.status(200).json(chartData);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching sales chart data', details: err });
  }
});

module.exports = router;
