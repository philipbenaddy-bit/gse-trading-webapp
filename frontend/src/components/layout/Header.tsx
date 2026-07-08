import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, LogOut, Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { SearchBar } from '../shared/SearchBar';
import { NotificationBell } from '../shared/NotificationBell';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { name: 'Hub',       href: '/hub' },
  { name: 'Market',    href: '/market' },
  { name: 'Trade',     href: '/trade' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'News',      href: '/news' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Wallet',    href: '/wallet' },
];

export function Header() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Kente stripe accent — 3px Ghana flag colors */}
      <div className="h-[3px] w-full bg-gradient-ghana" />

      <div
        className="backdrop-blur-xl border-b border-border/60"
        style={{ background: 'hsl(var(--background) / 0.92)' }}
      >
        <div className="container flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-gold rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gradient-gold">GSE Trade</span>
              <p className="text-[10px] text-muted-foreground leading-none tracking-wide">Ghana Stock Exchange</p>
            </div>
          </Link>

          {/* Desktop nav */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative',
                    isActive(item.href)
                      ? 'text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[#D4AF37]/6',
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Search — desktop only */}
          {isAuthenticated && (
            <div className="hidden xl:block flex-1 max-w-xs mx-4">
              <SearchBar />
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link to="/profile" className="hidden sm:block">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-gold rounded-full blur-sm opacity-0 group-hover:opacity-40 transition-opacity" />
                    <Avatar
                      src={user?.avatar}
                      fallback={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                      className="relative h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-[#D4AF37]/50 transition-all"
                    />
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  title="Logout"
                  className="hidden sm:flex text-muted-foreground hover:text-crimson hover:bg-crimson/10 rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                </Button>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="lg:hidden p-2 rounded-lg border border-border hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/8 transition-all"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link to="/register">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-gold shadow-gold-sm hover:shadow-gold-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Join</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="lg:hidden overflow-hidden"
          >
            <div
              className="border-b border-border/60 px-4 py-4 space-y-1"
              style={{ background: 'hsl(var(--background) / 0.97)' }}
            >
              {/* Search on mobile */}
              <div className="mb-3">
                <SearchBar />
              </div>

              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      isActive(item.href)
                        ? 'bg-[#D4AF37]/12 text-[#D4AF37] border border-[#D4AF37]/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-[#D4AF37]/6',
                    )}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile user row */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-3">
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                  <Avatar
                    src={user?.avatar}
                    fallback={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                    className="h-8 w-8"
                  />
                  <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-1.5 text-sm text-crimson hover:text-crimson/80 transition-colors"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
