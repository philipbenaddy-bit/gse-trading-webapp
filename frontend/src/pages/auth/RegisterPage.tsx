import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TrendingUp, CheckCircle2, Lock, Users, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Valid phone number required'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/\d/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

// ── Adinkra SVG ───────────────────────────────────────────────────────────────
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

// ── Password strength indicator ───────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['#DC143C', '#DC143C', '#FCD116', '#D4AF37', '#228B22'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : 'hsl(var(--border))' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className={`text-xs flex items-center gap-1 ${c.pass ? 'text-[#228B22]' : 'text-muted-foreground'}`}>
              <CheckCircle2 className="w-3 h-3" />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className="text-xs font-semibold" style={{ color: colors[score] }}>
            {labels[score]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: FormData) => {
    try {
      const { confirmPassword, ...payload } = data;
      const res = await authApi.register(payload);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Account created! Welcome to GSE Trade.');
      navigate('/hub');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">

      {/* ── Left Panel — Brand ────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col">
        {/* Deep crimson-to-forest gradient — Ghana flag inspired */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(145deg, #1a0008 0%, #4a0015 25%, #2d0010 45%, #002d16 70%, #003d1f 100%)',
          }}
        />

        {/* Kente geometric overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #FCD116 1px, transparent 1px),
              linear-gradient(-45deg, #FCD116 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Adinkra decorative */}
        <AdinkraSymbol className="absolute -right-12 top-10 w-72 h-72 text-[#D4AF37]/10 pointer-events-none" />
        <AdinkraSymbol className="absolute -left-16 bottom-10 w-80 h-80 text-[#CE1126]/8 pointer-events-none" />

        {/* Radial glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 65%)' }}
        />

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-[#D4AF37]/25 backdrop-blur-sm">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#006B3F]" />
              </div>
              <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Join Today</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                Start Your
                <br />
                <span
                  style={{
                    background: 'linear-gradient(90deg, #B8860B, #D4AF37, #F4D03F, #D4AF37)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Investment Journey
                </span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed">
                Create your account in minutes and get instant access to professional GSE trading tools.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              {[
                { icon: CheckCircle2, label: 'Free account — no hidden fees', color: '#228B22' },
                { icon: Lock, label: 'Bank-grade security & encryption', color: '#D4AF37' },
                { icon: Users, label: 'Join 10,000+ active Ghanaian investors', color: '#FCD116' },
              ].map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl px-5 py-3 border border-[#D4AF37]/15 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
                  <span className="text-sm font-medium text-white/80">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="text-white/45 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#D4AF37] font-semibold hover:text-[#F4D03F] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Register Form ───────────────────────────────────── */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 relative bg-background overflow-y-auto">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-gold rounded-xl flex items-center justify-center shadow-gold-sm">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gradient-gold">GSE Trade</span>
        </div>

        <div className="w-full max-w-md space-y-7 py-12 animate-fade-in-up">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Create Account</h2>
            <p className="text-muted-foreground mt-2">Start investing in Ghana's future today</p>
          </div>

          {/* Form Card */}
          <div className="african-card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <input
                    {...register('firstName')}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                    placeholder="Kwame"
                  />
                  {errors.firstName && <p className="text-crimson text-xs">⚠ {errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <input
                    {...register('lastName')}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                    placeholder="Mensah"
                  />
                  {errors.lastName && <p className="text-crimson text-xs">⚠ {errors.lastName.message}</p>}
                </div>
              </div>

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
                {errors.email && <p className="text-crimson text-xs">⚠ {errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                  placeholder="+233 XX XXX XXXX"
                  autoComplete="tel"
                />
                {errors.phone && <p className="text-crimson text-xs">⚠ {errors.phone.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                    placeholder="••••••••"
                    autoComplete="new-password"
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
                <PasswordStrength password={passwordValue} />
                {errors.password && <p className="text-crimson text-xs">⚠ {errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirm ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-crimson text-xs">⚠ {errors.confirmPassword.message}</p>}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-4 h-4 rounded border-border mt-0.5"
                  style={{ accentColor: '#D4AF37' }}
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#D4AF37] hover:text-[#B8860B] hover:underline transition-colors">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-[#D4AF37] hover:text-[#B8860B] hover:underline transition-colors">Privacy Policy</Link>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full font-bold py-3.5 rounded-xl shadow-gold-sm hover:shadow-gold-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group text-[#1a1200]"
                style={{ background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' }}
              >
                <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-border rounded-xl text-foreground font-semibold hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all group"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
