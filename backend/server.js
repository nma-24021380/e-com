const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Parse JSON body
app.use(express.json());

// Serve static files (HTML, CSS, JS) từ thư mục root của ecommerce-site
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));

// Mọi route không phải /api → trả về index.html (SPA fallback)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log('\n==========================================');
  console.log(`🚀  E-com Server chạy tại: http://localhost:${PORT}`);
  console.log('==========================================');
  console.log('   Tài khoản Admin  : admin / 123');
  console.log('   Khách hàng mẫu   : nva@gmail.com / 123');
  console.log('==========================================\n');
});
