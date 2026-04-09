/**
 * data.js – Client-side helpers
 * Chỉ quản lý: Giỏ hàng (LocalStorage), định dạng UI, navigation header.
 * Mọi thứ liên quan đến products/orders/customers đã chuyển sang api.js + backend.
 */

// ─────────────────────────────────────────
// CART (client-side – ok để dùng localStorage)
// ─────────────────────────────────────────
function getCart() {
  return JSON.parse(localStorage.getItem('ecommerce_cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('ecommerce_cart', JSON.stringify(cart));
}

function clearCart() {
  localStorage.removeItem('ecommerce_cart');
}

// ─────────────────────────────────────────
// FORMAT UTILITIES
// ─────────────────────────────────────────
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

// ─────────────────────────────────────────
// AUTH WRAPPERS (thin wrappers cho code cũ)
// ─────────────────────────────────────────
function getCurrentUser() {
  return auth.getUser();
}

function logoutUser() {
  auth.logout();
}

// ─────────────────────────────────────────
// CART BADGE
// ─────────────────────────────────────────
function updateCartBadge() {
  const cart = getCart();
  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = totalItems;
    cartCountEl.style.display = totalItems > 0 ? 'block' : 'none';
  }
}

// ─────────────────────────────────────────
// ADD TO CART (dùng product data đã có sẵn)
// ─────────────────────────────────────────
function addToCart(product) {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return; }
  if (user.role === 'admin') { alert('Admin không thể mua hàng!'); return; }
  if (product.stock <= 0) { alert('Sản phẩm này đã hết hàng!'); return; }

  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);

  if (existing) {
    if (existing.quantity + 1 > product.stock) {
      alert(`Chỉ còn tối đa ${product.stock} sản phẩm trong kho!`);
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  updateCartBadge();
  showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
}

// ─────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.getElementById('ecom-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ecom-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    background: type === 'error' ? 'var(--danger-color)' : 'var(--success-color)',
    color: 'white',
    padding: '0.85rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.9rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    zIndex: '9999',
    opacity: '0',
    transform: 'translateY(10px)',
    transition: 'opacity 0.3s, transform 0.3s'
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─────────────────────────────────────────
// HEADER NAVIGATION
// ─────────────────────────────────────────
function updateHeaderNavigation() {
  const user = getCurrentUser();
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  const adminLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.href.includes('admin.html'));
  const cartLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.href.includes('cart.html'));

  // Xóa các link auth cũ để rebuild
  navLinks.querySelectorAll('.auth-login, .auth-logout, .auth-profile').forEach(el => el.remove());

  if (!user) {
    if (adminLink) adminLink.style.display = 'none';
    if (cartLink) cartLink.style.display = 'none';
    const loginLink = document.createElement('a');
    loginLink.href = 'login.html';
    loginLink.className = 'auth-login';
    loginLink.textContent = 'Đăng nhập';
    navLinks.appendChild(loginLink);
  } else if (user.role === 'admin') {
    if (adminLink) adminLink.style.display = 'flex';
    if (cartLink) cartLink.style.display = 'none';
  } else {
    if (adminLink) adminLink.style.display = 'none';
    if (cartLink) cartLink.style.display = 'flex';
    const profileLink = document.createElement('a');
    profileLink.href = 'profile.html';
    profileLink.className = 'auth-profile';
    profileLink.textContent = 'Trang cá nhân';
    navLinks.appendChild(profileLink);
  }

  if (user) {
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.className = 'auth-logout';
    logoutLink.textContent = `Đăng xuất (${user.name})`;
    logoutLink.onclick = (e) => { e.preventDefault(); logoutUser(); };
    navLinks.appendChild(logoutLink);
  }
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  updateHeaderNavigation();
});
