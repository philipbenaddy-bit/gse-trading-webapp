# Authentication Bug Fix Summary

## Problem
Users were experiencing multiple issues:
1. Being logged out immediately after registration
2. Couldn't log back in with their credentials (401 "Invalid credentials" error)
3. Getting 404 "Wallet not found" errors after successful login
4. Unable to access portfolio or place orders

## Root Cause
The application uses **custom JWT authentication** (not Supabase Auth), but the `users` table has Row Level Security (RLS) policies that expect `auth.uid()` from Supabase Auth.

When the backend tried to authenticate users during login:
1. The `findByEmailWithPassword()` method used the **anon client** (regular Supabase client)
2. The anon client is subject to RLS policies
3. RLS policies check for `auth.uid()`, which doesn't exist in custom JWT auth
4. Query returns `null` → authentication fails → "Invalid credentials" error

## Solution
Changed all user service methods to use the **admin client** (service role key) instead of the anon client. This bypasses RLS for server-side operations, which is the correct pattern for custom authentication.

### Files Modified
- `backend/src/users/users.service.ts` - All methods now use `getAdminClient()`
- `backend/src/auth/auth.service.ts` - Cleaned up token generation logic
- `backend/src/wallet/wallet.service.ts` - All methods now use `getAdminClient()`
- `backend/src/portfolio/portfolio.service.ts` - All methods now use `getAdminClient()`
- `backend/src/orders/orders.service.ts` - All methods now use `getAdminClient()`

### Changes Made

#### Users Service
1. **findById()** - Now uses admin client
2. **findByEmail()** - Now uses admin client  
3. **findByEmailWithPassword()** - Now uses admin client (critical for login)
4. **findByPhone()** - Now uses admin client
5. **updateRefreshToken()** - Now uses admin client
6. **updateKyc()** - Now uses admin client
7. **findAll()** - Now uses admin client

#### Wallet Service
1. **getWallet()** - Now uses admin client (fixes 404 wallet not found)
2. **initiateDeposit()** - Now uses admin client
3. **verifyDeposit()** - Now uses admin client
4. **initiateWithdrawal()** - Now uses admin client
5. **getTransactions()** - Now uses admin client

#### Portfolio Service
1. **getUserPortfolio()** - Now uses admin client

#### Orders Service
1. **createOrder()** - Now uses admin client
2. **executeOrder()** - Now uses admin client
3. **cancelOrder()** - Now uses admin client
4. **getUserOrders()** - Now uses admin client
5. **getOrderById()** - Now uses admin client

## Security Considerations
✅ **This is secure** because:
- The backend acts as a trusted intermediary
- It verifies credentials before issuing JWTs
- Authorization is enforced in application code
- RLS policies remain active for direct database access
- Using admin client for server-side auth is a standard pattern

## Testing Instructions

### 1. Restart the Backend
```bash
cd backend
npm run start:dev
```

### 2. Test Registration
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+233501234567"
  }'
```

Expected: Should return user object with `accessToken` and `refreshToken`

### 3. Test Login with Same Credentials
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

Expected: Should return user object with tokens (NOT 401 error)

### 4. Test Frontend Flow
1. Register a new user through the frontend
2. Should stay logged in (not immediately logged out)
3. Should see wallet balance (not 404 error)
4. Should be able to view portfolio
5. Logout
6. Login with the same credentials
7. Should successfully authenticate and access all features

## Additional Notes

### Why Not Fix RLS Policies Instead?
The RLS policies are designed for Supabase Auth. To use them with custom JWT auth, you would need to:
1. Set up a custom JWT claim in Supabase
2. Configure your backend to sign JWTs that Supabase recognizes
3. Pass those JWTs to Supabase client on every request

This is more complex and unnecessary since the backend already handles authorization. Using the admin client for server-side operations is simpler and equally secure.

### Other Services (Wallet, Portfolio, Orders)
All services now use the admin client because:
- They're called AFTER authentication (JWT verified by guards)
- The `userId` comes from the verified JWT token
- RLS policies expect `auth.uid()` which doesn't exist in custom JWT auth
- Using admin client is the correct pattern for server-side operations with custom auth
- Authorization is properly enforced at the application layer
