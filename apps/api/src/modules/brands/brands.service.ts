import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateBrandDto {
  name: string;
  slug?: string;
  logoUrl?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateBrandDto {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  isActive?: boolean;
  order?: number;
}

// Genera un slug url-safe a partir de un texto cualquiera
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    // Devuelve _count.products para que el admin vea cuántos productos están
    // asociados a cada marca.
    return this.prisma.brand.findMany({
      where: { tenantId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  // Listado público para el landing — solo activas, con conteo de productos visibles
  async findPublicBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return { items: [] };

    const brands = await this.prisma.brand.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        order: true,
        _count: {
          select: {
            products: {
              where: { isActive: true, showInLanding: true },
            },
          },
        },
      },
    });

    return {
      items: brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        order: b.order,
        productsCount: b._count.products,
      })),
    };
  }

  async create(data: CreateBrandDto, tenantId: string) {
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('El nombre es requerido');
    }
    const slug = data.slug && data.slug.trim().length > 0 ? slugify(data.slug) : slugify(data.name);
    if (!slug) throw new BadRequestException('No se pudo generar slug a partir del nombre');

    // Validar slug único por tenant
    const existing = await this.prisma.brand.findFirst({
      where: { tenantId, slug },
    });
    if (existing) throw new BadRequestException('Ya existe una marca con ese slug');

    return this.prisma.brand.create({
      data: {
        name: data.name.trim(),
        slug,
        logoUrl: data.logoUrl ?? null,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        tenantId,
      },
    });
  }

  async update(id: string, data: UpdateBrandDto, tenantId: string) {
    const found = await this.prisma.brand.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Marca no encontrada');

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.slug !== undefined) {
      const next = slugify(data.slug);
      if (!next) throw new BadRequestException('Slug inválido');
      // Validar único por tenant si cambió
      if (next !== found.slug) {
        const dup = await this.prisma.brand.findFirst({ where: { tenantId, slug: next } });
        if (dup) throw new BadRequestException('Ya existe una marca con ese slug');
      }
      patch.slug = next;
    }
    if (data.logoUrl !== undefined) patch.logoUrl = data.logoUrl;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.order !== undefined) patch.order = data.order;

    return this.prisma.brand.update({ where: { id }, data: patch });
  }

  async remove(id: string, tenantId: string) {
    const found = await this.prisma.brand.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Marca no encontrada');
    // Productos asociados quedan con brandId=null por SetNull en schema
    await this.prisma.brand.delete({ where: { id } });
    return null;
  }
}
