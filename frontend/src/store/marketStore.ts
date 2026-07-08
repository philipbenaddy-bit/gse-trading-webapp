import { create } from 'zustand';

export interface LiveStock {
  name: string;
  price: number;
  change: number;
  volume: number;
}

interface MarketState {
  prices: Record<string, LiveStock>;
  updatePrices: (stocks: LiveStock[]) => void;
  getPrice: (symbol: string) => LiveStock | null;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  prices: {},

  updatePrices: (stocks) =>
    set((state) => {
      const updated = { ...state.prices };
      stocks.forEach((s) => {
        updated[s.name.toUpperCase()] = s;
      });
      return { prices: updated };
    }),

  getPrice: (symbol) => get().prices[symbol.toUpperCase()] || null,
}));
