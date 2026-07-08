import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

export interface GseLiveStock {
  name: string;
  price: number;
  change: number;
  volume: number;
}

export interface GseEquity {
  name: string;
  price: number;
  capital?: number;
  dps?: number;
  eps?: number;
  shares?: number;
  company?: {
    name: string;
    address?: string;
    email?: string;
    telephone?: string;
    website?: string;
    industry?: string;
    sector?: string;
    facsimile?: string;
    directors?: { name: string; position?: string }[];
  };
}

@Injectable()
export class GseService implements OnModuleInit {
  private readonly logger = new Logger(GseService.name);
  private readonly baseUrl: string;
  private liveCache: Map<string, GseLiveStock> = new Map();
  private equitiesCache: Map<string, GseEquity> = new Map();
  private lastUpdated: Date | null = null;

  constructor(private config: ConfigService) {
    this.baseUrl = config.get('GSE_API_BASE_URL', 'https://dev.kwayisi.org/apis/gse');
  }

  async onModuleInit() {
    // Fetch data on startup
    await this.refreshLiveData();
    await this.refreshEquitiesData();
  }

  // Poll live prices every 30 seconds during market hours
  @Cron('*/30 * * * * *')
  async refreshLiveData() {
    try {
      const response = await axios.get<GseLiveStock[]>(`${this.baseUrl}/live`, {
        timeout: 10000,
      });
      const stocks = response.data;
      stocks.forEach((stock) => {
        this.liveCache.set(stock.name.toUpperCase(), stock);
      });
      this.lastUpdated = new Date();
      this.logger.debug(`Live data refreshed: ${stocks.length} stocks`);
    } catch (error) {
      this.logger.error('Failed to refresh GSE live data', error.message);
    }
  }

  // Refresh full equity data every hour
  @Cron(CronExpression.EVERY_HOUR)
  async refreshEquitiesData() {
    try {
      const response = await axios.get<GseEquity[]>(`${this.baseUrl}/equities`, {
        timeout: 10000,
      });
      const equities = response.data;
      equities.forEach((equity) => {
        this.equitiesCache.set(equity.name.toUpperCase(), equity);
      });
      this.logger.debug(`Equities data refreshed: ${equities.length} stocks`);
    } catch (error) {
      this.logger.error('Failed to refresh GSE equities data', error.message);
    }
  }

  getAllLive(): GseLiveStock[] {
    return Array.from(this.liveCache.values());
  }

  getLiveBySymbol(symbol: string): GseLiveStock | null {
    return this.liveCache.get(symbol.toUpperCase()) || null;
  }

  getAllEquities(): GseEquity[] {
    return Array.from(this.equitiesCache.values());
  }

  getEquityBySymbol(symbol: string): GseEquity | null {
    return this.equitiesCache.get(symbol.toUpperCase()) || null;
  }

  getCurrentPrice(symbol: string): number | null {
    const live = this.getLiveBySymbol(symbol);
    if (live) return live.price;
    const equity = this.getEquityBySymbol(symbol);
    return equity ? equity.price : null;
  }

  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }

  async fetchEquityDetail(symbol: string): Promise<GseEquity | null> {
    try {
      const response = await axios.get<GseEquity>(
        `${this.baseUrl}/equities/${symbol.toLowerCase()}`,
        { timeout: 10000 },
      );
      const equity = response.data;
      this.equitiesCache.set(symbol.toUpperCase(), equity);
      return equity;
    } catch (error) {
      this.logger.error(`Failed to fetch equity detail for ${symbol}`, error.message);
      return null;
    }
  }
}
