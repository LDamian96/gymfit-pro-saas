import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateLandingDto } from './dto/update-landing.dto';
import { CreateLandingServiceDto } from './dto/create-service.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateFacilityDto } from './dto/create-facility.dto';

@Injectable()
export class LandingService {
  constructor(private prisma: PrismaService) {}

  // ========================
  // CONTENIDO LANDING (admin)
  // ========================
  async getLandingContent(tenantId: string) {
    return this.prisma.landingContent.findMany({
      where: { tenantId, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async updateLandingContent(tenantId: string, dto: UpdateLandingDto) {
    // Upsert: crear o actualizar contenido por sección+página
    return this.prisma.landingContent.upsert({
      where: {
        id: `${tenantId}-${dto.page}-${dto.section}`, // No funciona así, usamos findFirst
      },
      update: { content: dto.content as object },
      create: {
        tenantId,
        section: dto.section || '',
        page: dto.page || '',
        content: dto.content as object,
      },
    });
  }

  // ========================
  // SERVICIOS
  // ========================
  async getServices(tenantId: string) {
    return this.prisma.landingService.findMany({
      where: { tenantId, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async createService(dto: CreateLandingServiceDto, tenantId: string) {
    return this.prisma.landingService.create({
      data: { ...dto, tenantId },
    });
  }

  async updateService(id: string, dto: Partial<CreateLandingServiceDto>, tenantId: string) {
    const svc = await this.prisma.landingService.findFirst({ where: { id, tenantId } });
    if (!svc) throw new NotFoundException('Servicio no encontrado');
    return this.prisma.landingService.update({ where: { id }, data: dto });
  }

  async deleteService(id: string, tenantId: string) {
    const svc = await this.prisma.landingService.findFirst({ where: { id, tenantId } });
    if (!svc) throw new NotFoundException('Servicio no encontrado');
    await this.prisma.landingService.update({ where: { id }, data: { isActive: false } });
    return null;
  }

  // ========================
  // PLANES
  // ========================
  async getPlans(tenantId: string) {
    return this.prisma.plan.findMany({
      where: { tenantId, isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  // Normaliza frecuencia → weeklyVisitLimit coherente.
  // DAILY=7, INTERDAILY=3, UNLIMITED=null, CUSTOM=lo que mande (1-7).
  private normalizeFrequency(dto: Partial<CreatePlanDto>): Partial<CreatePlanDto> {
    if (!dto.frequency) return dto;
    const out = { ...dto };
    if (dto.frequency === 'DAILY') out.weeklyVisitLimit = 7;
    else if (dto.frequency === 'INTERDAILY') out.weeklyVisitLimit = 3;
    else if (dto.frequency === 'UNLIMITED') out.weeklyVisitLimit = undefined;
    // CUSTOM conserva dto.weeklyVisitLimit
    return out;
  }

  async createPlan(dto: CreatePlanDto, tenantId: string) {
    const data = this.normalizeFrequency(dto);
    return this.prisma.plan.create({
      data: { ...data, tenantId } as CreatePlanDto & { tenantId: string },
    });
  }

  async updatePlan(id: string, dto: Partial<CreatePlanDto>, tenantId: string) {
    const plan = await this.prisma.plan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return this.prisma.plan.update({ where: { id }, data: this.normalizeFrequency(dto) });
  }

  async deletePlan(id: string, tenantId: string) {
    const plan = await this.prisma.plan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    await this.prisma.plan.update({ where: { id }, data: { isActive: false } });
    return null;
  }

  // ========================
  // INSTALACIONES
  // ========================
  async getFacilities(tenantId: string) {
    return this.prisma.facility.findMany({
      where: { tenantId, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async createFacility(dto: CreateFacilityDto, tenantId: string) {
    return this.prisma.facility.create({
      data: { ...dto, tenantId },
    });
  }

  async updateFacility(id: string, dto: Partial<CreateFacilityDto>, tenantId: string) {
    const fac = await this.prisma.facility.findFirst({ where: { id, tenantId } });
    if (!fac) throw new NotFoundException('Instalación no encontrada');
    return this.prisma.facility.update({ where: { id }, data: dto });
  }

  async deleteFacility(id: string, tenantId: string) {
    const fac = await this.prisma.facility.findFirst({ where: { id, tenantId } });
    if (!fac) throw new NotFoundException('Instalación no encontrada');
    await this.prisma.facility.update({ where: { id }, data: { isActive: false } });
    return null;
  }

  // ========================
  // PÚBLICO (sin auth, por slug)
  // ========================
  async getPublicLanding(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !tenant.isActive) throw new NotFoundException('Gimnasio no encontrado');

    const [content, services, plans, facilities, classes, faqs, amenities] = await Promise.all([
      this.prisma.landingContent.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { order: 'asc' } }),
      this.prisma.landingService.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { order: 'asc' } }),
      this.prisma.plan.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { price: 'asc' } }),
      this.prisma.facility.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { order: 'asc' } }),
      this.prisma.class.findMany({
        where: { tenantId: tenant.id, isActive: true },
        include: { instructor: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.fAQ.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { order: 'asc' } }),
      this.prisma.amenity.findMany({ where: { tenantId: tenant.id, isActive: true } }),
    ]);

    return {
      tenant: { name: tenant.name, slug: tenant.slug, logo: tenant.logo, phone: tenant.phone, email: tenant.email, address: tenant.address },
      content,
      services,
      plans,
      facilities,
      classes,
      faqs,
      amenities,
    };
  }
}
