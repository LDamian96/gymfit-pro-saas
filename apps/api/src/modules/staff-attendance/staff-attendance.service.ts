import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class StaffAttendanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Genera (si no tiene) y devuelve el QR personal del usuario logueado.
   * Formato: GYM-STAFF-<8 chars hex> — distinguible del QR de members (GYM-MEMBER-...).
   */
  async getMyQr(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { id: true, qrCode: true, role: true, firstName: true, lastName: true, branchId: true, branch: { select: { id: true, name: true } } },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === 'CLIENT') throw new BadRequestException('Los clientes usan el QR de su membresia');

    if (user.qrCode) {
      return {
        qrCode: user.qrCode,
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role },
        branch: user.branch,
      };
    }

    // Generar QR unico hasta encontrar uno libre (collision extremadamente rara con 8 bytes).
    let qrCode = '';
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = `GYM-STAFF-${randomBytes(4).toString('hex').toUpperCase()}`;
      const exists = await this.prisma.user.findUnique({ where: { qrCode: candidate }, select: { id: true } });
      if (!exists) { qrCode = candidate; break; }
    }
    if (!qrCode) throw new BadRequestException('No se pudo generar QR. Reintentar.');

    await this.prisma.user.update({ where: { id: userId }, data: { qrCode } });
    return {
      qrCode,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role },
      branch: user.branch,
    };
  }

  /**
   * Toma asistencia a un staff via QR. Reglas:
   * - Solo RECEPTIONIST/TRAINER/ADMIN pueden escanear (controller).
   * - QR debe pertenecer a un staff (no CLIENT) del mismo tenant.
   * - El scanner y el escaneado DEBEN estar en la misma sede (salvo ADMIN).
   * - Duplicado: si ya hay un check-in del mismo staff en las ultimas 5h, marca isDuplicate.
   * - Crea una Notification dirigida al staff escaneado para que la vea en su bell.
   */
  async scan(qrCode: string, scannerId: string, scannerRole: string, tenantId: string) {
    const scanner = await this.prisma.user.findFirst({
      where: { id: scannerId, tenantId, deletedAt: null },
      select: { id: true, role: true, branchId: true, firstName: true, lastName: true, branch: { select: { name: true } } },
    });
    if (!scanner) throw new NotFoundException('Scanner no encontrado');

    const target = await this.prisma.user.findFirst({
      where: { qrCode, tenantId, deletedAt: null },
      select: { id: true, role: true, branchId: true, firstName: true, lastName: true, branch: { select: { id: true, name: true } } },
    });
    if (!target) throw new NotFoundException('QR de staff invalido o no encontrado');
    if (target.role === 'CLIENT') throw new BadRequestException('Este QR pertenece a un cliente, usa el scanner de check-in normal');

    // Validacion same-branch: ADMIN puede cruzar sedes; el resto NO.
    const isAdmin = scannerRole === 'ADMIN';
    if (!isAdmin && scanner.branchId && target.branchId && scanner.branchId !== target.branchId) {
      throw new ForbiddenException(`No autorizado: ${target.firstName} pertenece a otra sede (${target.branch?.name ?? 'sin sede'})`);
    }
    if (target.id === scanner.id) {
      throw new BadRequestException('No puedes tomarte asistencia a ti mismo');
    }

    // Sede donde se registra: la del target (su sede asignada).
    const branchId = target.branchId ?? scanner.branchId;
    if (!branchId) throw new BadRequestException('Ni tu ni el staff escaneado tienen sede asignada');

    // Duplicado: mismo target + ultimas 5h.
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const recent = await this.prisma.staffCheckIn.findFirst({
      where: { userId: target.id, tenantId, timestamp: { gte: fiveHoursAgo } },
      orderBy: { timestamp: 'desc' },
    });

    const checkIn = await this.prisma.staffCheckIn.create({
      data: {
        userId: target.id,
        branchId,
        scannedById: scanner.id,
        tenantId,
        isDuplicate: !!recent,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
        branch: { select: { id: true, name: true } },
        scannedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Notificacion para el staff escaneado (fire-and-forget).
    void this.prisma.notification.create({
      data: {
        type: 'STAFF_CHECKIN',
        title: 'Asistencia registrada',
        message: `${scanner.firstName} ${scanner.lastName} registro tu asistencia en ${checkIn.branch.name}`,
        userId: target.id,
        tenantId,
        payload: { checkInId: checkIn.id, branchId, scannerId: scanner.id },
      },
    }).catch(() => { /* silencioso */ });

    return checkIn;
  }

  /**
   * Lista de check-ins de staff para el panel admin / recepcion.
   * - userId opcional (filtrar por staff especifico).
   * - branchId opcional (filtrar por sede).
   * - from/to opcional (rango fechas, ISO yyyy-mm-dd).
   */
  async list(tenantId: string, scannerRole: string, scannerBranchId: string | null, opts: { page?: number; limit?: number; userId?: string; branchId?: string; from?: string; to?: string }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 100) : 20;

    const where: Record<string, unknown> = { tenantId };
    if (opts.userId) where.userId = opts.userId;
    if (opts.branchId) {
      where.branchId = opts.branchId;
    } else if (scannerRole !== 'ADMIN' && scannerBranchId) {
      // Recep/Trainer SOLO ven los de su sede.
      where.branchId = scannerBranchId;
    }
    if (opts.from || opts.to) {
      const ts: Record<string, Date> = {};
      if (opts.from) ts.gte = new Date(opts.from + 'T00:00:00');
      if (opts.to) ts.lte = new Date(opts.to + 'T23:59:59.999');
      where.timestamp = ts;
    }

    const [items, total] = await Promise.all([
      this.prisma.staffCheckIn.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
          branch: { select: { id: true, name: true } },
          scannedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.staffCheckIn.count({ where }),
    ]);

    return { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /** Asistencias de hoy del staff logueado (para mostrar en su perfil/dashboard). */
  async myToday(userId: string, tenantId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    return this.prisma.staffCheckIn.findMany({
      where: { userId, tenantId, timestamp: { gte: today, lt: tomorrow } },
      include: {
        branch: { select: { id: true, name: true } },
        scannedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
