import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdatePosSettingsDto {
  trainerPosEnabled?: boolean;
  receptionistPosEnabled?: boolean;
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
      },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async updatePosSettings(tenantId: string, data: UpdatePosSettingsDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        trainerPosEnabled: data.trainerPosEnabled,
        receptionistPosEnabled: data.receptionistPosEnabled,
      },
      select: {
        trainerPosEnabled: true,
        receptionistPosEnabled: true,
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
}
