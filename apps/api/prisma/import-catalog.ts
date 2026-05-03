/**
 * Importa productos del catálogo de suplementos del usuario (BD: catalogo_db)
 * a la tabla Product de GymFit con imágenes reales de Cloudinary.
 *
 * Lee /tmp/catalog-export.txt que es el dump pipe-separated del catálogo.
 *
 * Ejecutar (en el container gymfit-api con el archivo en /tmp):
 *   npx tsx prisma/import-catalog.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

const EXPORT_FILE = '/tmp/catalog-export.txt';

function parsePrice(s: string): number | null {
  if (!s || s.trim() === '') return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

async function main() {
  console.log('📥 IMPORT CATALOG → GymFit Products\n');

  const tenant = await prisma.tenant.findFirst({ where: { slug: 'gymfit-pro' } });
  if (!tenant) { console.error('❌ Tenant gymfit-pro no encontrado'); process.exit(1); }
  console.log(`✓ Tenant: ${tenant.name}\n`);

  if (!fs.existsSync(EXPORT_FILE)) {
    console.error(`❌ No existe ${EXPORT_FILE}. Genera el dump del catálogo primero.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(EXPORT_FILE, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  console.log(`📦 ${lines.length} productos en el dump\n`);

  // Limpiar productos previos
  const deleted = await prisma.product.deleteMany({ where: { tenantId: tenant.id } });
  console.log(`🧹 Eliminados ${deleted.count} productos previos\n`);

  let imported = 0;
  let skipped = 0;
  const stats: Record<string, number> = {};

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split('|');
    if (cols.length < 8) { skipped++; continue; }

    const [name, brand, category, description, priceStr, saleStr, stockStr, imageUrl, isFeatured] = cols;

    if (!name || !imageUrl) { skipped++; continue; }
    if (!imageUrl.includes('cloudinary.com')) { skipped++; continue; }

    const publicPrice = parsePrice(priceStr);
    if (publicPrice === null) { skipped++; continue; }

    // memberPrice = sale_price del catálogo (precio en oferta = precio para miembros del gym)
    const memberPrice = parsePrice(saleStr);
    const stock = stockStr && stockStr.trim() ? parseInt(stockStr, 10) : Math.floor(Math.random() * 30) + 5;

    // Decodificar HTML entities en el nombre
    const cleanName = name
      .replace(/&#8211;/g, '–')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&aacute;/g, 'á')
      .replace(/&eacute;/g, 'é')
      .replace(/&iacute;/g, 'í')
      .replace(/&oacute;/g, 'ó')
      .replace(/&uacute;/g, 'ú')
      .replace(/&ntilde;/g, 'ñ');

    const cat = category || 'Suplementos';
    const cleanBrand = brand && brand.trim() ? brand.trim() : null;

    await prisma.product.create({
      data: {
        name: cleanName.slice(0, 200),
        brand: cleanBrand,
        description: description && description.trim() ? description : null,
        imageUrl,
        category: cat,
        publicPrice,
        memberPrice,
        stock,
        isActive: true,
        order: i,
        tenantId: tenant.id,
      },
    });

    imported++;
    stats[cat] = (stats[cat] || 0) + 1;
    if (imported % 20 === 0) console.log(`  ${imported} importados...`);
  }

  console.log(`\n✅ ${imported} productos importados, ${skipped} omitidos\n`);
  for (const [cat, count] of Object.entries(stats).sort()) {
    console.log(`   ${cat.padEnd(20)} → ${count} productos`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
