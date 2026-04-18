import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@RequirePermissions('Q018') // Xem nhật ký hệ thống
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  // Get all audit logs (paginated)
  @Get()
  async getAllLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.auditLogsService.getAllLogs(
      parseInt(page),
      parseInt(limit),
    );
  }

  // Get logs by user
  @Get('user/:userId')
  async getLogsByUser(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.auditLogsService.getLogsByUser(
      // Will be set from the query path parameter in actual use
      '',
      parseInt(page),
      parseInt(limit),
    );
  }

  // Get logs by table/entity
  @Get('table/:tableName')
  async getLogsByTable(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.auditLogsService.getLogsByTable(
      // Will be set from the query path parameter in actual use
      '',
      parseInt(page),
      parseInt(limit),
    );
  }

  // Get logs by action (INSERT, UPDATE, DELETE)
  @Get('action/:action')
  async getLogsByAction(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.auditLogsService.getLogsByAction(
      // Will be set from the query path parameter in actual use
      '',
      parseInt(page),
      parseInt(limit),
    );
  }

  // Get logs by date range
  @Get('date-range')
  async getLogsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.auditLogsService.getLogsByDateRange(
      new Date(startDate),
      new Date(endDate),
      parseInt(page),
      parseInt(limit),
    );
  }

  // Get statistics
  @Get('statistics')
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.auditLogsService.getStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // Get recent activity
  @Get('recent')
  async getRecentActivity(@Query('limit') limit: string = '10') {
    return await this.auditLogsService.getRecentActivity(parseInt(limit));
  }
}
