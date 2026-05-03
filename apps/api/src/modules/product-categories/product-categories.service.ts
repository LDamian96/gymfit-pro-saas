import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateProductCategoryDto {
  name: string;
  slug?: string;
  iconName?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateProductCategoryDto {
  name?: string;
  slug?: string;
  iconName?: string | null;
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
export class ProductCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    // Devuelve _count.products para que el admin vea cuántos productos están
    // asociados a cada categoría.
    return this.prisma.productCategory.findMany({
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

    const categories = await this.prisma.productCategory.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        iconName: true,
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
      items: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        iconName: c.iconName,
        order: c.order,
        productsCount: c._count.products,
      })),
    };
  }

  async create(data: CreateProductCategoryDto, tenantId: string) {
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('El nombre es requerido');
    }
    const slug = data.slug && data.slug.trim().length > 0 ? slugify(data.slug) : slugify(data.name);
    if (!slug) throw new BadRequestException('No se pudo generar slug a partir del nombre');

    // Validar slug único por tenant
    const existing = await this.prisma.productCategory.findFirst({
      where: { tenantId, slug },
    });
    if (existing) throw new BadRequestException('Ya existe una categoría con ese slug');

    return this.prisma.productCategory.create({
      data: {
        name: data.name.trim(),
        slug,
        iconName: data.iconName ?? null,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        tenantId,
      },
    });
  }

  async update(id: string, data: UpdateProductCategoryDto, tenantId: string) {
    const found = await this.prisma.productCategory.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Categoría no encontrada');

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.slug !== undefined) {
      const next = slugify(data.slug);
      if (!next) throw new BadRequestException('Slug inválido');
      if (next !== found.slug) {
        const dup = await this.prisma.productCategory.findFirst({
          where: { tenantId, slug: next },
        });
        if (dup) throw new BadRequestException('Ya existe una categoría con ese slug');
      }
      patch.slug = next;
    }
    if (data.iconName !== undefined) patch.iconName = data.iconName;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.order !== undefined) patch.order = data.order;

    return this.prisma.productCategory.update({ where: { id }, data: patch });
  }

  async remove(id: string, tenantId: string) {
    const found = await this.prisma.productCategory.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Categoría no encontrada');
    // Productos asociados quedan con categoryId=null por SetNull en schema
    await this.prisma.productCategory.delete({ where: { id } });
    return null;
  }
}
