import { Link } from 'react-router-dom';
import { TrendingUp, Twitter, Facebook, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product:   [{ name: 'Features', href: '/features' }, { name: 'Pricing', href: '/pricing' }, { name: 'Security', href: '/security' }, { name: 'Roadmap', href: '/roadmap' }],
    company:   [{ name: 'About', href: '/about' }, { name: 'Blog', href: '/blog' }, { name: 'Careers', href: '/careers' }, { name: 'Contact', href: '/contact' }],
    resources: [{ name: 'Documentation', href: '/docs' }, { name: 'API Reference', href: '/api' }, { name: 'Support', href: '/support' }, { name: 'Status', href: '/status' }],
    legal:     [{ name: 'Privacy', href: '/privacy' }, { name: 'Terms', href: '/terms' }, { name: 'Cookie Policy', href: '/cookies' }, { name: 'Licenses', href: '/licenses' }],
  };

  const socialLinks = [
    { name: 'Twitter',  icon: Twitter,  href: 'https://twitter.com' },
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { name: 'Email',    icon: Mail,     href: 'mailto:support@gsetrade.com' },
  ];

  return (
    <footer className="relative mt-20 overflow-hidden">
      {/* Adinkra-inspired subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z M30 10 L50 30 L30 50 L10 30 Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ghana flag stripe at top of footer */}
      <div className="h-[3px] w-full bg-gradient-ghana" />

      <div
        className="relative border-t border-border/40"
        style={{ background: 'hsl(var(--card))' }}
      >
        <div className="container py-14 md:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-6">

            {/* Brand */}
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-5 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-gold rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold-sm">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-lg font-bold text-gradient-gold">GSE Trade</span>
                  <p className="text-[10px] text-muted-foreground leading-none tracking-wide">Ghana Stock Exchange</p>
                </div>
              </Link>

              <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                Ghana's professional stock trading platform. Trade with confidence, powered by real-time data and built for Ghanaian investors.
              </p>

              {/* Ghana flag colors badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-background mb-5">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006B3F]" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Made in Ghana 🇬🇭</span>
              </div>

              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                    aria-label={social.name}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/8 transition-all">
                      <social.icon className="h-4 w-4 text-muted-foreground group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-4">
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </h3>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 inline-block transition-all duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} GSE Trade. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Regulated by the</span>
              <span className="font-semibold text-foreground">Ghana Stock Exchange</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gold glow line at very bottom */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
    </footer>
  );
}
