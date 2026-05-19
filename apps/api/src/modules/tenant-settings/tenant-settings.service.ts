import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdatePosSettingsDto {
  trainerPosEnabled?: boolean;
  receptionistPosEnabled?: boolean;
  trainerMembershipEnabled?: boolean;
  receptionistMembershipEnabled?: boolean;
}

@Injectable()
export class TenantSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        trainerPosEnabled: true,
        receptionistPosEnabled: true,
        trainerMembershipEnabled: true,
        receptionistMembershipEnabled: true,
      },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async updatePosSettings(tenantId: string, data: UpdatePosSettingsDto) {
    // Solo actualizar los campos que vienen definidos (undefined = no tocar).
    const patch: Record<string, boolean> = {};
    if (data.trainerPosEnabled !== undefined) patch.trainerPosEnabled = data.trainerPosEnabled;
    if (data.receptionistPosEnabled !== undefined) patch.receptionistPosEnabled = data.receptionistPosEnabled;
    if (data.trainerMembershipEnabled !== undefined) patch.trainerMembershipEnabled = data.trainerMembershipEnabled;
    if (data.receptionistMembershipEnabled !== undefined) patch.receptionistMembershipEnabled = data.receptionistMembershipEnabled;

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: patch,
      select: {
        trainerPosEnabled: true,
        receptionistPosEnabled: true,
        trainerMembershipEnabled: true,
        receptionistMembershipEnabled: true,
      },
    });
  }

  // Verifica si un rol puede vender — usado por SalesService
  async canRoleSell(tenantId: string, role: string): Promise<boolean> {
    const roles = role.split(',').map((r) => r.trim());
    if (roles.includes('ADMIN')) return true;
    const settings = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { trainerPosEnabled: true, receptionistPosEnabled: true },
    });
    if (!settings) return false;
    if (roles.includes('TRAINER')) return settings.trainerPosEnabled;
    if (roles.includes('RECEPTIONIST')) return settings.receptionistPosEnabled;
    return false;
  }

  // Verifica si un rol puede gestionar membresías (matricular/cobrar).
  async canRoleManageMembership(tenantId: string, role: string): Promise<boolean> {
    const roles = role.split(',').map((r) => r.trim());
    if (roles.includes('ADMIN')) return true;
    const settings = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { trainerMembershipEnabled: true, receptionistMembershipEnabled: true },
    });
    if (!settings) return false;
    if (roles.includes('TRAINER')) return settings.trainerMembershipEnabled;
    if (roles.includes('RECEPTIONIST')) return settings.receptionistMembershipEnabled;
    return false;
  }
}
