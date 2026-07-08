import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover3d?: boolean;
  gradient?: string;
}

export function GlassCard({ children, className, hover3d = false, gradient }: GlassCardProps) {
  return (
    <div className={cn(
      'african-card',
      hover3d && 'hover:scale-[1.02] hover:-translate-y-1',
      className
    )}>
      {gradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`} />
      )}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
