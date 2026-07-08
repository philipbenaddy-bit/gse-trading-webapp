import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light'  as const, icon: Sun,     label: 'Light'  },
    { value: 'dark'   as const, icon: Moon,    label: 'Dark'   },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-0.5 p-1 bg-muted/60 border border-[#D4AF37]/15 rounded-xl">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'p-2 rounded-lg transition-all duration-250',
            theme === value
              ? 'bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white shadow-sm shadow-[#D4AF37]/30'
              : 'text-muted-foreground hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
          )}
          title={label}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
