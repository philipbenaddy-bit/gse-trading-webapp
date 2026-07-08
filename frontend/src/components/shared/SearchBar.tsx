import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

interface SearchResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock search results - in production, this would call an API
  const mockStocks: SearchResult[] = [
    { symbol: 'MTNGH', name: 'MTN Ghana', price: 1.25, change: 2.5 },
    { symbol: 'GOIL', name: 'Ghana Oil Company', price: 2.50, change: -1.2 },
    { symbol: 'GCB', name: 'GCB Bank', price: 5.80, change: 0.8 },
    { symbol: 'TOTAL', name: 'Total Petroleum', price: 3.20, change: 1.5 },
    { symbol: 'SCB', name: 'Standard Chartered Bank', price: 18.50, change: -0.5 },
    { symbol: 'EGH', name: 'Enterprise Group', price: 2.10, change: 3.2 },
    { symbol: 'CAL', name: 'CAL Bank', price: 0.95, change: 0.0 },
    { symbol: 'SOGEGH', name: 'Societe Generale Ghana', price: 0.75, change: 1.8 },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      const filtered = mockStocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
          stock.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsOpen(true);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectStock = (symbol: string) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/trade/${symbol}`);
  };

  const formatPrice = (price: number) => {
    return `GHS ${price.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4"
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
        />
      </div>

      {/* Search results dropdown */}
      {isOpen && (
        <div className="absolute top-12 left-0 right-0 z-50 rounded-lg border bg-card shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No stocks found for "{query}"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <div className="p-2 text-xs font-medium text-muted-foreground">
                Stocks ({results.length})
              </div>
              <div className="divide-y">
                {results.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectStock(stock.symbol)}
                    className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {stock.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-medium">
                        {formatPrice(stock.price)}
                      </p>
                      <p
                        className={cn(
                          'text-xs font-medium',
                          stock.change > 0
                            ? 'text-accent'
                            : stock.change < 0
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formatChange(stock.change)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
