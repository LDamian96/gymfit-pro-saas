import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface StockByBranch {
  branchId: string;
  stock: number;
}

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
  // Stock por sucursal. Si no se manda, se crean filas en 0 para todas las sedes activas.
  stocks?: StockByBranch[];
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
  stocks?: StockByBranch[];
}

export interface PublicQuery {
  brand?: string;
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}

interface ProductStockRow {
  branchId: string;
  stock: number;
  branch?: { name: string } | null;
}
export interface ProductWithStocks {
  stock: number | null;
  stocks?: ProductStockRow[];
  [k: string]: unknown;
}
export interface MappedStock {
  branchId: string;
  branchName: string;
  stock: number;
}
export interface MappedProduct {
  stock: number | null;
  stocks: MappedStock[];
  [k: string]: unknown;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Aplana el stock por sede a un campo `stock` efectivo + un array `stocks`.
   * - Si branchId: stock = el de esa sede (0 si no existe fila).
   * - Si no branchId: stock = suma de todas las sedes.
   * Así el frontend que lee `product.stock` sigue funcionando.
   */
  private mapStock(p: ProductWithStocks, branchId?: string): MappedProduct {
    const stocks = (p.stocks ?? []).map((s) => ({
      branchId: s.branchId,
      branchName: s.branch?.name ?? '',
      stock: s.stock,
    }));
    let effective: number | null;
    if (branchId) {
      const row = stocks.find((s) => s.branchId === branchId);
      effective = row ? row.stock : 0;
    } else if (stocks.length > 0) {
      effective = stocks.reduce((acc, s) => acc + s.stock, 0);
    } else {
      effective = p.stock ?? null;
    }
    return { ...p, stock: effective, stocks };
  }

  async findAll(
    tenantId: string,
    options?: { onlyActive?: boolean; category?: string; brand?: string; branchId?: string },
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (options?.onlyActive) where.isActive = true;
    if (options?.category) where.category = options.category;
    if (options?.brand) where.brand = options.brand;

    const products = await this.prisma.product.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { stocks: { include: { branch: { select: { name: true } } } } },
    });
    return products.map((p) => this.mapStock(p as unknown as ProductWithStocks, options?.branchId));
  }

  // Listado público con filtros y paginación (sin stock por sede — landing usa total)
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

  /**
   * Crea producto + filas de stock por sede.
   * Si no se pasa `stocks`, crea una fila en 0 para cada sede activa del tenant.
   */
  async create(data: CreateProductDto, tenantId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
    });

    // Stock por sede: usar lo enviado, o 0 para todas las sedes activas.
    const stockMap = new Map<string, number>();
    for (const b of branches) stockMap.set(b.id, 0);
    if (data.stocks) {
      for (const s of data.stocks) {
        if (stockMap.has(s.branchId)) stockMap.set(s.branchId, Math.max(0, s.stock || 0));
      }
    }
    const totalStock = Array.from(stockMap.values()).reduce((a, b) => a + b, 0);

    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand ?? null,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        category: data.category ?? null,
        publicPrice: data.publicPrice,
        memberPrice: data.memberPrice ?? null,
        stock: totalStock, // legacy/total
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        tenantId,
        stocks: {
          create: Array.from(stockMap.entries()).map(([branchId, stock]) => ({
            branchId,
            stock,
            tenantId,
          })),
        },
      },
      include: { stocks: { include: { branch: { select: { name: true } } } } },
    });
    return this.mapStock(product as unknown as ProductWithStocks);
  }

  async update(id: string, data: UpdateProductDto, tenantId: string) {
    const found = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Producto no encontrado');

    const { stocks, ...rest } = data;

    // Upsert de stock por sede si vino en el payload.
    if (stocks && stocks.length > 0) {
      for (const s of stocks) {
        await this.prisma.productStock.upsert({
          where: { productId_branchId: { productId: id, branchId: s.branchId } },
          create: { productId: id, branchId: s.branchId, stock: Math.max(0, s.stock || 0), tenantId },
          update: { stock: Math.max(0, s.stock || 0) },
        });
      }
      // Recalcular total legacy
      const agg = await this.prisma.productStock.aggregate({
        where: { productId: id },
        _sum: { stock: true },
      });
      (rest as Record<string, unknown>).stock = agg._sum.stock ?? 0;
    }

    await this.prisma.product.update({ where: { id }, data: rest });
    const fresh = await this.prisma.product.findUnique({
      where: { id },
      include: { stocks: { include: { branch: { select: { name: true } } } } },
    });
    return this.mapStock(fresh as unknown as ProductWithStocks);
  }

  /**
   * Transfiere `qty` unidades de un producto de una sede a otra (transacción atómica).
   */
  async transferStock(
    tenantId: string,
    productId: string,
    fromBranchId: string,
    toBranchId: string,
    qty: number,
  ) {
    if (fromBranchId === toBranchId) {
      throw new BadRequestException('La sede origen y destino deben ser distintas');
    }
    if (!qty || qty <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.$transaction(async (tx) => {
      const origin = await tx.productStock.findUnique({
        where: { productId_branchId: { productId, branchId: fromBranchId } },
      });
      if (!origin || origin.stock < qty) {
        throw new BadRequestException('Stock insuficiente en la sede origen');
      }
      await tx.productStock.update({
        where: { productId_branchId: { productId, branchId: fromBranchId } },
        data: { stock: { decrement: qty } },
      });
      await tx.productStock.upsert({
        where: { productId_branchId: { productId, branchId: toBranchId } },
        create: { productId, branchId: toBranchId, stock: qty, tenantId },
        update: { stock: { increment: qty } },
      });
      const fresh = await tx.product.findUnique({
        where: { id: productId },
        include: { stocks: { include: { branch: { select: { name: true } } } } },
      });
      return this.mapStock(fresh as unknown as ProductWithStocks);
    });
  }

  async remove(id: string, tenantId: string) {
    const found = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Producto no encontrado');
    await this.prisma.product.delete({ where: { id } });
    return null;
  }
}
