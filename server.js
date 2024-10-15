const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// นำเข้า routes
const loginRoutes = require('./routes/login');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const searchRoutes = require('./routes/search');
const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type, Authorization'
}));

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect('mongodb+srv://puntuch66:Toey1234@cluster0.1zty8.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('เชื่อมต่อ MongoDB สำเร็จ'))
  .catch((err) => console.log('เชื่อมต่อ MongoDB ล้มเหลว', err));

app.use('/login', loginRoutes);
app.use('/orders', orderRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/search', searchRoutes);  // ตั้งค่าเส้นทางสำหรับการค้นหา

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
