import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { StaffAttendanceService } from './staff-attendance.service';
import { ScanStaffDto } from './dto/scan-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/staff-attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffAttendanceController {
  constructor(private readonly service: StaffAttendanceService) {}

  // QR personal del staff logueado. Genera uno si aun no lo tiene.
  @Get('my-qr')
  @Roles('ADMIN', 'TRAINER', 'RECEPTIONIST')
  getMyQr(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getMyQr(userId, tenantId);
  }

  // Escanear QR de staff. Valida same-branch (salvo admin).
  @Post('scan')
  @Roles('ADMIN', 'TRAINER', 'RECEPTIONIST')
  scan(
    @Body() dto: ScanStaffDto,
    @CurrentUser('userId') scannerId: string,
    @CurrentUser('role') scannerRole: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.scan(dto.qrCode, scannerId, scannerRole, tenantId);
  }

  // Listado con filtros para historial (admin + recepcion).
  @Get()
  @Roles('ADMIN', 'TRAINER', 'RECEPTIONIST')
  list(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId: string | null,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('branchId') branchFilter?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.list(tenantId, role, branchId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      userId: userId || undefined,
      branchId: branchFilter || undefined,
      from,
      to,
    });
  }

  // Asistencias de HOY del staff logueado (para su dashboard).
  @Get('my-today')
  @Roles('ADMIN', 'TRAINER', 'RECEPTIONIST')
  myToday(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.myToday(userId, tenantId);
  }
}
