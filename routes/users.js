const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
  const { username, email, phone, address, province, district, postalCode, password } = req.body;

  if (!username || !email || !password || !phone || !address || !province || !district || !postalCode) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      phone,
      address,
      province,
      district,
      postalCode,
      password: hashedPassword,
      role: 'user'
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

module.exports = router;
