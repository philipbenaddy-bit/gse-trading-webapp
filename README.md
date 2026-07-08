# GSE Trade — Ghana Stock Exchange Trading Platform

A full-stack web application for trading Ghana Stock Exchange (GSE) listed stocks. Built with React + NestJS, powered by the [GSE API](https://dev.kwayisi.org/apis/gse/).

## Features

- **Real-time market data** — Live prices from the GSE API, broadcast via WebSockets
- **Trading** — Market and limit orders (buy & sell)
- **Portfolio** — Holdings with live P&L tracking
- **Wallet** — Fund via Paystack (MTN MoMo, Vodafone Cash, AirtelTigo), withdraw to bank
- **KYC** — Ghana Card verification flow
- **Order management** — Full order history, cancel open orders

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | NestJS + TypeORM |
| Database | Supabase (PostgreSQL) |
| Cache/Sessions | Redis (if needed) |
| Real-time | Socket.io WebSockets |
| Payments | Paystack |
| Market Data | [GSE API by kwayisi.org](https://dev.kwayisi.org/apis/gse/) |

## Getting Started

### Prerequisites
- Node.js v18+
- Supabase account (database is hosted on Supabase)

### 1. Set up the backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials (Supabase connection is pre-configured)
npm install
npm run dev
```

Backend runs at `http://localhost:3001`  
Swagger docs at `http://localhost:3001/api/docs`

### 2. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Environment Variables

Copy `backend/.env.example` to `backend/.env`. The Supabase database connection is pre-configured, but you'll need to update:

| Variable | Description |
|---|---|
| `DB_PASSWORD` | Your Supabase database password |
| `JWT_SECRET` | Secret for JWT signing |
| `PAYSTACK_SECRET_KEY` | From [Paystack dashboard](https://dashboard.paystack.com) |
| `CLOUDINARY_*` | For KYC document uploads |

## Database Schema

The database is hosted on Supabase with the following tables:
- `users` - User accounts with KYC information
- `wallets` - User wallet balances
- `orders` - Trading orders (buy/sell)
- `portfolio` - User stock holdings
- `transactions` - Wallet transaction history

TypeScript types are auto-generated in `backend/src/types/supabase.ts`.

## Project Structure

```
gse-trading-webapp/
├── frontend/                 # React app
│   └── src/
│       ├── pages/            # Route pages
│       ├── components/       # Shared components
│       ├── store/            # Zustand state
│       ├── lib/              # API client, socket
│       └── hooks/            # Custom hooks
├── backend/                  # NestJS API
│   └── src/
│       ├── auth/             # JWT auth
│       ├── users/            # User management
│       ├── market/           # Market data + WebSocket
│       ├── orders/           # Order placement & management
│       ├── portfolio/        # Portfolio tracking
│       ├── wallet/           # Wallet + Paystack
│       └── gse/              # GSE API integration
└── docker-compose.yml        # PostgreSQL + Redis
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/market/live` | All live GSE prices |
| GET | `/api/v1/market/equities/:symbol` | Stock details |
| POST | `/api/v1/orders` | Place order |
| GET | `/api/v1/portfolio` | User portfolio with P&L |
| GET | `/api/v1/wallet` | Wallet balance |
| POST | `/api/v1/wallet/deposit` | Initiate Paystack deposit |

Full API docs available at `/api/docs` when backend is running.
