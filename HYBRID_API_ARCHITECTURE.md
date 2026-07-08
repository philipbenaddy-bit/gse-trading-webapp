# 🔄 Hybrid API Architecture for GSE Trading Platform

## Overview

Your GSE Trading Platform now uses a **hybrid API architecture** that combines the best of both worlds:
- **NestJS Backend** for complex business logic
- **Supabase Direct API** for simple CRUD operations and real-time features

## 🏗 Architecture Diagram

```
Frontend (React)
    ├── Complex Operations → NestJS API → Supabase Database
    └── Simple CRUD + Real-time → Supabase API → Supabase Database
```

## 📋 API Responsibility Split

### 🔧 NestJS Backend Handles:
- **Authentication & Authorization**
  - User login/registration
  - JWT token management
  - Password hashing and validation

- **Trading Operations**
  - Order placement and validation
  - Order cancellation
  - Market data integration (GSE API)
  - Order matching logic

- **Payment Processing**
  - Paystack integration
  - Deposit/withdrawal workflows
  - Transaction verification

- **Business Logic**
  - KYC verification
  - Trading rules and limits
  - Fee calculations
  - Risk management

### ⚡ Supabase Direct API Handles:
- **User Profile Management**
  - View/update profile information
  - Account settings

- **Portfolio Operations**
  - View portfolio holdings
  - Real-time portfolio updates
  - Performance calculations

- **Transaction History**
  - View transaction records
  - Filter and search transactions

- **Order History**
  - View past orders
  - Real-time order status updates

- **Wallet Balance**
  - View current balance
  - Real-time balance updates

## 🔒 Security Implementation

### Row Level Security (RLS) Policies
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id::uuid);

-- Service role (NestJS) has full access
CREATE POLICY "Service role full access users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');
```

### Authentication Flow
1. **User Login** → NestJS validates credentials
2. **JWT Token** → Stored in frontend for NestJS requests
3. **Supabase Auth** → Automatic RLS enforcement for direct API calls

## 🚀 Benefits of This Architecture

### ✅ Performance
- **Faster Reads**: Direct Supabase API eliminates backend processing
- **Real-time Updates**: WebSocket subscriptions for live data
- **Reduced Load**: NestJS only handles complex operations

### ✅ Scalability
- **Database Scaling**: Supabase handles connection pooling
- **API Scaling**: Distribute load between NestJS and Supabase
- **Real-time Scaling**: Built-in Supabase real-time infrastructure

### ✅ Development Speed
- **Auto-generated APIs**: Instant CRUD endpoints from Supabase
- **Type Safety**: Generated TypeScript types
- **Less Backend Code**: Reduce NestJS controller complexity

### ✅ Reliability
- **Redundancy**: Multiple API paths for different operations
- **Managed Infrastructure**: Supabase handles database management
- **Built-in Features**: Authentication, real-time, storage included

## 📊 API Usage Examples

### Frontend Implementation
```typescript
// Complex operation - Use NestJS
const placeOrder = await api.trading.placeOrder({
  symbol: 'GCB',
  type: 'market',
  side: 'buy',
  quantity: 10
})

// Simple read - Use Supabase direct
const portfolio = await api.portfolio.getPortfolio(userId)

// Real-time subscription - Use Supabase
const subscription = api.portfolio.subscribeToPortfolio(userId, (update) => {
  console.log('Portfolio updated:', update)
})
```

### Available Endpoints

#### NestJS Endpoints (Complex Logic)
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/orders` - Place trading order
- `DELETE /api/v1/orders/:id` - Cancel order
- `POST /api/v1/wallet/deposit` - Initiate deposit
- `GET /api/v1/market/live` - Get market data

#### Supabase Endpoints (Direct CRUD)
- `GET /rest/v1/users?id=eq.{userId}` - Get user profile
- `GET /rest/v1/portfolio?user_id=eq.{userId}` - Get portfolio
- `GET /rest/v1/orders?user_id=eq.{userId}` - Get order history
- `GET /rest/v1/transactions?wallet_id=eq.{walletId}` - Get transactions
- `GET /rest/v1/wallets?user_id=eq.{userId}` - Get wallet balance

## 🔄 Real-time Features

### WebSocket Subscriptions
```typescript
// Portfolio updates
supabase
  .channel('portfolio-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'portfolio',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle real-time portfolio updates
  })
  .subscribe()

// Order status updates
supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle real-time order updates
  })
  .subscribe()
```

## 🛠 Implementation Files

### Frontend Files Created:
- `frontend/src/lib/api-client.ts` - Hybrid API client
- `frontend/src/components/TradingDashboard.tsx` - Example usage
- `frontend/.env.example` - Environment configuration

### Database Security:
- Row Level Security policies enabled
- User data isolation enforced
- Service role access for NestJS backend

## 🎯 Next Steps

1. **Update your NestJS controllers** to focus on complex operations only
2. **Implement authentication sync** between NestJS JWT and Supabase auth
3. **Add real-time subscriptions** to your React components
4. **Test the hybrid approach** with your existing frontend
5. **Monitor performance** and adjust the split as needed

## 📈 Migration Strategy

### Phase 1: Parallel Implementation
- Keep existing NestJS endpoints
- Add Supabase direct calls for read operations
- Test both approaches side by side

### Phase 2: Gradual Migration
- Move simple CRUD operations to Supabase
- Keep complex business logic in NestJS
- Add real-time features progressively

### Phase 3: Optimization
- Remove redundant NestJS endpoints
- Optimize database queries
- Fine-tune real-time subscriptions

This hybrid architecture gives you the flexibility to use the right tool for each job while maintaining security and performance!