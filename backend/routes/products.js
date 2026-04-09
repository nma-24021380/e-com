const express = require('express');
const router = express.Router();
const db = require('../database');
const { adminMiddleware } = require('../middleware/auth');

// GET /api/products
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
});

// POST /api/products (Admin only)
router.post('/', adminMiddleware, (req, res) => {
  const { name, price, desc, image, category, stock } = req.body;
  if (!name || price === undefined) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });

  const result = db.prepare(
    `INSERT INTO products (name, price, desc, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, price, desc || '', image || '', category || 'Khác', stock || 0);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

// PUT /api/products/:id (Admin only)
router.put('/:id', adminMiddleware, (req, res) => {
  const { name, price, desc, image, category, stock } = req.body;
  const exists = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

  db.prepare(
    `UPDATE products SET name=?, price=?, desc=?, image=?, category=?, stock=? WHERE id=?`
  ).run(name, price, desc || '', image || '', category || 'Khác', stock || 0, req.params.id);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(product);
});

// DELETE /api/products/:id (Admin only)
router.delete('/:id', adminMiddleware, (req, res) => {
  const exists = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Đã xóa sản phẩm thành công' });
});

module.exports = router;
