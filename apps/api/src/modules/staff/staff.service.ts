import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStaffDto, tenantId: string) {
    // Verificar email duplicado en el mismo tenant
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        branchId: dto.branchId,
        tenantId,
      },
    });

    return this.formatStaff(user);
  }

  async findAll(tenantId: string, query: QueryStaffDto) {
    const { page = 1, limit = 10, search, role, branchId } = query;
    const skip = (page - 1) * limit;

    // Filtrar solo staff (RECEPTIONIST y TRAINER)
    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
      role: role ? role : { in: ['RECEPTIONIST', 'TRAINER'] },
    };

    // Filtro por sucursal (selector del panel admin)
    if (branchId) where.branchId = branchId;

    // Busqueda por nombre o email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [staff, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { branch: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: staff.map((s) => this.formatStaff(s)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        role: { in: ['RECEPTIONIST', 'TRAINER'] },
      },
      include: { branch: true },
    });

    if (!user) {
      throw new NotFoundException('Staff no encontrado');
    }

    return this.formatStaff(user);
  }

  async update(id: string, dto: UpdateStaffDto, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        role: { in: ['RECEPTIONIST', 'TRAINER'] },
      },
    });

    if (!user) {
      throw new NotFoundException('Staff no encontrado');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.role) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.branchId !== undefined) updateData.branchId = dto.branchId;

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        role: { in: ['RECEPTIONIST', 'TRAINER'] },
      },
    });

    if (!user) {
      throw new NotFoundException('Staff no encontrado');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return null;
  }

  // Formato estandar de respuesta
  private formatStaff(user: Record<string, unknown>) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      branchId: user.branchId,
      createdAt: user.createdAt,
    };
  }
}
