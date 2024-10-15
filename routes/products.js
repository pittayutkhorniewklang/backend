const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid Product ID' });
    }
    res.status(500).json({ error: 'Error fetching product by ID' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  const { name, category, brand, stock, price, description } = req.body;

  if (!name || !category || !brand || !stock || !price || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let imageUrl = '';
  if (req.file) {
    imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  }

  const newProduct = new Product({
    name,
    category,
    brand,
    stock,
    price,
    description,
    imageUrl
  });

  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error saving product:', error);  // เพิ่มการแสดงข้อความ error ในฝั่งเซิร์ฟเวอร์
    res.status(500).json({ error: 'Error saving product' });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  const { name, category, brand, stock, price, description } = req.body;
  const { id } = req.params;

  if (!name || !category || !brand || !stock || !price || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let imageUrl = '';
  if (req.file) {
    imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, {
      name,
      category,
      brand,
      stock,
      price,
      description,
      imageUrl: imageUrl || req.body.imageUrl
    }, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error updating product' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
});

module.exports = router;
