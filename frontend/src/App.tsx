import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MainLayout } from './components/layout/MainLayout';
import { PageSkeleton } from './components/ui/PageSkeleton';

// ── Eager-loaded (public, tiny) ───────────────────────────────────────────────
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// ── Lazy-loaded (authenticated, heavier) ─────────────────────────────────────
const HubPage        = lazy(() => import('./pages/HubPage'));
const MarketPage     = lazy(() => import('./pages/MarketPage'));
const TradePage      = lazy(() => import('./pages/TradePage'));
const PortfolioPage  = lazy(() => import('./pages/PortfolioPage'));
const WalletPage     = lazy(() => import('./pages/WalletPage'));
const OrdersPage     = lazy(() => import('./pages/OrdersPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));
const NewsPage       = lazy(() => import('./pages/NewsPage'));
const AnalyticsPage  = lazy(() => import('./pages/AnalyticsPage'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuthStore();
  if (!isAuthenticated || !accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/hub" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            </Route>

            {/* Protected routes */}
            <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route path="/hub"        element={<HubPage />} />
              <Route path="/market"     element={<MarketPage />} />
              <Route path="/trade/:symbol?" element={<TradePage />} />
              <Route path="/portfolio"  element={<PortfolioPage />} />
              <Route path="/news"       element={<NewsPage />} />
              <Route path="/analytics"  element={<AnalyticsPage />} />
              <Route path="/wallet"     element={<WalletPage />} />
              <Route path="/orders"     element={<OrdersPage />} />
              <Route path="/profile"    element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
