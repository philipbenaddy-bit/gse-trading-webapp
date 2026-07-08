import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { StockTicker } from './StockTicker';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <StockTicker />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
