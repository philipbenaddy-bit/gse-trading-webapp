import { Link } from 'react-router-dom';
import { TrendingUp, Wallet, PieChart, Newspaper, BarChart3, ArrowRight, Zap, Shield } from 'lucide-react';
import { QuickStats } from '../components/trading/QuickStats';
import { PriceTicker } from '../components/shared/PriceTicker';

const mockTickerStocks = [
  { symbol: 'GCB',   price: 4.25, change: 0.15,  changePercent: 3.66  },
  { symbol: 'MTNGH', price: 1.05, change: -0.02, changePercent: -1.87 },
  { symbol: 'TOTAL', price: 3.80, change: 0.10,  changePercent: 2.70  },
  { symbol: 'EGH',   price: 6.50, change: 0.25,  changePercent: 4.00  },
  { symbol: 'CAL',   price: 0.95, change: -0.05, changePercent: -5.00 },
];

const features = [
  { title: 'Market',    description: 'Real-time GSE market data and analytics', icon: <TrendingUp className="h-6 w-6" />, href: '/market',    accent: '#D4AF37' },
  { title: 'Trade',     description: 'Execute buy and sell orders instantly',   icon: <Zap className="h-6 w-6" />,        href: '/trade',     accent: '#228B22' },
  { title: 'Portfolio', description: 'Track your investments and P&L',          icon: <PieChart className="h-6 w-6" />,   href: '/portfolio', accent: '#D4AF37' },
  { title: 'News',      description: 'Latest Ghana market insights',            icon: <Newspaper className="h-6 w-6" />,  href: '/news',      accent: '#CE1126' },
  { title: 'Analytics', description: 'Advanced market analysis tools',          icon: <BarChart3 className="h-6 w-6" />,  href: '/analytics', accent: '#228B22' },
  { title: 'Wallet',    description: 'Manage funds via MoMo & bank transfer',   icon: <Wallet className="h-6 w-6" />,     href: '/wallet',    accent: '#FCD116' },
];

const steps = [
  { n: '01', title: 'Fund Your Wallet',       desc: 'Add funds using MTN MoMo, Vodafone Cash, or Bank Transfer', color: '#CE1126' },
  { n: '02', title: 'Browse the Market',      desc: 'Explore GSE stocks, view real-time prices, and analyse trends', color: '#FCD116', textColor: '#1a1200' },
  { n: '03', title: 'Place Your First Trade', desc: 'Buy or sell stocks with market or limit orders', color: '#006B3F' },
  { n: '04', title: 'Track Your Portfolio',   desc: 'Monitor your investments and performance in real-time', color: '#D4AF37', textColor: '#1a1200' },
];

export default function HubPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Subtle Adinkra background pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='30' stroke='%23D4AF37' stroke-width='1' fill='none'/%3E%3Ccircle cx='40' cy='40' r='18' stroke='%23D4AF37' stroke-width='1' fill='none'/%3E%3Cpath d='M40 10 C50 25 50 55 40 70' stroke='%23D4AF37' stroke-width='1' fill='none'/%3E%3Cpath d='M40 10 C30 25 30 55 40 70' stroke='%23D4AF37' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
      />

      <PriceTicker stocks={mockTickerStocks} />

      <div className="container relative z-10 py-10 space-y-10">

        {/* ── Hero ── */}
        <div className="text-center space-y-6 py-14 animate-fade-in-up">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/8 mb-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[#CE1126]" />
              <span className="w-2 h-2 rounded-full bg-[#FCD116]" />
              <span className="w-2 h-2 rounded-full bg-[#006B3F]" />
            </div>
            <span className="text-sm font-semibold text-[#D4AF37]">Ghana Stock Exchange</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
            Trade Smarter with{' '}
            <span className="text-gradient-gold animate-gold-shimmer">GSE Trade</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Access the Ghana Stock Exchange with professional-grade tools,
            real-time data, and seamless MoMo payments. Built for Ghanaian investors.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link to="/market">
              <button
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-[#1a1200] shadow-gold-md hover:shadow-gold-lg hover:scale-[1.02] active:scale-[0.98] transition-all group"
                style={{ background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' }}
              >
                Explore Market
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/trade">
              <button className="px-8 py-4 rounded-xl font-semibold border-2 border-border hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/6 transition-all">
                Start Trading
              </button>
            </Link>
          </div>
        </div>

        {/* ── Quick Stats ── */}
        <div className="animate-fade-in-up">
          <QuickStats />
        </div>

        {/* ── Feature Grid ── */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Link key={f.title} to={f.href} className="group">
                <div className="african-card p-7 h-full">
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-5 group-hover:scale-110 transition-transform duration-300"
                    style={{ background: `${f.accent}18`, color: f.accent }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.description}</p>
                  <div className="flex items-center text-sm font-semibold group-hover:translate-x-1 transition-transform" style={{ color: f.accent }}>
                    <span>Explore</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Getting Started ── */}
        <div className="african-card p-8 md:p-10 relative overflow-hidden">
          {/* Kente stripe accent */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-ghana" />

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Get Started in Minutes</h2>
            <p className="text-muted-foreground mt-1.5">Four simple steps to start trading on the GSE</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {steps.map((s) => (
              <div
                key={s.n}
                className="flex items-start gap-4 p-5 rounded-xl border border-border/60 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/4 transition-all"
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl font-bold text-base flex items-center justify-center shadow-md"
                  style={{ background: s.color, color: s.textColor || '#fff' }}
                >
                  {s.n}
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust badges ── */}
        <div className="flex flex-wrap items-center justify-center gap-8 py-6 border-t border-border/40">
          {[
            { icon: Shield, label: 'SEC Regulated', color: '#228B22' },
            { icon: TrendingUp, label: 'Real-time GSE Data', color: '#D4AF37' },
            { icon: Wallet, label: 'MoMo Payments', color: '#FCD116' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="w-4 h-4" style={{ color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
