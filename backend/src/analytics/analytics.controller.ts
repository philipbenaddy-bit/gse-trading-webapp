import { Controller, Get, Query, Request, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('market-metrics')
  @ApiOperation({ summary: 'Get live market metrics (gainers, losers, volume)' })
  getMarketMetrics() {
    return this.analyticsService.getMarketMetrics();
  }

  @Get('sectors')
  @ApiOperation({ summary: 'Get sector allocation from GSE equities' })
  getSectorAllocation() {
    return this.analyticsService.getSectorAllocation();
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get portfolio performance over time' })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['1W', '1M', '3M', '1Y', 'ALL'] })
  async getPerformance(
    @Request() req,
    @Query('timeframe') timeframe = '1M',
  ) {
    return this.analyticsService.getPortfolioPerformance(req.user.id, timeframe);
  }

  @Get('trading-stats')
  @ApiOperation({ summary: 'Get user trading statistics' })
  async getTradingStats(@Request() req) {
    return this.analyticsService.getTradingStats(req.user.id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export data as JSON (portfolio, orders, transactions)' })
  @ApiQuery({ name: 'type', enum: ['portfolio', 'orders', 'transactions'] })
  async exportData(
    @Request() req,
    @Query('type') type: 'portfolio' | 'orders' | 'transactions' = 'orders',
    @Res() res: Response,
  ) {
    const data = await this.analyticsService.getExportData(req.user.id, type);

    // Build CSV
    if (!data.length) {
      return res.json({ data: [], message: 'No data to export' });
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
        .join(','),
    );
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
    return res.send(csv);
  }
}
