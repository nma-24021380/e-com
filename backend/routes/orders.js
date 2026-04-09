const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

function parseOrder(o) {
  return {
    ...o,
    items: JSON.parse(o.items || '[]'),
    shipping: JSON.parse(o.shipping || '{}')
  };
}

// GET /api/orders
// Admin → tất cả đơn; Customer → chỉ đơn của họ
router.get('/', authMiddleware, (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare('SELECT * FROM orders ORDER BY date DESC').all();
  } else {
    rows = db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY date DESC').all(req.user.id);
  }
  res.json(rows.map(parseOrder));
});

// GET /api/orders/:id – Chi tiết đơn hàng
router.get('/:id', authMiddleware, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

  // Bảo mật: Nếu không phải admin và không phải chủ đơn hàng -> chặn
  if (req.user.role !== 'admin' && order.userId !== req.user.id) {
    return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này' });
  }

  res.json(parseOrder(order));
});

// POST /api/orders — Đặt hàng
router.post('/', authMiddleware, (req, res) => {
  const { items, total, shipping } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'Giỏ hàng trống' });

  const userId = req.user.id;
  const paymethod = shipping?.paymethod || 'COD';
  const date = new Date().toISOString();
  const id = Date.now();

  // Kiểm tra tồn kho trước
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
    if (!product || product.stock < item.quantity) {
      return res.status(409).json({
        message: `Sản phẩm "${item.name}" không đủ tồn kho (Còn: ${product ? product.stock : 0})`
      });
    }
  }

  // Transaction: lưu đơn + trừ kho + cập nhật totalSpent (nếu Chuyển khoản)
  db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (id, userId, date, total, status, items, shipping) VALUES (?, ?, ?, ?, 'Chờ xử lý', ?, ?)`
    ).run(id, userId, date, total, JSON.stringify(items), JSON.stringify(shipping));

    for (const item of items) {
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.id);
    }

    // Chuyển khoản → cộng chi tiêu ngay
    if (paymethod === 'Chuyển khoản' && userId) {
      db.prepare('UPDATE customers SET totalSpent = totalSpent + ? WHERE id = ?').run(total, userId);
    }
  })();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.status(201).json(parseOrder(order));
});

// PUT /api/orders/:id/status — Cập nhật trạng thái (Admin only)
router.put('/:id/status', adminMiddleware, (req, res) => {
  const { status } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  if (order.status === 'Đã hủy') return res.status(400).json({ message: 'Đơn đã bị hủy, không thể thay đổi' });

  const paymethod = JSON.parse(order.shipping || '{}').paymethod || 'COD';
  const items = JSON.parse(order.items || '[]');

  db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, order.id);

    if (status === 'Đã hủy') {
      // Hoàn kho
      for (const item of items) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.id);
      }
      // Chuyển khoản → hoàn tiền (trừ chi tiêu)
      if (paymethod === 'Chuyển khoản' && order.userId) {
        db.prepare('UPDATE customers SET totalSpent = MAX(0, totalSpent - ?) WHERE id = ?').run(order.total, order.userId);
      }
    } else if (status === 'Đã giao' && paymethod === 'COD' && order.userId) {
      // COD → cộng chi tiêu khi giao thành công
      db.prepare('UPDATE customers SET totalSpent = totalSpent + ? WHERE id = ?').run(order.total, order.userId);
    }
  })();

  res.json({ message: `Đã cập nhật trạng thái thành "${status}"`, status });
});

module.exports = router;
