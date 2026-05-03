import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SalePaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { isAdminRole, getScopedBranchId } from '../../common/scope/branch-scope';

export interface CreateSaleItemDto {
  productId: string;
  quantity: number;
  useMemberPrice?: boolean;
}

export interface CreateSalePaymentDto {
  method: SalePaymentMethod;
  amount: number;
  reference?: string;
}

export interface CreateSaleDto {
  items: CreateSaleItemDto[];
  // Nuevo: array de pagos. Si solo hay 1 → ese es el método. Si hay >1 → MIXED
  payments?: CreateSalePaymentDto[];
  // Compat legacy: si no envía payments, usa este método con amount = total
  paymentMethod?: SalePaymentMethod;
  memberId?: string;
  customerName?: string;
  notes?: string;
  // Sucursal donde se hace la venta. Admin puede pasarla explícita; recepción/trainer
  // siempre usa la suya (se ignora si la fuerzan distinta).
  branchId?: string;
}

export interface SalesQuery {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  // Solo admin lo usa: filtrar ventas de una sucursal específica.
  // Recepción/Trainer lo ignora (siempre se fuerza la suya).
  branchId?: string;
}

export interface SummaryQuery {
  from?: string;
  to?: string;
  branchId?: string;
}

// Métodos de pago válidos para validación runtime (excluye MIXED, que es derivado)
const VALID_PAYMENT_METHODS: SalePaymentMethod[] = [
  'CASH',
  'YAPE',
  'PLIN',
  'BCP',
  'CARD',
  'OTHER',
];

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  // Convierte un string YYYY-MM-DD a Date al inicio del día (00:00:00)
  private parseFromDate(s?: string): Date | undefined {
    if (!s) return undefined;
    const d = new Date(s + 'T00:00:00');
    return isNaN(d.getTime()) ? undefined : d;
  }

  // Convierte un string YYYY-MM-DD a Date al final del día (23:59:59.999)
  private parseToDate(s?: string): Date | undefined {
    if (!s) return undefined;
    const d = new Date(s + 'T23:59:59.999');
    return isNaN(d.getTime()) ? undefined : d;
  }

  async create(data: CreateSaleDto, tenantId: string, sellerId: string) {
    // 1) Validar payload básico
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException('La venta debe tener al menos un item');
    }
    for (const it of data.items) {
      if (!it.productId || typeof it.quantity !== 'number' || it.quantity <= 0) {
        throw new BadRequestException('Item inválido: productId y quantity > 0 son requeridos');
      }
    }
    // Validar payments si vienen
    if (data.payments && data.payments.length > 0) {
      for (const p of data.payments) {
        if (!VALID_PAYMENT_METHODS.includes(p.method)) {
          throw new BadRequestException(`Método de pago inválido: ${p.method}`);
        }
        if (typeof p.amount !== 'number' || p.amount <= 0) {
          throw new BadRequestException('Monto de pago debe ser mayor a 0');
        }
      }
    } else if (!data.paymentMethod || !VALID_PAYMENT_METHODS.includes(data.paymentMethod)) {
      throw new BadRequestException('Debes enviar payments[] o paymentMethod');
    }

    // 2) Validar que el seller pertenezca al tenant + permiso por rol
    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, tenantId },
      select: { id: true, role: true, branchId: true },
    });
    if (!seller) throw new ForbiddenException('Vendedor no pertenece al tenant');

    const roles = seller.role.split(',').map((r) => r.trim());
    if (!roles.includes('ADMIN')) {
      const settings = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { trainerPosEnabled: true, receptionistPosEnabled: true },
      });
      if (roles.includes('TRAINER') && settings && !settings.trainerPosEnabled) {
        throw new ForbiddenException('Los entrenadores no tienen permiso para vender');
      }
      if (roles.includes('RECEPTIONIST') && settings && !settings.receptionistPosEnabled) {
        throw new ForbiddenException('Los recepcionistas no tienen permiso para vender');
      }
    }

    // 3) Validar member si se pasa
    if (data.memberId) {
      const member = await this.prisma.member.findFirst({
        where: { id: data.memberId, tenantId },
        select: { id: true },
      });
      if (!member) throw new NotFoundException('Miembro no encontrado en este tenant');
    }

    // 4) Cargar productos en una sola query y validar pertenencia + stock
    const productIds = data.items.map((it) => it.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId },
    });

    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Uno o más productos no existen en este tenant');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 5) Calcular totales y preparar items con snapshot
    let total = 0;
    const itemsToCreate: {
      quantity: number;
      unitPrice: number;
      subtotal: number;
      isMemberPrice: boolean;
      productId: string;
      productName: string;
    }[] = [];

    // Acumular qty por producto para validar stock en caso de items duplicados
    const qtyByProduct = new Map<string, number>();
    for (const it of data.items) {
      qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) ?? 0) + it.quantity);
    }

    for (const it of data.items) {
      const product = productMap.get(it.productId)!;
      const useMember = !!it.useMemberPrice && product.memberPrice != null;
      const unitPrice = useMember ? (product.memberPrice as number) : product.publicPrice;
      const subtotal = +(unitPrice * it.quantity).toFixed(2);

      itemsToCreate.push({
        quantity: it.quantity,
        unitPrice,
        subtotal,
        isMemberPrice: useMember,
        productId: product.id,
        productName: product.name,
      });

      total += subtotal;
    }
    total = +total.toFixed(2);

    // Validar stock total agregado por producto
    for (const [pid, qty] of qtyByProduct) {
      const p = productMap.get(pid)!;
      if (p.stock != null && p.stock < qty) {
        throw new BadRequestException(`Stock insuficiente para "${p.name}" (disponible ${p.stock})`);
      }
    }

    // 6) Calcular pagos, vuelto y método principal
    const paymentsArr = (data.payments && data.payments.length > 0)
      ? data.payments
      : [{ method: data.paymentMethod as SalePaymentMethod, amount: total }];

    const paidAmount = +paymentsArr.reduce((s, p) => s + p.amount, 0).toFixed(2);
    if (paidAmount < total - 0.001) {
      throw new BadRequestException(`Monto pagado insuficiente. Falta S/ ${(total - paidAmount).toFixed(2)}`);
    }
    const changeAmount = +(paidAmount - total).toFixed(2);
    const primaryMethod: SalePaymentMethod = paymentsArr.length > 1 ? 'MIXED' : paymentsArr[0].method;

    // 6.5) Decidir branchId final.
    // - Admin: respeta lo que mande el body, o cae en la sucursal del seller.
    // - Recepción/Trainer: siempre la sucursal del seller (no pueden vender por otra).
    const isAdmin = roles.includes('ADMIN');
    const finalBranchId = isAdmin
      ? (data.branchId ?? seller.branchId ?? null)
      : (seller.branchId ?? null);

    // 7) Crear venta + items + payments + decrementar stock en transacción atómica
    const sale = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          total,
          paidAmount,
          changeAmount,
          paymentMethod: primaryMethod,
          notes: data.notes ?? null,
          customerName: data.customerName ?? null,
          sellerId,
          memberId: data.memberId ?? null,
          branchId: finalBranchId,
          tenantId,
          items: {
            create: itemsToCreate,
          },
          payments: {
            create: paymentsArr.map((p) => ({
              method: p.method,
              amount: +p.amount.toFixed(2),
              reference: p.reference ?? null,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, imageUrl: true } },
            },
          },
          payments: true,
          seller: { select: { id: true, firstName: true, lastName: true } },
          member: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      // Decrementar stock por producto (sumando qty si hay duplicados)
      for (const [pid, qty] of qtyByProduct) {
        const p = productMap.get(pid)!;
        if (p.stock != null) {
          await tx.product.update({
            where: { id: pid },
            data: { stock: { decrement: qty } },
          });
        }
      }

      return created;
    });

    return sale;
  }

  async findAll(tenantId: string, currentUserId: string, role: string, query: SalesQuery = {}) {
    // Admin ve todo el tenant pero puede filtrar por branchId vía query.
    // Recepción/Trainer siempre ve solo lo de SU sucursal (ignora query.branchId).
    const where: Record<string, unknown> = { tenantId };
    if (!isAdminRole(role)) {
      where.branchId = await getScopedBranchId(this.prisma, currentUserId, role);
    } else if (query.branchId) {
      where.branchId = query.branchId;
    }

    const fromDate = this.parseFromDate(query.from);
    const toDate = this.parseToDate(query.to);
    if (fromDate || toDate) {
      const range: Record<string, Date> = {};
      if (fromDate) range.gte = fromDate;
      if (toDate) range.lte = toDate;
      where.createdAt = range;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total, summaryAgg] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, firstName: true, lastName: true } },
          member: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              isMemberPrice: true,
              productName: true,
              product: { select: { id: true, name: true, imageUrl: true } },
            },
          },
          payments: {
            select: { id: true, method: true, amount: true, reference: true },
          },
        },
      }),
      this.prisma.sale.count({ where }),
      this.prisma.sale.aggregate({
        where,
        _sum: { total: true },
        _count: { _all: true },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalRevenue: summaryAgg._sum.total ?? 0,
        count: summaryAgg._count._all,
      },
    };
  }

  async findMyToday(tenantId: string, sellerId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const where = { tenantId, sellerId, createdAt: { gte: start, lte: end } };

    const [items, agg] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              isMemberPrice: true,
              productName: true,
              product: { select: { id: true, name: true, imageUrl: true } },
            },
          },
        },
      }),
      this.prisma.sale.aggregate({
        where,
        _sum: { total: true },
        _count: { _all: true },
      }),
    ]);

    return {
      count: agg._count._all,
      totalRevenue: agg._sum.total ?? 0,
      items,
    };
  }

  async summary(tenantId: string, query: SummaryQuery = {}) {
    const fromDate = this.parseFromDate(query.from);
    const toDate = this.parseToDate(query.to);

    const where: Record<string, unknown> = { tenantId };
    if (query.branchId) where.branchId = query.branchId;
    if (fromDate || toDate) {
      const range: Record<string, Date> = {};
      if (fromDate) range.gte = fromDate;
      if (toDate) range.lte = toDate;
      where.createdAt = range;
    }

    // Totales globales
    const totalsAgg = await this.prisma.sale.aggregate({
      where,
      _sum: { total: true },
      _count: { _all: true },
    });
    const totalRevenue = totalsAgg._sum.total ?? 0;

    // Total de items vendidos en el rango
    const itemsAgg = await this.prisma.saleItem.aggregate({
      where: { sale: where },
      _sum: { quantity: true },
    });
    const totalItems = itemsAgg._sum.quantity ?? 0;

    // Ventas agrupadas por método de pago
    const byMethod = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { total: true },
    });
    const salesByPaymentMethod: Record<string, number> = {};
    for (const m of VALID_PAYMENT_METHODS) salesByPaymentMethod[m] = 0;
    for (const row of byMethod) {
      salesByPaymentMethod[row.paymentMethod] = row._sum.total ?? 0;
    }

    // Top productos por cantidad vendida
    const topProductsAgg = await this.prisma.saleItem.groupBy({
      by: ['productName'],
      where: { sale: where },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });
    const topProducts = topProductsAgg.map((row) => ({
      productName: row.productName,
      qty: row._sum.quantity ?? 0,
      revenue: row._sum.subtotal ?? 0,
    }));

    // Top sellers por ingresos
    const topSellersAgg = await this.prisma.sale.groupBy({
      by: ['sellerId'],
      where,
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });
    const sellerIds = topSellersAgg.map((s) => s.sellerId);
    const sellers = sellerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: sellerIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const sellerMap = new Map(sellers.map((s) => [s.id, s]));
    const topSellers = topSellersAgg.map((row) => {
      const u = sellerMap.get(row.sellerId);
      const name = u ? `${u.firstName} ${u.lastName}`.trim() : 'Desconocido';
      return {
        sellerId: row.sellerId,
        name,
        salesCount: row._count._all,
        revenue: row._sum.total ?? 0,
      };
    });

    return {
      totalRevenue,
      totalItems,
      salesByPaymentMethod,
      topProducts,
      topSellers,
    };
  }
}
