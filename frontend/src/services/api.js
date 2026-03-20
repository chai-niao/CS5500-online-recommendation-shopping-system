import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
};

// ---- Products ----
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getFestivals: () => api.get('/products/festivals'),
  search: (q, params) => api.get('/products', { params: { q, ...params } }),
};

// ---- Cart ----
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addItem: (productId, quantity = 1) => api.post('/cart/add', { productId, quantity }),
  updateItem: (productId, quantity) => api.put('/cart/update', { productId, quantity }),
  removeItem: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear'),
};

// ---- Orders ----
export const ordersAPI = {
  getOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  validatePromo: (code, subtotal) => api.post('/orders/validate-promo', { code, subtotal }),
};

// ---- Users ----
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  getViewHistory: (limit = 20) => api.get('/users/me/view-history', { params: { limit } }),
  updateMe: (data) => api.put('/users/me', data),
  changePassword: (currentPassword, newPassword) => api.put('/users/me/password', { currentPassword, newPassword }),
  addAddress: (data) => api.post('/users/me/addresses', data),
  deleteAddress: (addrId) => api.delete(`/users/me/addresses/${addrId}`),
};

// ---- Recommendations ----
export const recommendationsAPI = {
  getPersonalized: (limit) => api.get('/recommendations', { params: { limit } }),
  getFestival: () => api.get('/recommendations/festival'),
  getSimilar: (productId) => api.get(`/recommendations/similar/${productId}`),
};

// ---- Shopping Lists ----
export const listsAPI = {
  getLists: () => api.get('/lists'),
  createList: (name) => api.post('/lists', { name }),
  addItem: (listId, productId, name) => api.post(`/lists/${listId}/items`, { productId, name }),
  toggleItem: (listId, productId) => api.put(`/lists/${listId}/items/${productId}`),
  deleteList: (listId) => api.delete(`/lists/${listId}`),
  syncList: (listId) => api.post(`/lists/${listId}/sync`),
};

// ---- Chat ----
export const chatAPI = {
  sendMessage: (message, conversationHistory) => api.post('/chat/message', { message, conversationHistory }),
  getStatus: () => api.get('/chat/status'),
};

export default api;
