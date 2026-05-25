import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Stats y actividad reciente: ADMIN y RECEPCIÓN las necesitan para sus pantallas
  @Get('stats')
  @Roles('ADMIN', 'RECEPTIONIST')
  getStats(@CurrentUser('tenantId') tenantId: string, @Query('branchId') branchId?: string) {
    return this.dashboardService.getStats(tenantId, branchId || undefined);
  }

  @Get('recent-activity')
  @Roles('ADMIN', 'RECEPTIONIST')
  getRecentActivity(@CurrentUser('tenantId') tenantId: string, @Query('branchId') branchId?: string) {
    return this.dashboardService.getRecentActivity(tenantId, branchId || undefined);
  }

  // Configuración del tenant: solo ADMIN
  @Get('settings')
  @Roles('ADMIN')
  getSettings(@CurrentUser('tenantId') tenantId: string) {
    return this.dashboardService.getSettings(tenantId);
  }

  @Patch('settings')
  @Roles('ADMIN')
  updateSettings(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: { name?: string; phone?: string; email?: string; emailDomain?: string; address?: string },
  ) {
    return this.dashboardService.updateSettings(tenantId, dto);
  }
}
