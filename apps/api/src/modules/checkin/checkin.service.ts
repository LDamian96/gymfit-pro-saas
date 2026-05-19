import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { isAdminRole, getScopedBranchId } from '../../common/scope/branch-scope';

@Injectable()
export class CheckinService {
  constructor(private prisma: PrismaService) {}

  /**
   * Escanea el código QR de un miembro y registra el check-in.
   * Valida membresía activa, no expirada, y detecta duplicados (5 min).
   */
  /**
   * Calcula el inicio (lunes 00:00) y fin (domingo 23:59:59.999) de la semana actual
   * para contar visitas dentro del rango. Usa lunes como inicio (estándar ISO).
   */
  private getWeekRange(now: Date): { start: Date; end: Date } {
    const d = new Date(now);
    const day = d.getDay(); // 0=dom, 1=lun, ..., 6=sáb
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Último check-in del usuario actual (CLIENT). Usado por el toaster de bienvenida.
   */
  async findMyLast(tenantId: string, currentUserId: string) {
    const member = await this.prisma.member.findFirst({
      where: { tenantId, userId: currentUserId },
      select: { id: true },
    });
    if (!member) return null;
    return this.prisma.checkIn.findFirst({
      where: { memberId: member.id, tenantId },
      orderBy: { timestamp: 'desc' },
      include: { branch: { select: { id: true, name: true } } },
    });
  }

  /**
   * Lista los check-ins de un miembro. CLIENT solo puede ver los suyos;
   * staff/admin del mismo tenant ven cualquier miembro.
   */
  async findByMember(memberId: string, tenantId: string, currentUserId: string, role: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
      select: { id: true, userId: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    // Si el rol es CLIENT, solo puede leer las suyas.
    const userRoles = (role || '').split(',').map((r) => r.trim());
    if (userRoles.includes('CLIENT') && !userRoles.some((r) => ['ADMIN', 'TRAINER', 'RECEPTIONIST'].includes(r))) {
      if (member.userId !== currentUserId) {
        throw new NotFoundException('Miembro no encontrado');
      }
    }

    return this.prisma.checkIn.findMany({
      where: { memberId, tenantId },
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async scanQr(dto: CreateCheckinDto, scannedById: string, tenantId: string) {
    // Buscar miembro por qrCode y tenantId, incluyendo su sucursal "home" para
    // detectar cross-branch scan (cliente entrando a una sucursal distinta a la suya).
    const member = await this.prisma.member.findFirst({
      where: { qrCode: dto.qrCode, tenantId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado con ese código QR');
    }

    if (!member.isActive) {
      throw new BadRequestException('La membresía del miembro no está activa');
    }

    const now = new Date();
    if (member.membershipEnd < now) {
      throw new BadRequestException('La membresía del miembro ha expirado');
    }

    // Verificar duplicado: mismo miembro en los últimos 5 minutos
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentCheckIn = await this.prisma.checkIn.findFirst({
      where: {
        memberId: member.id,
        tenantId,
        timestamp: { gte: fiveMinutesAgo },
      },
    });
    const isDuplicate = !!recentCheckIn;

    // Límite semanal de visitas: contar visitas DISTINTAS por día de esta semana.
    // El "duplicado" del mismo día no cuenta dos veces. El cliente sigue pasando
    // (no bloqueamos), pero al admin/recepción se le avisa con flag overLimit.
    let overLimit = false;
    let weeklyVisits = 0;
    if (member.weeklyVisitLimit && member.weeklyVisitLimit > 0) {
      const { start, end } = this.getWeekRange(now);
      const weekCheckIns = await this.prisma.checkIn.findMany({
        where: { memberId: member.id, tenantId, timestamp: { gte: start, lte: end } },
        select: { timestamp: true },
      });
      // Contar días únicos. Si hoy aún no está en el set y no es duplicado, sumar 1.
      const days = new Set(weekCheckIns.map((c) => new Date(c.timestamp).toDateString()));
      const todayStr = now.toDateString();
      if (!days.has(todayStr) && !isDuplicate) days.add(todayStr);
      weeklyVisits = days.size;
      overLimit = weeklyVisits > member.weeklyVisitLimit;
    }

    // Cross-branch: el cliente tiene una sucursal home y se está escaneando en otra.
    // Si no tiene sucursal asignada se considera "sin home" y no dispara la alerta.
    const isCrossBranch = !!member.branchId && member.branchId !== dto.branchId;

    // Sucursal donde se escaneó (para mostrar en notificación y respuesta).
    const scanBranch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
      select: { id: true, name: true },
    });

    const checkIn = await this.prisma.checkIn.create({
      data: {
        memberId: member.id,
        branchId: dto.branchId,
        scannedById,
        tenantId,
        isDuplicate,
      },
      include: {
        member: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    // Notificación al admin: cada check-in normal (no duplicado) genera una notif
    // "Asistencia de X" para que el admin vea el flujo en tiempo real.
    if (!isDuplicate && !isCrossBranch && !overLimit) {
      await this.prisma.notification.create({
        data: {
          tenantId,
          type: 'MEMBER_CHECKIN',
          title: 'Nueva asistencia',
          message: `Asistencia de ${member.user.firstName} ${member.user.lastName}${scanBranch ? ` en ${scanBranch.name}` : ''}`,
          payload: {
            memberId: member.id,
            memberName: `${member.user.firstName} ${member.user.lastName}`,
            branch: scanBranch ? { id: scanBranch.id, name: scanBranch.name } : null,
            checkInId: checkIn.id,
            timestamp: checkIn.timestamp,
          },
        },
      });
    }

    // Notificación al admin si fue cross-branch (no se notifica el caso normal).
    if (isCrossBranch && member.branch && scanBranch) {
      await this.prisma.notification.create({
        data: {
          tenantId,
          type: 'CROSS_BRANCH_CHECKIN',
          title: 'Check-in cruzado entre sucursales',
          message: `${member.user.firstName} ${member.user.lastName} (sucursal ${member.branch.name}) ingresó a ${scanBranch.name}`,
          payload: {
            memberId: member.id,
            memberName: `${member.user.firstName} ${member.user.lastName}`,
            homeBranch: { id: member.branch.id, name: member.branch.name },
            scanBranch: { id: scanBranch.id, name: scanBranch.name },
            checkInId: checkIn.id,
            timestamp: checkIn.timestamp,
          },
        },
      });
    }

    // Notificación al admin si excede su plan semanal.
    if (overLimit && member.weeklyVisitLimit) {
      await this.prisma.notification.create({
        data: {
          tenantId,
          type: 'OVER_WEEKLY_LIMIT',
          title: 'Cliente excedió su plan semanal',
          message: `${member.user.firstName} ${member.user.lastName} ingresó (${weeklyVisits}/${member.weeklyVisitLimit} días esta semana)`,
          payload: {
            memberId: member.id,
            memberName: `${member.user.firstName} ${member.user.lastName}`,
            weeklyVisits,
            weeklyVisitLimit: member.weeklyVisitLimit,
            checkInId: checkIn.id,
          },
        },
      });
    }

    return {
      ...checkIn,
      crossBranch: isCrossBranch,
      homeBranch: isCrossBranch && member.branch
        ? { id: member.branch.id, name: member.branch.name }
        : null,
      overLimit,
      weeklyVisits,
      weeklyVisitLimit: member.weeklyVisitLimit ?? null,
      message: isDuplicate
        ? 'Check-in duplicado detectado (menos de 5 minutos)'
        : overLimit && member.weeklyVisitLimit
          ? `Excedió el plan: ${weeklyVisits} días en la semana, máximo ${member.weeklyVisitLimit}`
          : isCrossBranch && member.branch
            ? `Atención: este cliente pertenece a ${member.branch.name}`
            : 'Check-in registrado exitosamente',
    };
  }

  /**
   * Obtiene todos los check-ins del día de hoy. Admin ve los de todas las sucursales
   * y puede filtrar por una específica; recepción ve solo los de la suya.
   */
  async getTodayCheckIns(tenantId: string, currentUserId: string, role: string, branchIdFilter?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Record<string, unknown> = {
      tenantId,
      timestamp: { gte: today, lt: tomorrow },
    };
    if (!isAdminRole(role)) {
      where.branchId = await getScopedBranchId(this.prisma, currentUserId, role);
    } else if (branchIdFilter) {
      where.branchId = branchIdFilter;
    }

    return this.prisma.checkIn.findMany({
      where,
      include: {
        member: {
          include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
        },
        scannedBy: { select: { firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
