# Project Structure

## Repository Layout

```
gse-trading-webapp/
├── backend/                    # NestJS API server
├── frontend/                   # React application
├── .kiro/                      # Kiro AI configuration
│   ├── hooks/                  # Agent hooks
│   ├── specs/                  # Feature specifications
│   └── steering/               # Steering rules (this file)
├── .vscode/                    # VS Code settings
├── HYBRID_API_ARCHITECTURE.md  # Architecture documentation
└── README.md                   # Project overview
```

## Backend Structure (`backend/src/`)

### Module Organization
NestJS follows a modular architecture. Each feature is a self-contained module:

```
backend/src/
├── main.ts                     # Application entry point
├── app.module.ts               # Root module
├── auth/                       # Authentication module
│   ├── auth.controller.ts      # Auth endpoints
│   ├── auth.service.ts         # Auth business logic
│   ├── auth.module.ts          # Module definition
│   ├── dto/                    # Data Transfer Objects
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── refresh-token.dto.ts
│   ├── guards/                 # Route guards
│   │   ├── jwt-auth.guard.ts
│   │   └── local-auth.guard.ts
│   └── strategies/             # Passport strategies
│       ├── jwt.strategy.ts
│       └── local.strategy.ts
├── users/                      # User management
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── entities/
│       └── user.entity.ts
├── orders/                     # Order management
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   ├── orders.module.ts
│   ├── dto/
│   │   └── create-order.dto.ts
│   └── entities/
│       └── order.entity.ts
├── portfolio/                  # Portfolio tracking
├── wallet/                     # Wallet & payments
├── market/                     # Market data & WebSockets
│   ├── market.controller.ts
│   ├── market.gateway.ts       # Socket.io gateway
│   └── market.module.ts
├── gse/                        # GSE API integration
│   ├── gse.service.ts
│   └── gse.module.ts
├── supabase/                   # Supabase client
│   ├── supabase.service.ts
│   └── supabase.module.ts
├── config/                     # Configuration files
│   └── supabase.config.ts
├── common/                     # Shared utilities
│   ├── filters/
│   │   └── global-exception.filter.ts
│   └── pipes/
│       └── sanitization.pipe.ts
└── types/                      # TypeScript types
    └── supabase.ts             # Auto-generated DB types
```

### Backend Conventions

- **Module Pattern**: Each feature has a module, controller, and service
- **DTOs**: Use `class-validator` decorators for validation
- **Entities**: TypeORM entities (limited use, prefer Supabase client)
- **Guards**: JWT authentication on protected routes
- **Filters**: Global exception filter for consistent error responses
- **API Prefix**: All endpoints prefixed with `/api/v1`
- **Swagger**: Controllers decorated with `@ApiTags()`, `@ApiOperation()`, etc.

## Frontend Structure (`frontend/src/`)

```
frontend/src/
├── main.tsx                    # Application entry point
├── App.tsx                     # Root component with routing
├── index.css                   # Global styles (Tailwind)
├── pages/                      # Route pages
│   ├── auth/                   # Authentication pages
│   ├── DashboardPage.tsx
│   ├── MarketPage.tsx
│   ├── TradePage.tsx
│   ├── OrdersPage.tsx
│   ├── PortfolioPage.tsx
│   ├── WalletPage.tsx
│   └── ProfilePage.tsx
├── components/                 # Reusable components
│   ├── layout/                 # Layout components
│   │   └── Layout.tsx
│   ├── ErrorBoundary.tsx
│   └── TradingDashboard.tsx
├── store/                      # Zustand state stores
│   ├── authStore.ts            # Authentication state
│   └── marketStore.ts          # Market data state
├── lib/                        # Utilities and clients
│   ├── api.ts                  # Axios client + API functions
│   ├── api-client.ts           # Hybrid API client (NestJS + Supabase)
│   └── socket.ts               # Socket.io client
└── hooks/                      # Custom React hooks
    └── useMarketSocket.ts
```

### Frontend Conventions

- **Pages**: One file per route, named `{Feature}Page.tsx`
- **Components**: Reusable UI components in `components/`
- **State Management**: 
  - Zustand for client state (auth, UI state)
  - React Query for server state (API data)
- **API Calls**: Centralized in `lib/api.ts` with typed functions
- **Styling**: Tailwind utility classes, no CSS modules
- **Forms**: react-hook-form + zod validation
- **Routing**: react-router-dom v6 with nested routes

## Naming Conventions

### Backend
- **Files**: `kebab-case.ts` (e.g., `auth.service.ts`)
- **Classes**: `PascalCase` (e.g., `AuthService`, `CreateOrderDto`)
- **Methods**: `camelCase` (e.g., `validateUser()`, `placeOrder()`)
- **Endpoints**: `kebab-case` (e.g., `/api/v1/market/live`)
- **DTOs**: Suffix with `Dto` (e.g., `LoginDto`)
- **Entities**: Suffix with `Entity` (e.g., `UserEntity`)

### Frontend
- **Files**: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase` (e.g., `TradingDashboard`)
- **Hooks**: Prefix with `use` (e.g., `useMarketSocket`)
- **Stores**: Suffix with `Store` (e.g., `authStore`)
- **API functions**: `camelCase` (e.g., `getPortfolio()`)

## Database Schema

Tables in Supabase PostgreSQL:
- `users` — User accounts with KYC information
- `wallets` — User wallet balances
- `orders` — Trading orders (buy/sell)
- `portfolio` — User stock holdings
- `transactions` — Wallet transaction history

TypeScript types auto-generated in `backend/src/types/supabase.ts`.

## Configuration Files

- `backend/.env` — Backend environment variables (not committed)
- `backend/.env.example` — Environment template
- `backend/nest-cli.json` — NestJS CLI configuration
- `frontend/vite.config.ts` — Vite build configuration
- `frontend/tailwind.config.js` — Tailwind CSS configuration
- `frontend/tsconfig.json` — TypeScript configuration

## Key Architectural Patterns

### Hybrid API Architecture
- **Complex operations** → NestJS backend (auth, trading, payments)
- **Simple CRUD + real-time** → Supabase direct API (portfolio, history)
- Security enforced via Row Level Security (RLS) policies

### Authentication Flow
1. User logs in via NestJS `/api/v1/auth/login`
2. Receives JWT access token + refresh token
3. Access token used for NestJS requests (Bearer header)
4. Supabase auth synced for direct API calls with RLS

### Real-time Updates
- Market data: Socket.io WebSocket from NestJS
- Database changes: Supabase real-time subscriptions (portfolio, orders)

### Error Handling
- Backend: Global exception filter with correlation IDs
- Frontend: Axios interceptors for 401 handling + toast notifications
