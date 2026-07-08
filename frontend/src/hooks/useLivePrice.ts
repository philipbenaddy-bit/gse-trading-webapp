import { useEffect, useState } from 'react';
import { useMarketStore } from '../store/marketStore';
import { useMarketSocket } from './useMarketSocket';

/**
 * Hook to get live price updates for a single symbol
 * Automatically subscribes/unsubscribes to WebSocket updates
 */
export function useLivePrice(symbol: string | undefined) {
  const { getPrice } = useMarketStore();
  const { subscribe, unsubscribe, isConnected } = useMarketSocket();
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [volume, setVolume] = useState<number | null>(null);

  useEffect(() => {
    if (!symbol) return;

    // Subscribe to this symbol
    subscribe([symbol]);

    // Cleanup: unsubscribe when component unmounts
    return () => {
      unsubscribe([symbol]);
    };
  }, [symbol, subscribe, unsubscribe]);

  useEffect(() => {
    if (!symbol) return;

    // Update local state when store updates
    const updateFromStore = () => {
      const liveData = getPrice(symbol);
      if (liveData) {
        setPrice(liveData.price);
        setChange(liveData.change);
        setVolume(liveData.volume);
      }
    };

    // Initial update
    updateFromStore();

    // Subscribe to store changes
    const unsubscribeStore = useMarketStore.subscribe(updateFromStore);

    return unsubscribeStore;
  }, [symbol, getPrice]);

  return {
    price,
    change,
    volume,
    isConnected,
  };
}

/**
 * Hook to get live price updates for multiple symbols
 * Automatically subscribes/unsubscribes to WebSocket updates
 */
export function useLivePrices(symbols: string[]) {
  const { getPrice } = useMarketStore();
  const { subscribe, unsubscribe, isConnected } = useMarketSocket();
  const [prices, setPrices] = useState<Record<string, { price: number; change: number; volume: number }>>({});

  useEffect(() => {
    if (!symbols || symbols.length === 0) return;

    // Subscribe to all symbols
    subscribe(symbols);

    // Cleanup: unsubscribe when component unmounts
    return () => {
      unsubscribe(symbols);
    };
  }, [symbols.join(','), subscribe, unsubscribe]); // Use join to avoid array reference issues

  useEffect(() => {
    if (!symbols || symbols.length === 0) return;

    // Update local state when store updates
    const updateFromStore = () => {
      const newPrices: Record<string, { price: number; change: number; volume: number }> = {};
      
      symbols.forEach((symbol) => {
        const liveData = getPrice(symbol);
        if (liveData) {
          newPrices[symbol] = {
            price: liveData.price,
            change: liveData.change,
            volume: liveData.volume,
          };
        }
      });

      setPrices(newPrices);
    };

    // Initial update
    updateFromStore();

    // Subscribe to store changes
    const unsubscribeStore = useMarketStore.subscribe(updateFromStore);

    return unsubscribeStore;
  }, [symbols.join(','), getPrice]);

  return {
    prices,
    isConnected,
  };
}
