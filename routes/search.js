const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // นำเข้าโมเดลสินค้า

// เส้นทางการค้นหาสินค้า
router.get('/', async (req, res) => {
  const searchQuery = req.query.q;

  if (!searchQuery) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error searching products', error });
  }
});

module.exports = router;