import i18n from '../i18n.js';

// Resolve backend URL from Vite environment variable (for Vercel / Render deployment)
// Examples: 'https://my-urban-store.onrender.com' or 'https://my-urban-store.onrender.com/api'
const RAW_BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '').trim();
const CLEAN_BACKEND_URL = RAW_BACKEND_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
const API_BASE = CLEAN_BACKEND_URL ? `${CLEAN_BACKEND_URL}/api` : '/api';

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': i18n.language || 'en',
  };

  const token = localStorage.getItem('urban_store_token') || localStorage.getItem('shopmart_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = (i18n.language === 'kn' && data.errorKn) ? data.errorKn : (data.error || 'Request failed');
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getProfile: () => request('/auth/profile'),
  updateLanguage: (preferred_language) => request('/auth/language', { method: 'PUT', body: JSON.stringify({ preferred_language }) }),

  // Products & Search
  getProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.category) searchParams.append('category', params.category);
    if (params.minPrice) searchParams.append('min_price', params.minPrice);
    if (params.maxPrice) searchParams.append('max_price', params.maxPrice);
    if (params.city) searchParams.append('city', params.city);
    if (params.userLat) searchParams.append('user_lat', params.userLat);
    if (params.userLng) searchParams.append('user_lng', params.userLng);
    if (params.instantOnly) searchParams.append('instant_only', 'true');
    if (params.maxDistance) searchParams.append('max_distance', params.maxDistance);
    searchParams.append('lang', i18n.language || 'en');

    return request(`/products?${searchParams.toString()}`);
  },
  getAutocomplete: (q) => request(`/products/autocomplete?q=${encodeURIComponent(q)}&lang=${i18n.language || 'en'}`),
  getCategories: () => request(`/products/categories?lang=${i18n.language || 'en'}`),
  getProductById: (id, userLat = null, userLng = null) => {
    const searchParams = new URLSearchParams();
    if (userLat) searchParams.append('user_lat', userLat);
    if (userLng) searchParams.append('user_lng', userLng);
    searchParams.append('lang', i18n.language || 'en');
    return request(`/products/${id}?${searchParams.toString()}`);
  },

  // Cart & 10-Minute Stock Reservation
  getCart: () => request('/cart'),
  addToCart: (productId, quantity = 1, size = 'M') => request('/cart/add', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity, size }) }),
  updateCartItem: (productId, quantity, size = 'M') => request('/cart/update', { method: 'PUT', body: JSON.stringify({ product_id: productId, quantity, size }) }),
  removeFromCart: (productId) => request(`/cart/remove/${productId}`, { method: 'DELETE' }),
  clearCart: () => request('/cart/clear', { method: 'DELETE' }),
  getCartReservation: () => request('/cart/reservation'),
  renewCartReservation: () => request('/cart/reservation/renew', { method: 'POST' }),

  // Wishlist (Per-User Authenticated)
  getWishlist: () => request('/wishlist'),
  toggleWishlist: (productId) => request('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ product_id: productId }) }),
  removeFromWishlist: (productId) => request(`/wishlist/${productId}`, { method: 'DELETE' }),

  // Orders & Fulfillment
  placeOrder: (orderData) => request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getOrder: (id) => request(`/orders/${id}`),
  getMyOrders: () => request('/orders/my-orders'),

  // Customer Requests (Returns, Cancellations, Restock Alerts)
  createCustomerRequest: (data) => request('/requests/create', { method: 'POST', body: JSON.stringify(data) }),
  getMyRequests: () => request('/requests/my'),

  // Stores & Demo Locations
  getStores: () => request('/stores'),
  getDemoLocations: () => request('/stores/demo-locations'),

  // Admin Endpoints
  getAdminKpis: () => request('/admin/dashboard-kpis'),
  createProduct: (productData) => request('/admin/products', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id, productData) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  getAllOrders: () => request('/admin/orders'),
  updateOrderStatus: (orderId, status) => request(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  
  // POS Billing
  createOfflineBill: (data) => request('/admin/billing', { method: 'POST', body: JSON.stringify(data) }),
  getBillingHistory: (params = {}) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') sp.append(k, v);
    }
    return request(`/admin/billing/history?${sp.toString()}`);
  },

  // Purchase History & Sales Summaries
  getPurchaseHistory: (params = {}) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') sp.append(k, v);
    }
    return request(`/admin/purchase-history?${sp.toString()}`);
  },

  // Admin Process Customer Requests
  getAdminRequests: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.status) sp.append('status', params.status);
    if (params.type) sp.append('type', params.type);
    return request(`/admin/requests?${sp.toString()}`);
  },
  updateAdminRequestStatus: (id, data) => request(`/admin/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Lost Opportunity Reports
  getLostOpportunities: () => request('/admin/reports/lost-opportunities'),
  restockLostOpportunity: (data) => request('/admin/reports/restock-opportunity', { method: 'POST', body: JSON.stringify(data) }),

  getSystemActivity: () => request('/admin/system-activity'),
};
