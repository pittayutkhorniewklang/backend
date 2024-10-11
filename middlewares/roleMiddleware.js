// Middleware สำหรับตรวจสอบ role
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Admins only' });
    }
  };
  
  // Middleware สำหรับตรวจสอบการล็อกอิน
  const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      res.status(401).json({ error: 'Please log in first' });
    }
  };
  
  module.exports = { isAdmin, isAuthenticated };
  