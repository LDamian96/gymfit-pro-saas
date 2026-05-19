import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  @Roles('RECEPTIONIST', 'ADMIN')
  scanQr(
    @Body() dto: CreateCheckinDto,
    @CurrentUser('userId') scannedById: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.checkinService.scanQr(dto, scannedById, tenantId);
  }

  @Get('today')
  @Roles('RECEPTIONIST', 'ADMIN')
  getTodayCheckIns(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.checkinService.getTodayCheckIns(tenantId, userId, role, branchId);
  }

  // Historial completo de asistencias (panel admin / recepción). Paginado + filtros.
  @Get('history')
  @Roles('ADMIN', 'RECEPTIONIST', 'TRAINER')
  getHistory(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.checkinService.getHistory(tenantId, userId, role, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      branchId: branchId || undefined,
      from,
      to,
    });
  }

  // Histórico de check-ins de un miembro. Lo usa el cliente para ver su asistencia.
  @Get('member/:memberId')
  @Roles('CLIENT', 'ADMIN', 'TRAINER', 'RECEPTIONIST')
  findByMember(
    @Param('memberId') memberId: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.checkinService.findByMember(memberId, tenantId, userId, role);
  }

  // Último check-in del usuario actual — usado por el toaster del cliente.
  @Get('my-last')
  @Roles('CLIENT', 'ADMIN', 'TRAINER', 'RECEPTIONIST')
  findMyLast(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.checkinService.findMyLast(tenantId, userId);
  }
}
