import { useEffect, useState, useCallback } from 'react';
import { getMarketSocket } from '../lib/socket';
import { useMarketStore } from '../store/marketStore';

export function useMarketSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { updatePrices } = useMarketStore();

  useEffect(() => {
    const socket = getMarketSocket();
    
    // If socket initialization failed, don't set up listeners
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onPriceUpdate = (data: any[]) => updatePrices(data);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('priceUpdate', onPriceUpdate);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('priceUpdate', onPriceUpdate);
    };
  }, [updatePrices]);

  const subscribe = useCallback((symbols: string[]) => {
    const socket = getMarketSocket();
    if (socket) {
      socket.emit('subscribe', symbols);
    }
  }, []);

  const unsubscribe = useCallback((symbols: string[]) => {
    const socket = getMarketSocket();
    if (socket) {
      socket.emit('unsubscribe', symbols);
    }
  }, []);

  return { isConnected, subscribe, unsubscribe };
}
