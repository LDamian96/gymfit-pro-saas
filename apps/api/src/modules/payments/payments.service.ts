import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, tenantId: string, createdById?: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, tenantId },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado en este gimnasio');

    const payment = await this.prisma.payment.create({
      data: {
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
        proofUrl: dto.proofUrl,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        memberId: dto.memberId,
        tenantId,
        createdById,
        // Pagos creados por admin/recepción son cobrados en mano → CONFIRMED.
        // PENDING queda para flujos online (MercadoPago) que esperan webhook.
        status: 'CONFIRMED',
      },
      include: {
        member: { include: { user: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return this.formatPayment(payment);
  }

  async findAll(tenantId: string, query: QueryPaymentDto) {
    const { page = 1, limit = 10, memberId, status, method, dateFrom, dateTo, branchId } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (memberId) where.memberId = memberId;
    if (status) where.status = status;
    if (method) where.method = method;
    // Filtro por sede: el payment no tiene branchId, sino el member relacionado.
    if (branchId) where.member = { branchId };
    if (dateFrom || dateTo) {
      const createdAtFilter: Record<string, Date> = {};
      if (dateFrom) createdAtFilter.gte = new Date(dateFrom);
      if (dateTo) createdAtFilter.lte = new Date(dateTo);
      where.createdAt = createdAtFilter;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          member: { include: { user: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments.map((p) => this.formatPayment(p)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateStatus(id: string, dto: UpdatePaymentStatusDto, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id, tenantId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: dto.status },
      include: {
        member: { include: { user: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return this.formatPayment(updated);
  }

  private formatPayment(payment: Record<string, unknown>) {
    const p = payment as Record<string, unknown> & {
      member: { id: string; user: { firstName: string; lastName: string; email: string } };
      createdBy?: { firstName: string; lastName: string } | null;
    };
    return {
      id: p.id,
      amount: p.amount,
      method: p.method,
      reference: p.reference,
      proofUrl: p.proofUrl,
      status: p.status,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      createdAt: p.createdAt,
      memberId: p.memberId,
      member: {
        id: p.member.id,
        firstName: p.member.user.firstName,
        lastName: p.member.user.lastName,
        email: p.member.user.email,
      },
      createdBy: p.createdBy ? `${p.createdBy.firstName} ${p.createdBy.lastName}` : null,
    };
  }
}
