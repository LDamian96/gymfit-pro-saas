import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateProductDto {
  name: string;
  brand?: string | null;
  description?: string;
  imageUrl?: string;
  category?: string;
  publicPrice: number;
  memberPrice?: number | null;
  stock?: number | null;
  isActive?: boolean;
  order?: number;
}

export interface UpdateProductDto {
  name?: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  publicPrice?: number;
  memberPrice?: number | null;
  stock?: number | null;
  isActive?: boolean;
  order?: number;
}

export interface PublicQuery {
  brand?: string;
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, options?: { onlyActive?: boolean; category?: string; brand?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (options?.onlyActive) where.isActive = true;
    if (options?.category) where.category = options.category;
    if (options?.brand) where.brand = options.brand;

    return this.prisma.product.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // Listado público con filtros y paginación
  async findPublicBySlug(slug: string, query: PublicQuery = {}) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return { items: [], total: 0, page: 1, totalPages: 0, brands: [], categories: [] };

    const where: Record<string, unknown> = { tenantId: tenant.id, isActive: true };
    if (query.brand) where.brand = query.brand;
    if (query.category) where.category = query.category;
    if (query.q && query.q.trim().length > 0) {
      where.OR = [
        { name: { contains: query.q.trim(), mode: 'insensitive' } },
        { brand: { contains: query.q.trim(), mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const [items, total, brandsAgg, categoriesAgg] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          brand: true,
          description: true,
          imageUrl: true,
          category: true,
          publicPrice: true,
          memberPrice: true,
        },
      }),
      this.prisma.product.count({ where }),
      this.prisma.product.groupBy({
        by: ['brand'],
        where: { tenantId: tenant.id, isActive: true, brand: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.product.groupBy({
        by: ['category'],
        where: { tenantId: tenant.id, isActive: true, category: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const brands = brandsAgg
      .filter((b) => b.brand)
      .map((b) => ({ name: b.brand!, count: b._count._all }))
      .sort((a, b) => b.count - a.count);
    const categories = categoriesAgg
      .filter((c) => c.category)
      .map((c) => ({ name: c.category!, count: c._count._all }))
      .sort((a, b) => b.count - a.count);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      brands,
      categories,
    };
  }

  async create(data: CreateProductDto, tenantId: string) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand ?? null,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        category: data.category ?? null,
        publicPrice: data.publicPrice,
        memberPrice: data.memberPrice ?? null,
        stock: data.stock ?? null,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        tenantId,
      },
    });
  }

  async update(id: string, data: UpdateProductDto, tenantId: string) {
    const found = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    const found = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Producto no encontrado');
    await this.prisma.product.delete({ where: { id } });
    return null;
  }
}
