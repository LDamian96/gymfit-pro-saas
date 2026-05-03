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

    return {
      success: true,
      data: {
        ...checkIn,
        crossBranch: isCrossBranch,
        homeBranch: isCrossBranch && member.branch
          ? { id: member.branch.id, name: member.branch.name }
          : null,
      },
      message: isDuplicate
        ? 'Check-in duplicado detectado (menos de 5 minutos)'
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

    const checkIns = await this.prisma.checkIn.findMany({
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

    return { success: true, data: checkIns };
  }
}
