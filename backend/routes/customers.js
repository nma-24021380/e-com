const express = require('express');
const router = express.Router();
const db = require('../database');
const { adminMiddleware } = require('../middleware/auth');

const SAFE_FIELDS = 'id, name, email, phone, registerDate, totalSpent, isLocked, isDeleted';

// GET /api/customers (Admin only)
router.get('/', adminMiddleware, (req, res) => {
  const customers = db.prepare(`SELECT ${SAFE_FIELDS} FROM customers`).all();
  res.json(customers);
});

// PUT /api/customers/:id/lock — Khóa / mở khóa (Admin only)
router.put('/:id/lock', adminMiddleware, (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
  if (customer.isDeleted) return res.status(400).json({ message: 'Tài khoản đã bị xóa' });

  db.prepare('UPDATE customers SET isLocked = ? WHERE id = ?').run(customer.isLocked ? 0 : 1, req.params.id);
  const updated = db.prepare(`SELECT ${SAFE_FIELDS} FROM customers WHERE id = ?`).get(req.params.id);
  res.json(updated);
});

// DELETE /api/customers/:id — Soft delete (Admin only)
router.delete('/:id', adminMiddleware, (req, res) => {
  const customer = db.prepare('SELECT id, isDeleted FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
  if (customer.isDeleted) return res.status(400).json({ message: 'Tài khoản đã bị xóa' });

  db.prepare('UPDATE customers SET isDeleted = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Đã xóa tài khoản khách hàng' });
});

module.exports = router;
