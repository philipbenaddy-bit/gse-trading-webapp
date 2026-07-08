import React from 'react';
import { User } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, size = 'md', fallback, status, className = '', ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    
    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
    };
    
    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500',
    };
    
    const statusSizes = {
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    };
    
    const getInitials = (name?: string) => {
      if (!name) return '';
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };
    
    return (
      <div ref={ref} className={`relative inline-block ${className}`} {...props}>
        <div
          className={`${sizes[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}
        >
          {src && !imageError ? (
            <img
              src={src}
              alt={alt || 'Avatar'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : fallback ? (
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {getInitials(fallback)}
            </span>
          ) : (
            <User className="text-gray-400" size={size === 'sm' ? 16 : size === 'xl' ? 32 : 20} />
          )}
        </div>
        
        {status && (
          <span
            className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} rounded-full border-2 border-white dark:border-gray-800`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export const AvatarGroup: React.FC<{
  children: React.ReactNode;
  max?: number;
  className?: string;
}> = ({ children, max = 3, className = '' }) => {
  const childArray = React.Children.toArray(children);
  const displayChildren = max ? childArray.slice(0, max) : childArray;
  const remaining = childArray.length - displayChildren.length;
  
  return (
    <div className={`flex -space-x-2 ${className}`}>
      {displayChildren}
      {remaining > 0 && (
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 border-2 border-white dark:border-gray-800">
          +{remaining}
        </div>
      )}
    </div>
  );
};
