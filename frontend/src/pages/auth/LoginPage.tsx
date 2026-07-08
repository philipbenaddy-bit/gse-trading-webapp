import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TrendingUp, Shield, Zap, BarChart3, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

// ── Adinkra SVG (Gye Nyame) ───────────────────────────────────────────────────
function AdinkraSymbol({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="100" cy="100" r="55" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M100 20 C120 50 120 150 100 180" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M20 100 C50 80 150 80 180 100" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M100 20 C80 50 80 150 100 180" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M20 100 C50 120 150 120 180 100" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate('/hub');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">

      {/* ── Left Panel — Ghana-inspired brand ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col">
        {/* Deep forest-green to dark gold gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(145deg, #002d16 0%, #005a30 30%, #003d1f 55%, #2d1f00 80%, #1a1200 100%)',
          }}
        />

        {/* Kente geometric overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(0deg, #FCD116 1px, transparent 1px),
              linear-gradient(90deg, #FCD116 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Adinkra decorative symbols */}
        <AdinkraSymbol className="absolute -right-16 -top-16 w-80 h-80 text-[#D4AF37]/10 pointer-events-none" />
        <AdinkraSymbol className="absolute -left-20 -bottom-20 w-96 h-96 text-[#FCD116]/8 pointer-events-none" />

        {/* Radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 65%)' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-gold rounded-xl blur-md opacity-50" />
              <div className="relative w-11 h-11 bg-gradient-gold rounded-xl flex items-center justify-center shadow-gold-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold text-white">GSE Trade</span>
              <p className="text-white/50 text-xs tracking-wide">Ghana Stock Exchange</p>
            </div>
          </div>

          {/* Center Content */}
          <div className="space-y-8 max-w-md">
            {/* Ghana flag dots */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-[#D4AF37]/25 backdrop-blur-sm">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#006B3F]" />
              </div>
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Market Open</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                Trade Smarter,
                <br />
                <span
                  style={{
                    background: 'linear-gradient(90deg, #B8860B, #D4AF37, #F4D03F, #D4AF37)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Invest Better
                </span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed">
                Access real-time GSE market data, execute trades instantly, and grow your wealth with confidence.
              </p>
            </div>

            {/* Feature pills */}
            <div className="space-y-3">
              {[
                { icon: Zap, label: 'Real-time GSE Market Data' },
                { icon: Shield, label: 'SEC Regulated & Secure' },
                { icon: BarChart3, label: 'Professional Analytics' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl px-5 py-3 border border-[#D4AF37]/15 backdrop-blur-sm transition-all hover:border-[#D4AF37]/30"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
                    <Icon className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <span className="text-sm font-medium text-white/80">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '50+', label: 'Listed Stocks' },
              { value: '24/7', label: 'Support' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4 border border-[#D4AF37]/15 text-center backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div className="text-xl font-bold text-[#D4AF37] font-mono">{stat.value}</div>
                <div className="text-white/45 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ───────────────────────────────────────── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-8 relative bg-background">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-gold rounded-xl flex items-center justify-center shadow-gold-sm">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gradient-gold">GSE Trade</span>
        </div>

        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">Sign in to continue your trading journey</p>
          </div>

          {/* Form Card */}
          <div className="african-card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-crimson text-xs flex items-center gap-1">
                    <span>⚠</span>{errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link to="/forgot-password" className="text-xs text-[#D4AF37] hover:text-[#B8860B] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-crimson text-xs flex items-center gap-1">
                    <span>⚠</span>{errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-border"
                  style={{ accentColor: '#D4AF37' }}
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full font-bold py-3.5 rounded-xl shadow-gold-sm hover:shadow-gold-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group text-[#1a1200]"
                style={{ background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' }}
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">New to GSE Trade?</span>
              </div>
            </div>

            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-border rounded-xl text-foreground font-semibold hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all group"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-[#D4AF37] hover:text-[#B8860B] hover:underline transition-colors">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-[#D4AF37] hover:text-[#B8860B] hover:underline transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
