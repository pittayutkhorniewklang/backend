const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // นำเข้าโมเดล User

const app = express();
app.use(express.json()); // เพื่อรองรับการ parse ข้อมูล JSON

// Route สำหรับการล็อกอิน
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // ตรวจสอบว่าผู้ใช้มีอยู่ในฐานข้อมูลหรือไม่
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username' });
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // ล็อกอินสำเร็จ ส่งข้อมูลผู้ใช้กลับไป
    res.status(200).json({
      message: 'Login successful',
      username: user.username,
      role: user.role // ส่ง role กลับไปให้ frontend
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// เปิดใช้งานเซิร์ฟเวอร์ที่พอร์ต 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
