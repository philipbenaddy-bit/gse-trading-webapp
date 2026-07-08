import React, { useState, useEffect, useCallback } from 'react'
import api from '../lib/api-client'

interface Portfolio {
  id: string
  symbol: string
  quantity: number
  average_cost: number
  total_cost: number
}

interface Order {
  id: string
  symbol: string
  type: 'market' | 'limit'
  side: 'buy' | 'sell'
  quantity: number
  status: string
  created_at: string
}

interface TradingDashboardProps {
  userId: string // Get from authenticated context
  isAuthenticated: boolean
}

const TradingDashboard: React.FC<TradingDashboardProps> = ({ userId, isAuthenticated }) => {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [balance, setBalance] = useState({ balance: 0, locked_balance: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Security: Only render if authenticated
  if (!isAuthenticated) {
    return <div>Please log in to access the trading dashboard.</div>
  }

  // Validate user ID
  if (!userId || typeof userId !== 'string') {
    return <div>Invalid user session. Please log in again.</div>
  }

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load data using Supabase direct API (fast, real-time)
      const [portfolioData, ordersData, balanceData] = await Promise.all([
        api.portfolio.getPortfolio(userId),
        api.orders.getOrderHistory(userId),
        api.wallet.getBalance(userId),
      ])

      setPortfolio(portfolioData || [])
      setOrders(ordersData || [])
      setBalance(balanceData || { balance: 0, locked_balance: 0 })
    } catch (err) {
      console.error('Dashboard load error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const setupRealTimeSubscriptions = useCallback(() => {
    // Real-time portfolio updates
    const portfolioSubscription = api.portfolio.subscribeToPortfolio(userId, (payload) => {
      console.log('Portfolio update:', payload)
      try {
        if (payload.eventType === 'INSERT') {
          setPortfolio(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setPortfolio(prev => prev.map(item => 
            item.id === payload.new.id ? { ...item, ...payload.new } : item
          ))
        } else if (payload.eventType === 'DELETE') {
          setPortfolio(prev => prev.filter(item => item.id !== payload.old.id))
        }
      } catch (err) {
        console.error('Portfolio subscription error:', err)
      }
    })

    // Real-time order updates
    const ordersSubscription = api.orders.subscribeToOrders(userId, (payload) => {
      console.log('Order update:', payload)
      try {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id ? { ...order, ...payload.new } : order
          ))
        }
      } catch (err) {
        console.error('Orders subscription error:', err)
      }
    })

    // Cleanup subscriptions on unmount
    return () => {
      portfolioSubscription.unsubscribe()
      ordersSubscription.unsubscribe()
    }
  }, [userId])

  useEffect(() => {
    if (userId && isAuthenticated) {
      loadDashboardData()
      const cleanup = setupRealTimeSubscriptions()
      return cleanup
    }
  }, [userId, isAuthenticated, loadDashboardData, setupRealTimeSubscriptions])

  const validateOrderData = (orderData: any): boolean => {
    if (!orderData.symbol || typeof orderData.symbol !== 'string') return false
    if (!['market', 'limit'].includes(orderData.type)) return false
    if (!['buy', 'sell'].includes(orderData.side)) return false
    if (!orderData.quantity || orderData.quantity <= 0) return false
    if (orderData.type === 'limit' && (!orderData.limitPrice || orderData.limitPrice <= 0)) return false
    return true
  }

  const handlePlaceOrder = async (orderData: any) => {
    if (!validateOrderData(orderData)) {
      setError('Invalid order data')
      return
    }

    try {
      setActionLoading('place-order')
      setError(null)
      
      // Use NestJS for complex trading logic
      const result = await api.trading.placeOrder({
        symbol: orderData.symbol.toUpperCase(),
        type: orderData.type,
        side: orderData.side,
        quantity: Math.floor(orderData.quantity), // Ensure integer
        ...(orderData.type === 'limit' && { limitPrice: orderData.limitPrice })
      })
      
      console.log('Order placed:', result)
      // The order will appear in real-time via subscription
    } catch (err) {
      console.error('Place order error:', err)
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!orderId || typeof orderId !== 'string') {
      setError('Invalid order ID')
      return
    }

    try {
      setActionLoading(`cancel-${orderId}`)
      setError(null)
      
      // Use NestJS for order cancellation logic
      await api.trading.cancelOrder(orderId)
      console.log('Order cancelled')
      // The order status will update in real-time via subscription
    } catch (err) {
      console.error('Cancel order error:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeposit = async (amount: number) => {
    if (!amount || amount <= 0 || amount > 10000) { // Max deposit limit
      setError('Invalid deposit amount (must be between 1 and 10,000)')
      return
    }

    try {
      setActionLoading('deposit')
      setError(null)
      
      // Use NestJS for payment processing
      const result = await api.payments.deposit(amount)
      console.log('Deposit initiated:', result)
      // Balance will update when transaction completes
    } catch (err) {
      console.error('Deposit error:', err)
      setError(err instanceof Error ? err.message : 'Deposit failed')
    } finally {
      setActionLoading(null)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const sanitizeText = (text: string): string => {
    return text.replace(/[<>]/g, '') // Basic XSS prevention
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="trading-dashboard max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Trading Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {sanitizeText(error)}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Wallet Balance - Real-time via Supabase */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Wallet</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-600">Available Balance</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(balance.balance)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Locked Balance</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(balance.locked_balance)}
            </p>
          </div>
        </div>
        <button 
          onClick={() => handleDeposit(100)}
          disabled={actionLoading === 'deposit'}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {actionLoading === 'deposit' ? 'Processing...' : 'Deposit GHS 100'}
        </button>
      </div>

      {/* Portfolio - Real-time via Supabase */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
        {portfolio.length === 0 ? (
          <p className="text-gray-500">No holdings</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-right">Avg Cost</th>
                  <th className="px-4 py-2 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((holding) => (
                  <tr key={holding.id} className="border-t">
                    <td className="px-4 py-2 font-medium">
                      {sanitizeText(holding.symbol)}
                    </td>
                    <td className="px-4 py-2 text-right">{holding.quantity}</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(holding.average_cost)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(holding.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trading Section - Complex logic via NestJS */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Trade</h2>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handlePlaceOrder({
              symbol: 'GCB',
              type: 'market',
              side: 'buy',
              quantity: 10
            })}
            disabled={actionLoading === 'place-order'}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {actionLoading === 'place-order' ? 'Placing...' : 'Buy 10 GCB (Market)'}
          </button>
          <button 
            onClick={() => handlePlaceOrder({
              symbol: 'MTN',
              type: 'market',
              side: 'buy',
              quantity: 5
            })}
            disabled={actionLoading === 'place-order'}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {actionLoading === 'place-order' ? 'Placing...' : 'Buy 5 MTN (Market)'}
          </button>
        </div>
      </div>

      {/* Order History - Real-time via Supabase */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500">No orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Side</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-4 py-2 font-medium">
                      {sanitizeText(order.symbol)}
                    </td>
                    <td className="px-4 py-2">{order.type}</td>
                    <td className="px-4 py-2">
                      <span className={order.side === 'buy' ? 'text-green-600' : 'text-red-600'}>
                        {order.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{order.quantity}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'filled' ? 'bg-green-100 text-green-800' :
                        order.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {order.status === 'open' && (
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={actionLoading === `cancel-${order.id}`}
                          className="bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded disabled:opacity-50"
                        >
                          {actionLoading === `cancel-${order.id}` ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TradingDashboard