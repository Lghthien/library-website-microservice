import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // BM7.1: Thống kê mượn theo thể loại
  @Get('borrow-by-category')
  @RequirePermissions('Q012') // Xem thống kê
  async getBorrowStatisticsByCategory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Record<string, unknown>[]> {
    return await this.reportsService.getBorrowStatisticsByCategory(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // BM7.2: Báo cáo trả sách trễ hạn
  @Get('overdue-loans')
  @RequirePermissions('Q012')
  async getOverdueLoans(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('viewDate') viewDate?: string,
  ): Promise<Record<string, unknown>[]> {
    return await this.reportsService.getOverdueLoans(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      viewDate ? new Date(viewDate) : undefined,
    );
  }

  // Dashboard: Tổng quan hệ thống
  @Get('dashboard')
  @RequirePermissions('Q012')
  async getDashboardStats() {
    return await this.reportsService.getDashboardStats();
  }

  // Reader Age Distribution: Phân bố độ tuổi độc giả
  @Get('reader-age-distribution')
  @RequirePermissions('Q012')
  async getReaderAgeDistribution() {
    return await this.reportsService.getReaderAgeDistribution();
  }

  // Reader Debt Status: Tình trạng nợ
  @Get('reader-debt-status')
  @RequirePermissions('Q012')
  async getReaderDebtStatus() {
    return await this.reportsService.getReaderDebtStatus();
  }

  // Thống kê độc giả (Top readers)
  @Get('reader-statistics')
  @RequirePermissions('Q012')
  async getReaderStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Record<string, unknown>[]> {
    return await this.reportsService.getReaderStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // Thống kê thu tiền phạt
  @Get('fine-statistics')
  @RequirePermissions('Q012')
  async getFineStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Record<string, number>> {
    return await this.reportsService.getFineStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // Phân bố sách theo thể loại
  @Get('books-distribution')
  @RequirePermissions('Q012')
  async getBooksDistribution(): Promise<Record<string, unknown>[]> {
    return await this.reportsService.getBooksDistribution();
  }

  // Xu hướng mượn trả (6 tháng gần nhất)
  @Get('trend')
  @RequirePermissions('Q012')
  async getTrendStatistics(@Query('months') months?: string) {
    const numMonths = months ? parseInt(months) : 12; // Default 12 months
    return await this.reportsService.getTrendStatistics(numMonths);
  }
}
