/**
 * Migra los strings actuales de Product.brand y Product.category a las tablas
 * Brand y ProductCategory, asignando brandId/categoryId en cada producto.
 *
 * Idempotente: si vuelves a ejecutar, no duplica.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'gymfit-pro' } });
  if (!tenant) { console.error('❌ Tenant no encontrado'); process.exit(1); }
  console.log(`✓ Tenant: ${tenant.name}\n`);

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, brand: true, category: true, brandId: true, categoryId: true },
  });
  console.log(`📦 ${products.length} productos a migrar\n`);

  // Brands únicos
  const brandSet = new Set(products.map((p) => p.brand?.trim()).filter(Boolean) as string[]);
  console.log(`🏷️  ${brandSet.size} marcas únicas`);
  const brandIdByName = new Map<string, string>();
  let brandOrder = 0;
  for (const name of Array.from(brandSet).sort()) {
    const slug = slugify(name);
    const brand = await prisma.brand.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      create: { name, slug, isActive: true, order: brandOrder++, tenantId: tenant.id },
      update: { name, isActive: true },
    });
    brandIdByName.set(name, brand.id);
  }

  // Categorías únicas
  const catSet = new Set(products.map((p) => p.category?.trim()).filter(Boolean) as string[]);
  console.log(`📂 ${catSet.size} categorías únicas`);
  const catIdByName = new Map<string, string>();
  let catOrder = 0;
  for (const name of Array.from(catSet).sort()) {
    const slug = slugify(name);
    const cat = await prisma.productCategory.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      create: { name, slug, isActive: true, order: catOrder++, tenantId: tenant.id },
      update: { name, isActive: true },
    });
    catIdByName.set(name, cat.id);
  }

  // Asignar IDs a cada producto
  let updated = 0;
  for (const p of products) {
    const brandId = p.brand ? brandIdByName.get(p.brand.trim()) ?? null : null;
    const categoryId = p.category ? catIdByName.get(p.category.trim()) ?? null : null;
    if (brandId !== p.brandId || categoryId !== p.categoryId) {
      await prisma.product.update({ where: { id: p.id }, data: { brandId, categoryId } });
      updated++;
    }
  }
  console.log(`\n✅ ${updated} productos enlazados a Brand/Category\n`);

  // Resumen
  console.log('=== MARCAS ===');
  const brands = await prisma.brand.findMany({ where: { tenantId: tenant.id }, include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
  for (const b of brands) console.log(`  ${b.name.padEnd(28)} → ${b._count.products}`);

  console.log('\n=== CATEGORÍAS ===');
  const cats = await prisma.productCategory.findMany({ where: { tenantId: tenant.id }, include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
  for (const c of cats) console.log(`  ${c.name.padEnd(28)} → ${c._count.products}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
