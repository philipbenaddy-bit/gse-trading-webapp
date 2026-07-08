import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'african';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', padding = 'none', className = '', ...props }, ref) => {
    const base = 'rounded-xl transition-all duration-300';

    const variants = {
      default:  'bg-card text-card-foreground border border-border shadow-sm',
      bordered: 'bg-card text-card-foreground border border-border',
      elevated: 'bg-card text-card-foreground shadow-lg hover:shadow-xl',
      african:  'african-card',
    };

    const paddings = {
      none: '',
      sm:   'p-3',
      md:   'p-4',
      lg:   'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(base, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = '', ...props
}) => (
  <div className={cn('p-6 pb-0', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children, className = '', ...props
}) => (
  <h3 className={cn('text-lg font-semibold text-foreground leading-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children, className = '', ...props
}) => (
  <p className={cn('text-sm text-muted-foreground mt-1', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = '', ...props
}) => (
  <div className={cn('p-6 pt-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = '', ...props
}) => (
  <div className={cn('p-6 pt-0 border-t border-border mt-4', className)} {...props}>
    {children}
  </div>
);
