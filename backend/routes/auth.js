const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Tài khoản Admin cố định
  if (email === 'admin' && password === '123') {
    const user = { id: 0, name: 'Admin', email: 'admin', role: 'admin' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(email);
  if (!customer) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  if (customer.isDeleted) return res.status(403).json({ message: 'Tài khoản không tồn tại hoặc đã bị xóa' });
  if (customer.isLocked) return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa do vi phạm chính sách' });

  const valid = bcrypt.compareSync(password, customer.password);
  if (!valid) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

  const user = {
    id: customer.id, name: customer.name, email: customer.email,
    phone: customer.phone, registerDate: customer.registerDate,
    totalSpent: customer.totalSpent, role: 'customer'
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user });
});

// GET /api/auth/me – Lấy thông tin tài khoản hiện tại (từ DB)
router.get('/me', authMiddleware, (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({ id: 0, name: 'Admin', email: 'admin', role: 'admin' });
  }

  const customer = db.prepare('SELECT id, name, email, phone, registerDate, totalSpent FROM customers WHERE id = ?').get(req.user.id);
  if (!customer) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

  res.json({ ...customer, role: 'customer' });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  const exists = db.prepare('SELECT id FROM customers WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ message: 'Email này đã được sử dụng' });

  const hashed = bcrypt.hashSync(password, 10);
  const registerDate = new Date().toISOString().split('T')[0];

  const result = db.prepare(
    `INSERT INTO customers (name, email, password, phone, registerDate, totalSpent, isLocked, isDeleted) VALUES (?, ?, ?, ?, ?, 0, 0, 0)`
  ).run(name, email, hashed, phone || '', registerDate);

  const user = { id: result.lastInsertRowid, name, email, phone: phone || '', registerDate, totalSpent: 0, role: 'customer' };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
  res.status(201).json({ token, user });
});

module.exports = router;
