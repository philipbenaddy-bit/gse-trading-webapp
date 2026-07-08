import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GseService } from '../gse/gse.service';

@ApiTags('Market')
@Controller('market')
export class MarketController {
  constructor(private gseService: GseService) {}

  @Get('live')
  @ApiOperation({ summary: 'Get live prices for all GSE stocks' })
  getLive() {
    return {
      data: this.gseService.getAllLive(),
      lastUpdated: this.gseService.getLastUpdated(),
    };
  }

  @Get('live/:symbol')
  @ApiOperation({ summary: 'Get live price for a specific stock' })
  getLiveBySymbol(@Param('symbol') symbol: string) {
    return this.gseService.getLiveBySymbol(symbol);
  }

  @Get('equities')
  @ApiOperation({ summary: 'Get all listed equities' })
  getEquities() {
    return this.gseService.getAllEquities();
  }

  @Get('equities/:symbol')
  @ApiOperation({ summary: 'Get detailed equity info' })
  async getEquity(@Param('symbol') symbol: string) {
    // Try cache first, then fetch from API
    const cached = this.gseService.getEquityBySymbol(symbol);
    if (cached && cached.company) return cached;
    return this.gseService.fetchEquityDetail(symbol);
  }
}
