const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ecom-demo-secret-2026';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ Admin mới có quyền thực hiện thao tác này' });
    }
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
