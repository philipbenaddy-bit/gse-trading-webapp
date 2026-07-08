import { GseService } from '../gse/gse.service';
export declare class MarketController {
    private gseService;
    constructor(gseService: GseService);
    getLive(): {
        data: import("../gse/gse.service").GseLiveStock[];
        lastUpdated: Date;
    };
    getLiveBySymbol(symbol: string): import("../gse/gse.service").GseLiveStock;
    getEquities(): import("../gse/gse.service").GseEquity[];
    getEquity(symbol: string): Promise<import("../gse/gse.service").GseEquity>;
}
