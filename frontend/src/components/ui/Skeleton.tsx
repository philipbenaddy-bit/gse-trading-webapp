import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'rectangular',
      width,
      height,
      animation = 'pulse',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'bg-gray-200 dark:bg-gray-700';
    
    const variants = {
      text: 'rounded h-4',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };
    
    const animations = {
      pulse: 'animate-pulse',
      wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
      none: '',
    };
    
    const inlineStyles: React.CSSProperties = {
      ...style,
      width: width || (variant === 'circular' ? height : '100%'),
      height: height || (variant === 'text' ? undefined : '100%'),
    };
    
    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${animations[animation]} ${className}`}
        style={inlineStyles}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '80%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 space-y-4 ${className}`}>
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);
