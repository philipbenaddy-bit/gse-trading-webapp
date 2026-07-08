/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* African palette — direct access */
        gold: {
          DEFAULT: '#D4AF37',
          light:   '#F4D03F',
          dark:    '#B8860B',
          deep:    '#8B6914',
        },
        forest: {
          DEFAULT: '#228B22',
          dark:    '#006B3F',
        },
        crimson: {
          DEFAULT: '#DC143C',
          dark:    '#CE1126',
        },
        terracotta: '#8B4513',
        parchment:  '#F5F0E8',
        /* Status */
        success: { DEFAULT: '#228B22', foreground: '#ffffff' },
        warning: { DEFAULT: '#F4D03F', foreground: '#1a1a1a' },
        danger:  { DEFAULT: '#DC143C', foreground: '#ffffff' },
      },

      borderRadius: {
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 2px)',
        sm:   'calc(var(--radius) - 4px)',
        xl:   'calc(var(--radius) + 4px)',
        '2xl':'calc(var(--radius) + 8px)',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },

      boxShadow: {
        'gold-sm': '0 2px 12px rgba(212, 175, 55, 0.18)',
        'gold-md': '0 4px 24px rgba(212, 175, 55, 0.22)',
        'gold-lg': '0 8px 40px rgba(212, 175, 55, 0.28)',
        'gold-xl': '0 16px 60px rgba(212, 175, 55, 0.35)',
        'green-sm':'0 2px 12px rgba(34, 139, 34, 0.18)',
        'red-sm':  '0 2px 12px rgba(220, 20, 60, 0.18)',
        'warm-sm': '0 1px 3px rgba(139, 69, 19, 0.08), 0 1px 2px rgba(139, 69, 19, 0.05)',
        'warm-md': '0 4px 16px rgba(139, 69, 19, 0.1), 0 2px 6px rgba(139, 69, 19, 0.06)',
      },

      backgroundImage: {
        'gradient-gold':    'linear-gradient(135deg, #D4AF37, #B8860B)',
        'gradient-green':   'linear-gradient(135deg, #228B22, #006B3F)',
        'gradient-crimson': 'linear-gradient(135deg, #DC143C, #CE1126)',
        'gradient-kente':   'linear-gradient(135deg, #D4AF37 0%, #DC143C 50%, #228B22 100%)',
        'gradient-ghana':   'linear-gradient(to right, #CE1126, #FCD116, #006B3F)',
        'gradient-warm':    'linear-gradient(135deg, hsl(42 30% 96%), hsl(38 25% 90%))',
        'gradient-obsidian':'linear-gradient(135deg, #0d0d0d, #1a1a1a)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'scale-in-spring': {
          from: { opacity: '0', transform: 'scale(0.88)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(12deg)' },
          '50%':       { transform: 'translateY(-18px) rotate(15deg)' },
        },
        'float-medium': {
          '0%, 100%': { transform: 'translateY(0px) rotate(-12deg)' },
          '50%':       { transform: 'translateY(-12px) rotate(-15deg)' },
        },
        'float-fast': {
          '0%, 100%': { transform: 'translateY(0px) rotate(45deg)' },
          '50%':       { transform: 'translateY(-8px) rotate(50deg)' },
        },
        'gold-shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0)' },
          '50%':       { boxShadow: '0 0 20px 4px rgba(212, 175, 55, 0.25)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition:  '1000px 0' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-6px)' },
        },
        'ticker-scroll': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        'live-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':       { transform: 'scale(1.5)', opacity: '0.6' },
        },
        'card-enter': {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },

      animation: {
        'accordion-down':   'accordion-down 0.2s ease-out',
        'accordion-up':     'accordion-up 0.2s ease-out',
        'fade-in':          'fade-in 0.35s ease-out both',
        'fade-in-up':       'fade-in-up 0.45s ease-out both',
        'fade-in-down':     'fade-in-down 0.45s ease-out both',
        'slide-in-right':   'slide-in-right 0.45s ease-out both',
        'slide-in-left':    'slide-in-left 0.45s ease-out both',
        'scale-in':         'scale-in 0.3s ease-out both',
        'scale-in-spring':  'scale-in-spring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'float':            'float 4s ease-in-out infinite',
        'float-slow':       'float-slow 6s ease-in-out infinite',
        'float-medium':     'float-medium 4s ease-in-out infinite',
        'float-fast':       'float-fast 3s ease-in-out infinite',
        'gold-shimmer':     'gold-shimmer 4s linear infinite',
        'pulse-glow':       'pulse-glow 2.5s ease-in-out infinite',
        'shimmer':          'shimmer 2s infinite linear',
        'spin-slow':        'spin-slow 3s linear infinite',
        'bounce-subtle':    'bounce-subtle 2s ease-in-out infinite',
        'ticker':           'ticker-scroll 30s linear infinite',
        'gradient-shift':   'gradient-shift 12s ease infinite',
        'live-dot':         'live-dot 1.8s ease-in-out infinite',
        'card-enter':       'card-enter 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },

      transitionTimingFunction: {
        'spring':     'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':     'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
    },
  },
  plugins: [],
};
