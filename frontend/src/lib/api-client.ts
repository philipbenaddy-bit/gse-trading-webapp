import { createClient } from '@supabase/supabase-js'
import axios, { AxiosError } from 'axios'
import { Database } from '../types/supabase'

// Environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const NEST_API_URL = import.meta.env.VITE_NEST_API_URL || 'http://localhost:3001/api/v1';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Supabase client for direct database operations
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// NestJS backend client for complex operations
export const nestApi = axios.create({
  baseURL: NEST_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Enhanced error handling
const handleApiError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    // Handle unauthorized - redirect to login
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  }
  throw error
}

// Add auth token and error handling to NestJS requests
nestApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

nestApi.interceptors.response.use(
  (response) => response,
  handleApiError
)

// Secure API routing strategy
export const api = {
  // Use NestJS for complex business logic (server-side validation)
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      try {
        const response = await nestApi.post('/auth/login', credentials)
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token)
        }
        return response.data
      } catch (error) {
        throw new Error('Login failed')
      }
    },
    
    register: async (userData: any) => {
      try {
        return await nestApi.post('/auth/register', userData)
      } catch (error) {
        throw new Error('Registration failed')
      }
    },
    
    logout: () => {
      localStorage.removeItem('access_token')
      return supabase.auth.signOut()
    },
  },
  
  // Trading operations (complex business logic)
  trading: {
    placeOrder: async (order: any) => {
      try {
        return await nestApi.post('/orders', order)
      } catch (error) {
        throw new Error('Failed to place order')
      }
    },
    
    cancelOrder: async (orderId: string) => {
      try {
        return await nestApi.delete(`/orders/${orderId}`)
      } catch (error) {
        throw new Error('Failed to cancel order')
      }
    },
    
    getMarketData: async () => {
      try {
        return await nestApi.get('/market/live')
      } catch (error) {
        throw new Error('Failed to fetch market data')
      }
    },
  },
  
  // Payment operations (requires server-side processing)
  payments: {
    deposit: async (amount: number) => {
      if (amount <= 0) throw new Error('Invalid amount')
      try {
        return await nestApi.post('/wallet/deposit', { amount })
      } catch (error) {
        throw new Error('Deposit failed')
      }
    },
    
    withdraw: async (amount: number) => {
      if (amount <= 0) throw new Error('Invalid amount')
      try {
        return await nestApi.post('/wallet/withdraw', { amount })
      } catch (error) {
        throw new Error('Withdrawal failed')
      }
    },
  },
  
  // Use Supabase for simple CRUD and real-time (with RLS protection)
  user: {
    getProfile: async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, kyc_status, is_email_verified, is_phone_verified, created_at')
        .eq('id', userId)
        .single()
      
      if (error) throw new Error('Failed to fetch profile')
      return data
    },
    
    updateProfile: async (userId: string, updates: Partial<Database['public']['Tables']['users']['Update']>) => {
      // Sanitize updates - only allow safe fields
      const safeUpdates = {
        first_name: updates.first_name,
        last_name: updates.last_name,
        phone: updates.phone,
      }
      
      const { data, error } = await supabase
        .from('users')
        .update(safeUpdates)
        .eq('id', userId)
        .select('id, email, first_name, last_name, phone, kyc_status')
        .single()
      
      if (error) throw new Error('Failed to update profile')
      return data
    },
  },
  
  // Portfolio operations (read-only for frontend)
  portfolio: {
    getPortfolio: async (userId: string) => {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error('Failed to fetch portfolio')
      return data || []
    },
    
    // Real-time portfolio updates with error handling
    subscribeToPortfolio: (userId: string, callback: (payload: any) => void) => {
      return supabase
        .channel(`portfolio-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'portfolio',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            try {
              callback(payload)
            } catch (error) {
              console.error('Portfolio subscription error:', error)
            }
          }
        )
        .subscribe()
    },
  },
  
  // Wallet operations (read-only for frontend)
  wallet: {
    getBalance: async (userId: string) => {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance, locked_balance, updated_at')
        .eq('user_id', userId)
        .single()
      
      if (error) throw new Error('Failed to fetch wallet balance')
      return data
    },
    
    getTransactions: async (userId: string, limit = 50, offset = 0) => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          status,
          description,
          reference,
          created_at,
          wallets!inner(user_id)
        `)
        .eq('wallets.user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) throw new Error('Failed to fetch transactions')
      return data || []
    },
  },
  
  // Order history (read-only for frontend)
  orders: {
    getOrderHistory: async (userId: string, limit = 100) => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw new Error('Failed to fetch order history')
      return data || []
    },
    
    // Real-time order updates with error handling
    subscribeToOrders: (userId: string, callback: (payload: any) => void) => {
      return supabase
        .channel(`orders-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            try {
              callback(payload)
            } catch (error) {
              console.error('Orders subscription error:', error)
            }
          }
        )
        .subscribe()
    },
  },
}

export default api