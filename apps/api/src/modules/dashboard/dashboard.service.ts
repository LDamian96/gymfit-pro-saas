import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeMembers, totalRevenue, checkInsToday, dueSoon, pendingPayments, todayPayments, todayPaymentCount] = await Promise.all([
      // Miembros activos con membresía vigente
      this.prisma.member.count({
        where: { tenantId, isActive: true, membershipEnd: { gte: now } },
      }),
      // Ingresos del mes (pagos confirmados este mes)
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'CONFIRMED', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      // Check-ins de hoy
      this.prisma.checkIn.count({
        where: { tenantId, timestamp: { gte: startOfDay } },
      }),
      // Membresías que vencen en 7 días
      this.prisma.member.count({
        where: {
          tenantId,
          isActive: true,
          membershipEnd: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Pagos pendientes (monto total)
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      // Pagos de hoy (monto)
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'CONFIRMED', createdAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      // Cantidad de pagos hoy
      this.prisma.payment.count({
        where: { tenantId, createdAt: { gte: startOfDay } },
      }),
    ]);

    return {
      activeMembers,
      totalRevenue: totalRevenue._sum.amount || 0,
      checkInsToday,
      dueSoon,
      pendingAmount: pendingPayments._sum.amount || 0,
      pendingCount: pendingPayments._count || 0,
      todayAmount: todayPayments._sum.amount || 0,
      todayPaymentCount,
    };
  }

  async getRecentActivity(tenantId: string) {
    const [recentMembers, recentPayments, recentCheckIns] = await Promise.all([
      this.prisma.member.findMany({
        where: { tenantId },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.payment.findMany({
        where: { tenantId },
        include: { member: { include: { user: { select: { firstName: true, lastName: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.checkIn.findMany({
        where: { tenantId },
        include: { member: { include: { user: { select: { firstName: true, lastName: true } } } } },
        orderBy: { timestamp: 'desc' },
        take: 5,
      }),
    ]);

    return { recentMembers, recentPayments, recentCheckIns };
  }

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, logo: true, phone: true, email: true, emailDomain: true, address: true },
    });
    return tenant;
  }

  async updateSettings(tenantId: string, dto: { name?: string; phone?: string; email?: string; emailDomain?: string; address?: string }) {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
      select: { id: true, name: true, slug: true, logo: true, phone: true, email: true, emailDomain: true, address: true },
    });
    return tenant;
  }
}
