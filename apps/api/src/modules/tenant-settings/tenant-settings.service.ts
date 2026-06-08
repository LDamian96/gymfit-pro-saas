import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdatePosSettingsDto {
  trainerPosEnabled?: boolean;
  receptionistPosEnabled?: boolean;
  trainerMembershipEnabled?: boolean;
  receptionistMembershipEnabled?: boolean;
}

export interface UpdateSeoSettingsDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
  district?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  whatsappNumber?: string;
  googleMapsUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  openingHours?: Record<string, { open: string; close: string } | null>;
}

// Campos que devuelve getSettings + getSeoSettings (compartido en types)
const SEO_SELECT = {
  id: true, name: true, slug: true, logo: true, phone: true, email: true, address: true,
  district: true, city: true, region: true, country: true,
  latitude: true, longitude: true,
  instagramUrl: true, facebookUrl: true, tiktokUrl: true, whatsappNumber: true, googleMapsUrl: true,
  seoTitle: true, seoDescription: true, seoKeywords: true, openingHours: true,
} as const;

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

  async getSeoSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: SEO_SELECT,
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async updateSeoSettings(tenantId: string, data: UpdateSeoSettingsDto) {
    // Solo campos definidos. Empty string = limpiar (null).
    const clean = (v: string | undefined): string | null | undefined =>
      v === undefined ? undefined : v.trim() === '' ? null : v.trim();

    const patch: Record<string, unknown> = {};
    const stringFields: (keyof UpdateSeoSettingsDto)[] = [
      'name', 'phone', 'email', 'address', 'logo',
      'district', 'city', 'region', 'country',
      'instagramUrl', 'facebookUrl', 'tiktokUrl', 'whatsappNumber', 'googleMapsUrl',
      'seoTitle', 'seoDescription', 'seoKeywords',
    ];
    for (const f of stringFields) {
      const c = clean(data[f] as string | undefined);
      if (c !== undefined) patch[f] = c;
    }
    if (data.latitude !== undefined) patch.latitude = data.latitude;
    if (data.longitude !== undefined) patch.longitude = data.longitude;
    if (data.openingHours !== undefined) patch.openingHours = data.openingHours;

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: patch,
      select: SEO_SELECT,
    });
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
