import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { TransferStaffDto } from './dto/transfer-staff.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBranchDto, tenantId: string) {
    return this.prisma.branch.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      include: { _count: { select: { users: true, checkIns: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId },
      include: {
        users: { where: { deletedAt: null }, select: { id: true, firstName: true, lastName: true, role: true } },
        _count: { select: { checkIns: true } },
      },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.branch.update({ where: { id }, data: { isActive: false } });
    return null;
  }

  async transferStaff(dto: TransferStaffDto, tenantId: string) {
    // Verificar que el staff y la sucursal pertenecen al tenant
    const staff = await this.prisma.user.findFirst({
      where: { id: dto.staffId, tenantId, deletedAt: null },
    });
    if (!staff) throw new NotFoundException('Personal no encontrado');

    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.toBranchId, tenantId },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    await this.prisma.user.update({
      where: { id: dto.staffId },
      data: { branchId: dto.toBranchId },
    });

    return { message: `${staff.firstName} ${staff.lastName} transferido a ${branch.name}` };
  }
}
