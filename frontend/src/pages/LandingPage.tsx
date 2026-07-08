import { Link } from 'react-router-dom';
import {
  TrendingUp, Shield, Zap, BarChart3, ArrowRight,
  LineChart, Users, ChevronRight, Wallet, Brain,
  Lock, Globe, CheckCircle2, Building2, Smartphone, Star
} from 'lucide-react';

// ── Adinkra-inspired SVG pattern (Gye Nyame — "Except God") ──────────────────
function AdinkraPattern({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
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

// ── Kente strip decoration ────────────────────────────────────────────────────
function KenteStrip() {
  const colors = ['#CE1126', '#FCD116', '#006B3F', '#D4AF37', '#CE1126', '#FCD116', '#006B3F', '#D4AF37'];
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full">
      {colors.map((c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Deep forest-green to gold gradient — Ghana's colours */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #003d1f 0%, #006B3F 35%, #1a4a00 55%, #3d2800 80%, #1a1200 100%)',
          }}
        />

        {/* Kente-inspired geometric grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(0deg, #FCD116 1px, transparent 1px),
              linear-gradient(90deg, #FCD116 1px, transparent 1px),
              linear-gradient(0deg, #CE1126 1px, transparent 1px),
              linear-gradient(90deg, #CE1126 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px',
            backgroundPosition: '0 0, 0 0, 0 0, 0 0',
          }}
        />

        {/* Adinkra symbol — large decorative background */}
        <AdinkraPattern className="absolute right-[-5%] top-[-10%] w-[600px] h-[600px] text-[#D4AF37]/8 pointer-events-none" />
        <AdinkraPattern className="absolute left-[-8%] bottom-[-15%] w-[400px] h-[400px] text-[#FCD116]/6 pointer-events-none" />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
        />

        <div className="container relative z-10 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left Content */}
              <div className="space-y-8 text-white animate-fade-in-up">
                {/* Badge */}
                <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-[#D4AF37]/30 rounded-full px-5 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#CE1126]" />
                    <span className="w-2 h-2 rounded-full bg-[#FCD116]" />
                    <span className="w-2 h-2 rounded-full bg-[#006B3F]" />
                  </div>
                  <span className="text-sm font-semibold text-[#FCD116]">Ghana Stock Exchange</span>
                </div>

                <div className="space-y-5">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
                    <span className="text-white">Invest in</span>
                    <br />
                    <span
                      className="animate-gold-shimmer"
                      style={{
                        background: 'linear-gradient(90deg, #B8860B, #D4AF37, #F4D03F, #FCD116, #D4AF37, #B8860B)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      Ghana's Future
                    </span>
                  </h1>
                  <p className="text-xl text-white/75 leading-relaxed max-w-xl">
                    Access the Ghana Stock Exchange with professional-grade tools,
                    real-time data, and seamless MoMo payments. Built for Ghanaian investors.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register">
                    <button className="group px-8 py-4 font-bold rounded-xl text-[#1a1200] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-gold-lg"
                      style={{ background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' }}
                    >
                      Start Trading Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <Link to="/login">
                    <button className="group px-8 py-4 bg-white/10 border border-white/25 text-white font-bold rounded-xl hover:bg-white/18 hover:border-white/40 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
                      Sign In
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm text-white/60">
                  {[
                    { icon: Shield, label: 'SEC Regulated' },
                    { icon: Lock, label: 'Bank-Grade Security' },
                    { icon: Users, label: '10,000+ Investors' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#D4AF37]" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Content — Stats Cards */}
              <div className="grid grid-cols-2 gap-4 animate-slide-in-right">
                {/* Market Index Card */}
                <div className="col-span-2 rounded-2xl border border-[#D4AF37]/20 p-6 backdrop-blur-xl"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(212,175,55,0.15)' }}
                      >
                        <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <div className="text-xs text-white/50 uppercase tracking-wider">GSE Composite Index</div>
                        <div className="text-2xl font-bold text-white font-mono">3,247.82</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#228B22]">+2.4%</div>
                      <div className="text-xs text-white/40">Today</div>
                    </div>
                  </div>
                  {/* Mini chart bars */}
                  <div className="h-14 flex items-end gap-1">
                    {[45, 52, 48, 65, 58, 72, 68, 75, 70, 82, 78, 85, 80, 88, 92].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-all"
                        style={{
                          height: `${height}%`,
                          background: `linear-gradient(to top, #B8860B, #D4AF37)`,
                          opacity: 0.6 + (i / 15) * 0.4,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-3">
                    <KenteStrip />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#D4AF37]/15 p-5 backdrop-blur-xl"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-[#228B22]" />
                    <div className="text-xs text-white/50">Daily Volume</div>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">GHS 2.4M</div>
                  <div className="text-xs text-[#228B22] mt-1 font-medium">+15% vs yesterday</div>
                </div>

                <div className="rounded-2xl border border-[#D4AF37]/15 p-5 backdrop-blur-xl"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-[#D4AF37]" />
                    <div className="text-xs text-white/50">Listed Stocks</div>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">50+</div>
                  <div className="text-xs text-white/40 mt-1">Across all sectors</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80 L0 40 Q360 0 720 40 Q1080 80 1440 40 L1440 80 Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-border/40 bg-card/50">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              { value: 'GHS 50M+', label: 'Trading Volume' },
              { value: '10,000+', label: 'Active Investors' },
              { value: '50+', label: 'Listed Companies' },
              { value: '99.9%', label: 'Platform Uptime' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37] font-mono">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-5 py-2 mb-6">
              <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-sm font-semibold text-[#D4AF37]">Professional Infrastructure</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
              Built for Ghanaian Investors
            </h2>
            <p className="text-xl text-muted-foreground">
              Institutional-level technology with local payment methods you trust
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
            {[
              {
                icon: LineChart,
                title: 'Real-Time Market Data',
                desc: 'Live GSE quotes, order books, and trade execution with sub-second latency.',
                accent: '#D4AF37',
              },
              {
                icon: Shield,
                title: 'Bank-Level Security',
                desc: '256-bit encryption, two-factor authentication, and SEC regulatory compliance.',
                accent: '#228B22',
              },
              {
                icon: Brain,
                title: 'AI-Powered Insights',
                desc: 'Advanced analytics and personalised recommendations for smarter decisions.',
                accent: '#D4AF37',
              },
              {
                icon: Wallet,
                title: 'MoMo & Bank Payments',
                desc: 'Instant deposits via MTN MoMo, Vodafone Cash, AirtelTigo, and bank transfer.',
                accent: '#FCD116',
              },
              {
                icon: Zap,
                title: 'Lightning Fast Execution',
                desc: 'Optimised infrastructure for instant order processing and real-time fills.',
                accent: '#228B22',
              },
              {
                icon: Globe,
                title: 'Multi-Platform Access',
                desc: 'Trade seamlessly across web, mobile, and tablet with fully synced data.',
                accent: '#D4AF37',
              },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <div
                key={title}
                className="african-card group p-7 cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `${accent}18` }}
                >
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm mb-4">{desc}</p>
                <div className="flex items-center font-semibold text-sm group-hover:translate-x-1 transition-transform" style={{ color: accent }}>
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-card/40 relative overflow-hidden">
        {/* Subtle kente pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #D4AF37 0px, #D4AF37 2px,
              transparent 2px, transparent 20px
            ), repeating-linear-gradient(
              -45deg,
              #CE1126 0px, #CE1126 2px,
              transparent 2px, transparent 20px
            )`,
          }}
        />

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
              Start Trading in Minutes
            </h2>
            <p className="text-xl text-muted-foreground">Simple, secure, and fully compliant onboarding</p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Create Account',
                desc: 'Sign up with your email and complete Ghana Card verification in minutes.',
                color: '#CE1126',
              },
              {
                step: '02',
                title: 'Fund Your Wallet',
                desc: 'Add funds instantly via MTN MoMo, Vodafone Cash, or bank transfer.',
                color: '#FCD116',
                textColor: '#1a1200',
              },
              {
                step: '03',
                title: 'Start Trading',
                desc: 'Access live GSE data and execute trades with professional tools.',
                color: '#006B3F',
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                <div className="african-card p-8 text-center h-full">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg"
                    style={{
                      background: item.color,
                      color: item.textColor || '#fff',
                    }}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 z-10 items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37] shadow-gold-sm">
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS / SOCIAL PROOF ──────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">Trusted by Ghanaian Investors</h2>
            <p className="text-muted-foreground text-lg">Join thousands building wealth on the GSE</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                name: 'Kwame Asante',
                role: 'Retail Investor, Accra',
                quote: 'Finally a platform that understands Ghanaian investors. MoMo deposits make it so easy to fund my account.',
                rating: 5,
              },
              {
                name: 'Abena Mensah',
                role: 'Portfolio Manager, Kumasi',
                quote: 'The real-time GSE data and analytics tools are on par with international platforms. Proud to use a Ghanaian product.',
                rating: 5,
              },
              {
                name: 'Kofi Boateng',
                role: 'First-time Investor, Takoradi',
                quote: 'I started with zero knowledge. The platform guided me through everything. My portfolio is up 18% this year.',
                rating: 5,
              },
            ].map((t) => (
              <div key={t.name} className="african-card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        {/* Ghana-inspired deep background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #003d1f 0%, #006B3F 40%, #3d2800 70%, #1a1200 100%)',
          }}
        />
        <AdinkraPattern className="absolute right-[-5%] top-[-20%] w-[500px] h-[500px] text-[#D4AF37]/10 pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-[#D4AF37]/30 rounded-full px-5 py-2">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-sm font-semibold text-[#FCD116]">Market is Open</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Ready to Build
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #B8860B, #D4AF37, #F4D03F, #D4AF37)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Generational Wealth?
              </span>
            </h2>

            <p className="text-xl text-white/65 max-w-2xl mx-auto leading-relaxed">
              Join thousands of Ghanaian investors growing their wealth through smart,
              data-driven trading on the GSE.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to="/register">
                <button
                  className="px-10 py-4 font-bold text-lg rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-gold-lg text-[#1a1200]"
                  style={{ background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' }}
                >
                  Open Free Account
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link to="/login">
                <button className="px-10 py-4 bg-white/10 border border-white/25 text-white font-bold text-lg rounded-xl hover:bg-white/18 hover:border-white/40 transition-all flex items-center gap-2 backdrop-blur-sm">
                  Sign In
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-8 text-sm text-white/50">
              {[
                { icon: Shield, label: 'SEC Regulated' },
                { icon: Lock, label: '256-bit Encryption' },
                { icon: CheckCircle2, label: 'No Hidden Fees' },
                { icon: Smartphone, label: 'MoMo Payments' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#D4AF37]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
