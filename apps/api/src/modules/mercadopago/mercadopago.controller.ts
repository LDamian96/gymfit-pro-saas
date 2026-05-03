import { Controller, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/mercadopago')
export class MercadoPagoController {
  constructor(private readonly mpService: MercadoPagoService) {}

  /**
   * Crear preferencia de pago desde el landing público
   * El miembro selecciona un plan y se genera el link de pago
   */
  @Post('checkout/:planId')
  async createCheckout(
    @Param('planId') planId: string,
    @Body() body: { email: string; tenantId?: string; slug?: string },
  ) {
    return this.mpService.createPreference(planId, body.tenantId, body.email, body.slug);
  }

  /**
   * Crear preferencia de pago desde el panel admin
   * El admin cobra a un miembro específico por un plan
   */
  @Post('admin/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createAdminCheckout(
    @Body() body: { planId: string; memberId: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.mpService.createAdminPreference(body.planId, body.memberId, tenantId);
  }

  /**
   * Webhook de Mercado Pago — recibe notificaciones de pago
   * Ruta pública (MP envía POST sin auth)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() body: Record<string, unknown>) {
    return this.mpService.handleWebhook(body);
  }
}
