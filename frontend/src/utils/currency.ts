/**
 * Currency formatting utilities for Ghana Cedis (GH₵)
 */

export const formatGHS = (
  amount: number,
  options: { showSymbol?: boolean; decimals?: number; compact?: boolean } = {}
): string => {
  const { showSymbol = true, decimals = 2, compact = false } = options;

  if (compact && Math.abs(amount) >= 1000) {
    const formatted = new Intl.NumberFormat('en-GH', {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
    return showSymbol ? `GH₵${formatted}` : formatted;
  }

  const formatted = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return showSymbol ? `GH₵${formatted}` : formatted;
};

export const formatPercentage = (value: number, showSign: boolean = true): string => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const getValueColorClass = (value: number): string => {
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
};

export const formatGhanaTime = (
  date: Date | string,
  options: { includeTime?: boolean; includeSeconds?: boolean } = {}
): string => {
  const { includeTime = true, includeSeconds = false } = options;
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Accra',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
    if (includeSeconds) dateOptions.second = '2-digit';
  }

  return new Intl.DateTimeFormat('en-GH', dateOptions).format(dateObj);
};

export const getMarketStatus = (): {
  isOpen: boolean;
  message: string;
  nextOpen?: string;
} => {
  const now = new Date();
  const ghanaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Accra' }));
  
  const day = ghanaTime.getDay();
  const hours = ghanaTime.getHours();
  const minutes = ghanaTime.getMinutes();
  const currentTime = hours + minutes / 60;

  if (day === 0 || day === 6) {
    return { isOpen: false, message: 'Market Closed - Weekend', nextOpen: 'Monday 10:00 AM' };
  }

  if (currentTime >= 10 && currentTime < 15) {
    return { isOpen: true, message: 'Market Open' };
  }

  if (currentTime < 10) {
    return { isOpen: false, message: 'Market Closed - Pre-Market', nextOpen: 'Today 10:00 AM' };
  }

  return {
    isOpen: false,
    message: 'Market Closed - After Hours',
    nextOpen: day === 5 ? 'Monday 10:00 AM' : 'Tomorrow 10:00 AM',
  };
};
