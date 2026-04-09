const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'ecommerce.db'));

// Hiệu suất tốt hơn với WAL mode
db.pragma('journal_mode = WAL');

// Tạo bảng
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    price    INTEGER NOT NULL,
    desc     TEXT    DEFAULT '',
    image    TEXT    DEFAULT '',
    category TEXT    DEFAULT 'Khác',
    stock    INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS customers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    UNIQUE NOT NULL,
    password     TEXT    NOT NULL,
    phone        TEXT    DEFAULT '',
    registerDate TEXT    DEFAULT '',
    totalSpent   INTEGER DEFAULT 0,
    isLocked     INTEGER DEFAULT 0,
    isDeleted    INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id       INTEGER PRIMARY KEY,
    userId   INTEGER,
    date     TEXT,
    total    INTEGER DEFAULT 0,
    status   TEXT    DEFAULT 'Chờ xử lý',
    items    TEXT    DEFAULT '[]',
    shipping TEXT    DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed dữ liệu demo (chỉ chạy 1 lần)
const seedDone = db.prepare("SELECT value FROM meta WHERE key = 'seeded'").get();

if (!seedDone) {
  const hash = bcrypt.hashSync('123', 10);

  const insertProduct = db.prepare(
    `INSERT INTO products (name, price, desc, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)`
  );
  insertProduct.run('Tai nghe không dây Zenith Pro', 1500000, 'Tai nghe chống ồn chủ động (ANC) cao cấp, pin dùng tới 30 giờ.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 'Tai nghe', 20);
  insertProduct.run('Đồng hồ thông minh FitVantage Tracker', 2100000, 'Theo dõi sức khỏe toàn diện, đo nhịp tim, nồng độ oxy trong máu (SpO2).', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 'Đồng hồ', 5);
  insertProduct.run('Bàn phím cơ Royal Kludge', 950000, 'Bàn phím cơ không dây, hỗ trợ hotswap, đèn nền RGB cá nhân hóa.', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80', 'Phụ kiện', 0);
  insertProduct.run('Balo Laptop Mark Ryden', 650000, 'Chống nước đỉnh cao, tích hợp cổng sạc USB, phù hợp cho dân văn phòng.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', 'Balo', 50);

  const insertCustomer = db.prepare(
    `INSERT INTO customers (name, email, password, phone, registerDate, totalSpent, isLocked, isDeleted) VALUES (?, ?, ?, ?, ?, ?, 0, 0)`
  );
  insertCustomer.run('Nguyễn Văn A', 'nva@gmail.com', hash, '0901234567', '2026-01-15', 1500000);
  insertCustomer.run('Trần Thị B', 'ttb@gmail.com', hash, '0987654321', '2026-03-22', 2100000);
  insertCustomer.run('Lê Văn C', 'lvc@yahoo.com', hash, '0912233445', '2026-04-01', 0);

  const insertOrder = db.prepare(
    `INSERT INTO orders (id, userId, date, total, status, items, shipping) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insertOrder.run(10001, 1, '2026-01-20T10:00:00.000Z', 1500000, 'Đã giao', '[]', '{"paymethod":"Chuyển khoản"}');
  insertOrder.run(10002, 2, '2026-03-25T14:30:00.000Z', 2100000, 'Đã giao', '[]', '{"paymethod":"COD"}');

  db.prepare("INSERT INTO meta (key, value) VALUES ('seeded', 'true')").run();
  console.log('✅ Database đã được khởi tạo với dữ liệu demo.');
}

module.exports = db;
