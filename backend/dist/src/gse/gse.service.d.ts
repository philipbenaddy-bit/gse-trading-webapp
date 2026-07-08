import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
        directors?: {
            name: string;
            position?: string;
        }[];
    };
}
export declare class GseService implements OnModuleInit {
    private config;
    private readonly logger;
    private readonly baseUrl;
    private liveCache;
    private equitiesCache;
    private lastUpdated;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    refreshLiveData(): Promise<void>;
    refreshEquitiesData(): Promise<void>;
    getAllLive(): GseLiveStock[];
    getLiveBySymbol(symbol: string): GseLiveStock | null;
    getAllEquities(): GseEquity[];
    getEquityBySymbol(symbol: string): GseEquity | null;
    getCurrentPrice(symbol: string): number | null;
    getLastUpdated(): Date | null;
    fetchEquityDetail(symbol: string): Promise<GseEquity | null>;
}
