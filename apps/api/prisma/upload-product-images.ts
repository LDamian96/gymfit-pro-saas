/**
 * Sube imágenes reales de productos a Cloudinary (cloud: dnqkkd5nj)
 * y actualiza la URL de cada Product en la BD.
 *
 * Estrategia:
 *   - Para cada categoría tenemos una lista de URLs Unsplash de fotos reales
 *   - Cada producto recibe una imagen única basada en hash del id
 *   - Cloudinary descarga la URL y la sube a /gym-app/products/<categoria>/<id>
 *   - El Product.imageUrl queda con la URL Cloudinary del proyecto
 *
 * Ejecutar: npx tsx prisma/upload-product-images.ts
 */
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dnqkkd5nj',
  api_key: process.env.CLOUDINARY_API_KEY || '388425642996986',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'r_S3rJO1yYVeEKgaIKQad44DWGQ',
});

// Set diverso de imágenes Unsplash de productos reales por categoría
// Mezclamos botes de proteína, suplementos en polvo, fitness, etc.
const POOL: Record<string, string[]> = {
  'Proteínas': [
    'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=900&q=85',
    'https://images.unsplash.com/photo-1579722820903-4a0f22c3b9e0?w=900&q=85',
    'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=900&q=85',
    'https://images.unsplash.com/photo-1607627000458-210e8d2bdb1d?w=900&q=85',
    'https://images.unsplash.com/photo-1626197031507-c17099753214?w=900&q=85',
    'https://images.unsplash.com/photo-1622818425825-e2bd2b0db4f0?w=900&q=85',
    'https://images.unsplash.com/photo-1620203432574-71a7caaa39c5?w=900&q=85',
    'https://images.unsplash.com/photo-1600181958810-f3531c4a7656?w=900&q=85',
  ],
  'Creatinas': [
    'https://images.unsplash.com/photo-1619088978562-73fb98f4ec17?w=900&q=85',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=85',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&q=85',
    'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=900&q=85',
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=900&q=85',
  ],
  'Pre-Entrenos': [
    'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=900&q=85',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=85',
    'https://images.unsplash.com/photo-1622485831150-4dc26daf6e1f?w=900&q=85',
    'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=900&q=85',
    'https://images.unsplash.com/photo-1607004468138-e7e23ea26947?w=900&q=85',
  ],
  'Aminoácidos': [
    'https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?w=900&q=85',
    'https://images.unsplash.com/photo-1598113333417-3b7c19fd1c30?w=900&q=85',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=85',
    'https://images.unsplash.com/photo-1633078654544-c69eb3e3e0c9?w=900&q=85',
  ],
  'Quemadores': [
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=900&q=85',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=900&q=85',
    'https://images.unsplash.com/photo-1622818425825-e2bd2b0db4f0?w=900&q=85',
    'https://images.unsplash.com/photo-1611077434314-99daab02b9ed?w=900&q=85',
  ],
  'Vitaminas': [
    'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=900&q=85',
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&q=85',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=85',
    'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=900&q=85',
  ],
  'Gainers': [
    'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=900&q=85',
    'https://images.unsplash.com/photo-1602166242292-93a4c8473f6d?w=900&q=85',
    'https://images.unsplash.com/photo-1627483297886-49710ae1fc22?w=900&q=85',
    'https://images.unsplash.com/photo-1620203432574-71a7caaa39c5?w=900&q=85',
  ],
  'Accesorios': [
    'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=900&q=85',
    'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=900&q=85',
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=900&q=85',
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&q=85',
    'https://images.unsplash.com/photo-1652363722833-509b3aac287b?w=900&q=85',
  ],
};

// Hash simple para asignar imagen consistente por id, devolvemos lista rotada
// (intentamos primero la "principal", si falla pasamos a la siguiente)
function pickImgs(category: string, id: string): string[] {
  const list = POOL[category] || POOL['Proteínas'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const start = Math.abs(h) % list.length;
  return [...list.slice(start), ...list.slice(0, start)];
}

async function uploadOne(sourceUrls: string[], productId: string, category: string): Promise<string | null> {
  const slug = category.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const url of sourceUrls) {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: `gym-app/products/${slug}`,
        public_id: productId,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'fill', gravity: 'auto', quality: 'auto:good', format: 'webp' },
        ],
      });
      return result.secure_url;
    } catch (err: unknown) {
      const errObj = err as { message?: string; http_code?: number };
      const reason = errObj?.message || JSON.stringify(err).slice(0, 100);
      console.log(`    ✗ ${url.slice(40, 80)}…  ${reason.slice(0, 60)}`);
      // sigue al siguiente URL del pool
    }
  }
  return null;
}

async function main() {
  console.log('☁️  UPLOAD PRODUCT IMAGES → Cloudinary (dnqkkd5nj)\n');

  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true, imageUrl: true },
    orderBy: { order: 'asc' },
  });
  console.log(`📦 ${products.length} productos en la BD\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (p.imageUrl?.includes('res.cloudinary.com/dnqkkd5nj/gym-app/products')) {
      skipped++;
      continue;
    }
    const sources = pickImgs(p.category || 'Proteínas', p.id);
    process.stdout.write(`[${i + 1}/${products.length}] ${p.name.slice(0, 45).padEnd(46)} → `);
    const url = await uploadOne(sources, p.id, p.category || 'otros');
    if (url) {
      await prisma.product.update({ where: { id: p.id }, data: { imageUrl: url } });
      uploaded++;
      console.log('✓');
    } else {
      failed++;
      console.log('FAILED');
    }
  }

  console.log(`\n✅ ${uploaded} subidas · ${skipped} ya estaban · ${failed} fallaron`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
