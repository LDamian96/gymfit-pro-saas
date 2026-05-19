import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { isAdminRole, getScopedBranchId } from '../../common/scope/branch-scope';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  // Calcular fecha fin según tipo de membresía
  private getMembershipEnd(type: string, start: Date): Date {
    const end = new Date(start);
    switch (type) {
      case 'MONTHLY':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'QUARTERLY':
        end.setMonth(end.getMonth() + 3);
        break;
      case 'ANNUAL':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }
    return end;
  }

  async create(dto: CreateMemberDto, tenantId: string, createdById?: string, role?: string) {
    // Permiso por rol: ADMIN siempre; RECEP/TRAINER según setting del tenant.
    if (role) {
      const roles = role.split(',').map((r) => r.trim());
      if (!roles.includes('ADMIN')) {
        const settings = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { trainerMembershipEnabled: true, receptionistMembershipEnabled: true },
        });
        const allowed =
          (roles.includes('RECEPTIONIST') && !!settings?.receptionistMembershipEnabled) ||
          (roles.includes('TRAINER') && !!settings?.trainerMembershipEnabled);
        if (!allowed) {
          throw new ForbiddenException('No tienes permiso para matricular miembros');
        }
      }
    }

    // Verificar email duplicado en el mismo tenant
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Ya existe un miembro con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const now = new Date();
    const membershipEnd = this.getMembershipEnd(dto.membershipType, now);
    const qrCode = `GYM-${randomUUID().substring(0, 8).toUpperCase()}`;

    // Frecuencia → weeklyVisitLimit. DAILY=7, INTERDAILY=3, CUSTOM=lo que mande,
    // UNLIMITED/undefined = null (sin límite).
    const freq = dto.membershipFrequency;
    let weeklyVisitLimit: number | null = null;
    if (freq === 'DAILY') weeklyVisitLimit = 7;
    else if (freq === 'INTERDAILY') weeklyVisitLimit = 3;
    else if (freq === 'CUSTOM') weeklyVisitLimit = dto.weeklyVisitLimit ?? null;

    // Crear User + Member en transacción
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: 'CLIENT',
          tenantId,
        },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          tenantId,
          qrCode,
          membershipType: dto.membershipType,
          membershipStart: now,
          membershipEnd,
          weeklyVisitLimit,
          membershipFrequency: freq ?? null,
          branchId: dto.branchId,
          createdById,
        },
      });

      return { user, member };
    });

    return this.formatMember(result.user, result.member);
  }

  /**
   * Matricula/renueva un plan al miembro. Vincula fechas y frecuencia AUTOMÁTICO
   * desde el Plan elegido: membershipStart=hoy, membershipEnd=hoy+duración meses,
   * weeklyVisitLimit y membershipFrequency copiados del plan.
   * Si la membresía sigue vigente, extiende desde la fecha de fin actual.
   */
  async activatePlan(memberId: string, planId: string, tenantId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, tenantId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const plan = await this.prisma.plan.findFirst({ where: { id: planId, tenantId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const now = new Date();
    // Si la membresía actual sigue vigente, encadenar desde su fin (renovación).
    const base = member.membershipEnd && member.membershipEnd > now ? new Date(member.membershipEnd) : now;
    const end = new Date(base);
    end.setMonth(end.getMonth() + plan.duration);

    // Tipo legacy a partir de la duración del plan.
    const type =
      plan.duration >= 12 ? 'ANNUAL' : plan.duration >= 3 ? 'QUARTERLY' : 'MONTHLY';

    const updated = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        membershipType: type,
        membershipStart: member.membershipEnd && member.membershipEnd > now ? member.membershipStart : now,
        membershipEnd: end,
        weeklyVisitLimit: plan.weeklyVisitLimit ?? null,
        membershipFrequency: plan.frequency ?? null,
        isActive: true,
      },
      include: { user: true },
    });
    return this.formatMember(updated.user, updated);
  }

  async findAll(tenantId: string, query: QueryMemberDto, currentUserId?: string, role?: string) {
    const { page = 1, limit = 10, search, status, branchId } = query;
    const skip = (page - 1) * limit;

    // Construir filtro de búsqueda
    const where: Record<string, unknown> = { tenantId };
    const now = new Date();

    // Admin ve todo el tenant pero puede filtrar por branchId. Recep/Trainer
    // está siempre forzado a su sucursal y el query branchId es ignorado.
    if (currentUserId && role && !isAdminRole(role)) {
      where.branchId = await getScopedBranchId(this.prisma, currentUserId, role);
    } else if (branchId) {
      where.branchId = branchId;
    }

    // Estados basados en la fecha de vencimiento:
    // - active: aún vigente (incluye los que están "por expirar")
    // - expiring: vigente pero le quedan ≤ 14 días
    // - inactive: ya venció (membershipEnd < hoy)
    if (status === 'active') {
      where.isActive = true;
      where.membershipEnd = { gte: now };
    } else if (status === 'expiring') {
      const twoWeeks = new Date(now);
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      where.isActive = true;
      where.membershipEnd = { gte: now, lte: twoWeeks };
    } else if (status === 'inactive') {
      where.membershipEnd = { lt: now };
    }

    // Búsqueda por nombre o email del usuario
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
        deletedAt: null,
      };
    } else {
      where.user = { deletedAt: null };
    }

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        include: { user: true, branch: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data: members.map((m) => this.formatMember(m.user, m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, tenantId },
      include: { user: true, branch: { select: { id: true, name: true } } },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }

    return this.formatMember(member.user, member);
  }

  async update(id: string, dto: UpdateMemberDto, tenantId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, tenantId },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }

    // Actualizar User y Member
    await this.prisma.$transaction(async (tx) => {
      // Actualizar datos del usuario
      const userData: Record<string, unknown> = {};
      if (dto.firstName) userData.firstName = dto.firstName;
      if (dto.lastName) userData.lastName = dto.lastName;
      if (dto.phone !== undefined) userData.phone = dto.phone;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: member.userId },
          data: userData,
        });
      }

      // Actualizar datos del miembro
      const memberData: Record<string, unknown> = {};
      if (dto.emergencyContact !== undefined) memberData.emergencyContact = dto.emergencyContact;
      if (dto.emergencyPhone !== undefined) memberData.emergencyPhone = dto.emergencyPhone;
      if (dto.isActive !== undefined) memberData.isActive = dto.isActive;
      if (dto.branchId !== undefined) memberData.branchId = dto.branchId || null;
      if (dto.weeklyVisitLimit !== undefined) {
        memberData.weeklyVisitLimit = dto.weeklyVisitLimit && dto.weeklyVisitLimit > 0 ? dto.weeklyVisitLimit : null;
      }
      if (dto.membershipType) {
        memberData.membershipType = dto.membershipType;
        memberData.membershipStart = new Date();
        memberData.membershipEnd = this.getMembershipEnd(
          dto.membershipType,
          new Date(),
        );
      }

      if (Object.keys(memberData).length > 0) {
        await tx.member.update({
          where: { id },
          data: memberData,
        });
      }
    });

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }

    // Soft delete del usuario
    await this.prisma.user.update({
      where: { id: member.userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    // Desactivar miembro
    await this.prisma.member.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  }

  // Formato estándar de respuesta
  private formatMember(user: Record<string, unknown>, member: Record<string, unknown>) {
    return {
      id: member.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      qrCode: member.qrCode,
      membershipType: member.membershipType,
      membershipStart: member.membershipStart,
      membershipEnd: member.membershipEnd,
      isActive: member.isActive,
      emergencyContact: member.emergencyContact,
      emergencyPhone: member.emergencyPhone,
      branchId: member.branchId ?? null,
      branch: member.branch ?? null,
      weeklyVisitLimit: member.weeklyVisitLimit ?? null,
      createdAt: member.createdAt,
    };
  }
}
