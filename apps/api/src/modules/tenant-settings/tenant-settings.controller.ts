import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { TenantSettingsService } from './tenant-settings.service';
import type { UpdatePosSettingsDto } from './tenant-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/tenant/settings')
@UseGuards(JwtAuthGuard)
export class TenantSettingsController {
  constructor(private readonly service: TenantSettingsService) {}

  // Cualquier rol logueado puede leer los settings (para saber si puede usar POS)
  @Get()
  getSettings(@CurrentUser('tenantId') tenantId: string) {
    return this.service.getSettings(tenantId);
  }

  // Solo admin modifica
  @Patch('pos')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updatePos(@CurrentUser('tenantId') tenantId: string, @Body() body: UpdatePosSettingsDto) {
    return this.service.updatePosSettings(tenantId, body);
  }
}
