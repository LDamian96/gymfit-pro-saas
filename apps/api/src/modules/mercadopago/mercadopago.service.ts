import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadoPagoConfig, Preference, Payment as MpPayment } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private mpClient: MercadoPagoConfig;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');
    if (!accessToken) throw new Error('MP_ACCESS_TOKEN no configurado');
    this.mpClient = new MercadoPagoConfig({ accessToken });
  }

  /**
   * Crea una preferencia de pago en Mercado Pago para un plan específico
   */
  async createPreference(planId: string, tenantId: string | undefined, memberEmail: string, slug?: string) {
    // Resolver tenant por ID o slug
    let tenant;
    if (tenantId) {
      tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    } else if (slug) {
      tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    }
    if (!tenant) throw new NotFoundException('Gimnasio no encontrado');

    const resolvedTenantId = tenant.id;

    // Buscar el plan en la BD
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, tenantId: resolvedTenantId, isActive: true },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const apiUrl = this.configService.get<string>('API_URL') || `http://localhost:${this.configService.get('API_PORT') || 3002}`;

    const preference = new Preference(this.mpClient);

    const durationLabel = plan.duration === 1 ? '1 mes' : `${plan.duration} meses`;

    const result = await preference.create({
      body: {
        items: [
          {
            id: plan.id,
            title: `${plan.name} — ${tenant.name}`,
            description: `Membresía ${plan.name} (${durationLabel})`,
            quantity: 1,
            unit_price: plan.price,
            currency_id: 'PEN',
          },
        ],
        payer: {
          email: memberEmail,
        },
        back_urls: {
          success: `${frontendUrl}/${tenant.slug}/planes?status=approved`,
          failure: `${frontendUrl}/${tenant.slug}/planes?status=rejected`,
          pending: `${frontendUrl}/${tenant.slug}/planes?status=pending`,
        },
        auto_return: 'approved',
        external_reference: JSON.stringify({
          planId: plan.id,
          tenantId: resolvedTenantId,
          planName: plan.name,
          duration: plan.duration,
          amount: plan.price,
        }),
        notification_url: `${apiUrl}/api/v1/mercadopago/webhook`,
        statement_descriptor: tenant.name.substring(0, 22),
      },
    });

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    };
  }

  /**
   * Crea una preferencia desde el panel admin (para cobrar a un miembro específico)
   */
  async createAdminPreference(planId: string, memberId: string, tenantId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, tenantId, isActive: true },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Gimnasio no encontrado');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const apiUrl = this.configService.get<string>('API_URL') || `http://localhost:${this.configService.get('API_PORT') || 3002}`;

    const preference = new Preference(this.mpClient);
    const durationLabel = plan.duration === 1 ? '1 mes' : `${plan.duration} meses`;

    const result = await preference.create({
      body: {
        items: [
          {
            id: plan.id,
            title: `${plan.name} — ${tenant.name}`,
            description: `Membresía ${plan.name} (${durationLabel}) para ${member.user.firstName} ${member.user.lastName}`,
            quantity: 1,
            unit_price: plan.price,
            currency_id: 'PEN',
          },
        ],
        payer: {
          email: member.user.email,
        },
        back_urls: {
          success: `${frontendUrl}/finances?mp=approved`,
          failure: `${frontendUrl}/finances?mp=rejected`,
          pending: `${frontendUrl}/finances?mp=pending`,
        },
        auto_return: 'approved',
        external_reference: JSON.stringify({
          planId: plan.id,
          memberId: member.id,
          tenantId,
          planName: plan.name,
          duration: plan.duration,
          amount: plan.price,
        }),
        notification_url: `${apiUrl}/api/v1/mercadopago/webhook`,
      },
    });

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    };
  }

  /**
   * Procesa webhook de Mercado Pago
   */
  async handleWebhook(body: Record<string, unknown>) {
    const type = body.type as string;
    const dataId = (body.data as Record<string, unknown>)?.id as string;

    if (type !== 'payment' || !dataId) return { received: true };

    // Consultar el pago en Mercado Pago
    const mpPayment = new MpPayment(this.mpClient);
    const payment = await mpPayment.get({ id: dataId });

    if (!payment || !payment.external_reference) return { received: true };

    let ref: { planId: string; memberId?: string; tenantId: string; planName: string; duration: number; amount: number };
    try {
      ref = JSON.parse(payment.external_reference);
    } catch {
      return { received: true };
    }

    if (payment.status === 'approved') {
      // Si viene memberId, registrar el pago en la BD
      if (ref.memberId) {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + ref.duration * 30);

        // Crear pago en la BD
        await this.prisma.payment.create({
          data: {
            amount: ref.amount,
            method: 'MERCADOPAGO',
            reference: `MP-${dataId}`,
            status: 'CONFIRMED',
            periodStart: now,
            periodEnd: endDate,
            memberId: ref.memberId,
            tenantId: ref.tenantId,
          },
        });

        // Actualizar membresía del miembro
        await this.prisma.member.update({
          where: { id: ref.memberId },
          data: {
            isActive: true,
            membershipStart: now,
            membershipEnd: endDate,
          },
        });
      }
    }

    return { received: true, status: payment.status };
  }
}
