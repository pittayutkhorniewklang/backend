const express = require('express');
const router = express.Router();
const dashboard = require('../models/dashboard');
const Product = require('../models/Product');
const Order = require('../models/Order');

// API สำหรับดึงข้อมูลยอดขายรายเดือน
router.get('/monthly/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const salesData = await Order.aggregate([
      {
        $match: {
          delivery_date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total_item_price' }
        }
      }
    ]);

    res.status(200).json({ totalSales: salesData[0]?.totalSales || 0 });
  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    res.status(500).json({ error: 'Error fetching monthly sales' });
  }
});

// API สินค้าขายดี
router.get('/top-selling', async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: '$order_items' },
      {
        $group: {
          _id: '$order_items.productId',
          totalSold: { $sum: '$order_items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'products',  // ชื่อ collection ที่ใช้ใน MongoDB
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          name: '$productDetails.name',
          price: '$productDetails.price',
          imageUrl: '$productDetails.imageUrl', // ดึง URL รูปภาพสินค้า
          quantitySold: '$totalSold'
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({ products: topProducts });
  } catch (error) {
    console.error('Error fetching top-selling products:', error);
    res.status(500).json({ error: 'Error fetching top-selling products' });
  }
});

// API สำหรับดึงข้อมูลยอดขายตามช่วงเวลา
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    const sales = await Order.find({
      delivery_date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    console.log('Sales:', sales);  // ตรวจสอบข้อมูล sales ที่ดึงมา
    const totalSales = sales.reduce((acc, item) => acc + item.total_item_price, 0);
    res.status(200).json({ sales, totalSales });
  } catch (error) {
    console.error('Error fetching sales by range:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลยอดขายตามช่วงเวลาได้' });
  }
});


module.exports = router;
