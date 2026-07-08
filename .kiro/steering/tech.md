# Technology Stack

## Backend

### Framework & Runtime
- **NestJS** 10.x — Node.js framework with TypeScript
- **Node.js** v18+ required

### Database & ORM
- **Supabase** — PostgreSQL database hosting
- **TypeORM** 0.3.x — Database ORM (limited use due to network restrictions)
- **@supabase/supabase-js** — Direct Supabase client for most database operations

### Authentication & Security
- **Passport** — Authentication middleware
- **JWT** — Token-based authentication (access + refresh tokens)
- **bcryptjs** — Password hashing (12 rounds)
- **@nestjs/throttler** — Rate limiting (100 requests/60s)

### Real-time & Communication
- **Socket.io** — WebSocket server for real-time market data
- **@nestjs/websockets** — NestJS WebSocket integration

### Validation & Documentation
- **class-validator** + **class-transformer** — DTO validation
- **@nestjs/swagger** — OpenAPI/Swagger documentation at `/api/docs`

### External Services
- **axios** — HTTP client for GSE API integration
- **Paystack** — Payment processing
- **Cloudinary** — File uploads (KYC documents)
- **Redis** — Caching and session management (optional)

## Frontend

### Framework & Build
- **React** 18.2 — UI library
- **TypeScript** 5.3 — Type safety
- **Vite** 5.x — Build tool and dev server

### Styling
- **Tailwind CSS** 3.4 — Utility-first CSS framework
- **PostCSS** + **Autoprefixer** — CSS processing

### State Management
- **Zustand** 4.5 — Lightweight state management
- **React Query** 3.39 — Server state management and caching

### Forms & Validation
- **react-hook-form** 7.49 — Form handling
- **zod** 3.22 — Schema validation
- **@hookform/resolvers** — Form validation integration

### UI Components & Libraries
- **lucide-react** — Icon library
- **react-hot-toast** — Toast notifications
- **recharts** — Charts and data visualization
- **lightweight-charts** — Trading charts
- **date-fns** — Date manipulation

### Routing & HTTP
- **react-router-dom** 6.21 — Client-side routing
- **axios** — HTTP client with interceptors
- **socket.io-client** — WebSocket client

## Common Commands

### Backend

```bash
# Development
cd backend
npm install
npm run dev          # Start with hot reload (port 3001)

# Production
npm run build        # Compile TypeScript
npm start            # Run compiled code

# Code Quality
npm run lint         # ESLint check
npm test             # Run Jest tests
```

### Frontend

```bash
# Development
cd frontend
npm install
npm run dev          # Start Vite dev server (port 5173)

# Production
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build

# Code Quality
npm run lint         # ESLint check
```

## Environment Setup

### Backend Environment Variables
Required in `backend/.env`:
- `DB_PASSWORD` — Supabase database password
- `JWT_SECRET` — JWT signing secret
- `JWT_REFRESH_SECRET` — Refresh token secret
- `PAYSTACK_SECRET_KEY` — Paystack API key
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary credentials
- `FRONTEND_URL` — CORS origin (default: http://localhost:5173)
- `PORT` — Backend port (default: 3001)

### Frontend Environment Variables
Configured via Vite's environment system (if needed).

## API Documentation

Swagger/OpenAPI documentation available at:
- **Local**: http://localhost:3001/api/docs
- All endpoints prefixed with `/api/v1`

## Development Workflow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Access app at http://localhost:5173
4. View API docs at http://localhost:3001/api/docs
