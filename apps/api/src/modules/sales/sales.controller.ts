import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import type { CreateSaleDto } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // Crear venta — admin, recepción o entrenador
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST', 'TRAINER')
  create(
    @Body() body: CreateSaleDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.salesService.create(body, tenantId, userId);
  }

  // Listado paginado de ventas — admin ve todo (puede filtrar por branchId);
  // recepción/trainer ve solo su sucursal (branchId del query es ignorado).
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST', 'TRAINER')
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.salesService.findAll(tenantId, userId, role, {
      from,
      to,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      branchId,
    });
  }

  // Resumen de ventas de HOY del seller actual
  @Get('me/today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST', 'TRAINER')
  findMyToday(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.salesService.findMyToday(tenantId, userId);
  }

  // Reporte agregado — solo admin (puede filtrar por sede)
  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  summary(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.salesService.summary(tenantId, { from, to, branchId });
  }
}
