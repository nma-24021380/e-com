/**
 * api.js – E-com API Client
 * Lớp trung gian duy nhất giữa frontend và Express/SQLite backend.
 * Tất cả các trang HTML chỉ import file này để gọi API.
 */

const BASE_URL = ''; // Cùng origin với server

// ─────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────
const auth = {
  getToken() {
    return localStorage.getItem('ecom_token');
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('ecom_user'));
    } catch {
      return null;
    }
  },
  setSession(token, user) {
    localStorage.setItem('ecom_token', token);
    localStorage.setItem('ecom_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('ecom_token');
    localStorage.removeItem('ecom_user');
  },
  logout() {
    this.clearSession();
    window.location.href = 'login.html';
  }
};

// ─────────────────────────────────────────
// CORE FETCH WRAPPER
// ─────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(BASE_URL + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Token hết hạn → clear session và redirect
    if (res.status === 403 && data.message?.includes('Token')) {
      auth.clearSession();
      window.location.href = 'login.html';
      return;
    }
    throw new Error(data.message || `HTTP ${res.status}`);
  }

  return data;
}

// ─────────────────────────────────────────
// API METHODS
// ─────────────────────────────────────────
const api = {

  // ── AUTH ──────────────────────────────
  async login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    auth.setSession(data.token, data.user);
    return data.user;
  },

  async register(name, email, phone, password) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password })
    });
    auth.setSession(data.token, data.user);
    return data.user;
  },

  async getMe() {
    return apiFetch('/api/auth/me');
  },

  // ── PRODUCTS ──────────────────────────
  async getProducts() {
    return apiFetch('/api/products');
  },

  async getProduct(id) {
    return apiFetch(`/api/products/${id}`);
  },

  async createProduct(data) {
    return apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateProduct(id, data) {
    return apiFetch(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteProduct(id) {
    return apiFetch(`/api/products/${id}`, { method: 'DELETE' });
  },

  // ── ORDERS ────────────────────────────
  async getOrders() {
    return apiFetch('/api/orders');
  },

  async createOrder(items, total, shipping) {
    return apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ items, total, shipping })
    });
  },

  async updateOrderStatus(id, status) {
    return apiFetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // ── CUSTOMERS (Admin) ─────────────────
  async getCustomers() {
    return apiFetch('/api/customers');
  },

  async lockCustomer(id) {
    return apiFetch(`/api/customers/${id}/lock`, { method: 'PUT' });
  },

  async deleteCustomer(id) {
    return apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
  }
};
