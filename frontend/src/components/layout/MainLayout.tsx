import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { AiChatWidget } from '../ai/AiChatWidget';
import { PageTransition } from '../ui/PageTransition';
import { useAuthStore } from '../../store/authStore';

export function MainLayout() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <Footer />

      {/* AI Chat Widget — only for authenticated users */}
      {isAuthenticated && <AiChatWidget />}
    </div>
  );
}
