import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — try refresh token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, user, logout, setAuth } = useAuthStore.getState();
      if (refreshToken && user) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', {
            userId: user.id,
            refreshToken,
          });
          const { accessToken, refreshToken: newRefresh } = res.data;
          setAuth(user, accessToken, newRefresh);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// Auth
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Market
export const marketApi = {
  getLive: () => api.get('/market/live'),
  getLiveBySymbol: (symbol: string) => api.get(`/market/live/${symbol}`),
  getEquities: () => api.get('/market/equities'),
  getEquity: (symbol: string) => api.get(`/market/equities/${symbol}`),
};

// Orders
export const ordersApi = {
  create: (data: any) => api.post('/orders', data),
  getAll: (status?: string) => api.get('/orders', { params: { status } }),
  getById: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.delete(`/orders/${id}`),
};

// Portfolio
export const portfolioApi = {
  get: () => api.get('/portfolio'),
};

// Wallet
export const walletApi = {
  get: () => api.get('/wallet'),
  deposit: (amount: number) => api.post('/wallet/deposit', { amount }),
  verify: (reference: string) => api.get('/wallet/verify', { params: { reference } }),
  withdraw: (data: any) => api.post('/wallet/withdraw', data),
  getTransactions: () => api.get('/wallet/transactions'),
};

// Users
export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  submitKyc: (data: any) => api.patch('/users/kyc', data),
};

// AI
export const aiApi = {
  chat: (message: string, history?: { role: string; content: string }[]) =>
    api.post('/ai/chat', { message, history: history || [] }),
  getInsight: (symbol: string) => api.get(`/ai/insights/${symbol}`),
  getSentiment: (symbol: string, headlines: string[]) =>
    api.post(`/ai/sentiment/${symbol}`, { headlines }),
  getPortfolioAnalysis: () => api.get('/ai/portfolio-analysis'),
};

// Analytics
export const analyticsApi = {
  getMarketMetrics: () => api.get('/analytics/market-metrics'),
  getSectors: () => api.get('/analytics/sectors'),
  getPerformance: (timeframe = '1M') =>
    api.get('/analytics/performance', { params: { timeframe } }),
  getTradingStats: () => api.get('/analytics/trading-stats'),
  exportData: (type: 'portfolio' | 'orders' | 'transactions') =>
    api.get('/analytics/export', { params: { type }, responseType: 'blob' }),
};
