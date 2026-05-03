/**
 * Seed Products — importa catálogo de suplementos a la tabla Product
 * Datos copiados de catalogo-gym-fase1
 * Cada producto tiene precio público + precio miembros (~12% descuento)
 *
 * Ejecutar: npx tsx prisma/seed-products.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Imágenes Unsplash por categoría — funcionan sin auth y son estables
const IMG_BY_CATEGORY: Record<string, string[]> = {
  Proteínas: [
    'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80',
    'https://images.unsplash.com/photo-1579722820903-4a0f22c3b9e0?w=800&q=80',
    'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&q=80',
    'https://images.unsplash.com/photo-1607627000458-210e8d2bdb1d?w=800&q=80',
  ],
  Creatinas: [
    'https://images.unsplash.com/photo-1619088978562-73fb98f4ec17?w=800&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
  ],
  'Pre-Entrenos': [
    'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    'https://images.unsplash.com/photo-1622485831150-4dc26daf6e1f?w=800&q=80',
  ],
  Aminoácidos: [
    'https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?w=800&q=80',
    'https://images.unsplash.com/photo-1579722820903-4a0f22c3b9e0?w=800&q=80',
  ],
  Quemadores: [
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
  ],
  Vitaminas: [
    'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&q=80',
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
  ],
  Gainers: [
    'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  ],
  Accesorios: [
    'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800&q=80',
    'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&q=80',
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80',
  ],
};

// Map de categorías del catálogo viejo → categoría del schema GymFit
const CAT_MAP: Record<string, string> = {
  proteinas: 'Proteínas',
  creatinas: 'Creatinas',
  'pre-entrenos': 'Pre-Entrenos',
  aminoacidos: 'Aminoácidos',
  quemadores: 'Quemadores',
  vitaminas: 'Vitaminas',
  gainers: 'Gainers',
  accesorios: 'Accesorios',
};

interface ProductTemplate {
  baseName: string;
  brand: string;
  category: string;
  presentations: { weight: string; price: number }[];
  description: string;
}

// Catálogo curado — 50+ productos de marcas reales del mundo del fitness
const PRODUCTS: ProductTemplate[] = [
  // ==================== PROTEÍNAS ====================
  { baseName: 'Gold Standard 100% Whey', brand: 'Optimum Nutrition', category: 'proteinas',
    presentations: [{ weight: '2lb', price: 259.90 }, { weight: '5lb', price: 459.90 }, { weight: '10lb', price: 789.90 }],
    description: 'La proteína whey más vendida del mundo. 24g de proteína, 5.5g BCAAs y 4g glutamina por servicio.' },
  { baseName: 'Platinum Hydrowhey', brand: 'Optimum Nutrition', category: 'proteinas',
    presentations: [{ weight: '3.5lb', price: 349.90 }],
    description: 'Proteína hidrolizada premium de ON. Absorción ultrarrápida post-entreno.' },
  { baseName: 'Gold Standard Casein', brand: 'Optimum Nutrition', category: 'proteinas',
    presentations: [{ weight: '2lb', price: 279.90 }, { weight: '4lb', price: 489.90 }],
    description: 'Caseína micelar de liberación lenta. Ideal para antes de dormir.' },
  { baseName: 'Nitro-Tech Whey Gold', brand: 'MuscleTech', category: 'proteinas',
    presentations: [{ weight: '2.2lb', price: 269.90 }, { weight: '5lb', price: 479.90 }],
    description: 'Whey protein con péptidos y creatina. 24g proteína por servicio.' },
  { baseName: 'Nitro-Tech Ripped', brand: 'MuscleTech', category: 'proteinas',
    presentations: [{ weight: '2lb', price: 279.90 }, { weight: '4lb', price: 499.90 }],
    description: 'Proteína + quemador de grasa. Para definición muscular.' },
  { baseName: 'ISO100 Hydrolyzed', brand: 'Dymatize', category: 'proteinas',
    presentations: [{ weight: '1.4lb', price: 219.90 }, { weight: '3lb', price: 319.90 }, { weight: '5lb', price: 489.90 }],
    description: '100% proteína aislada hidrolizada. 25g proteína, 0 azúcar, 0 lactosa.' },
  { baseName: 'Syntha-6', brand: 'BSN', category: 'proteinas',
    presentations: [{ weight: '2.91lb', price: 249.90 }, { weight: '5lb', price: 419.90 }],
    description: 'Ultra-premium protein matrix. Mezcla de 6 proteínas de liberación sostenida.' },
  { baseName: 'ISO Whey', brand: 'Dragon Pharma', category: 'proteinas',
    presentations: [{ weight: '2lb', price: 299.90 }, { weight: '4lb', price: 539.90 }],
    description: 'Proteína isolada premium de Dragon Pharma. Cero grasa, cero azúcar.' },
  { baseName: 'R1 Protein', brand: 'Rule One Proteins', category: 'proteinas',
    presentations: [{ weight: '2.4lb', price: 289.90 }, { weight: '5lb', price: 519.90 }],
    description: '25g de proteína isolada e hidrolizada. Sin rellenos innecesarios.' },
  { baseName: 'IsoFlex', brand: 'AllMax Nutrition', category: 'proteinas',
    presentations: [{ weight: '2lb', price: 299.90 }, { weight: '5lb', price: 529.90 }],
    description: 'Proteína isolada pura al 90%. 27g proteína, sin grasa ni azúcar.' },

  // ==================== CREATINAS ====================
  { baseName: 'Creatina Monohidratada', brand: 'Dragon Pharma', category: 'creatinas',
    presentations: [{ weight: '300g', price: 89.90 }, { weight: '500g', price: 129.90 }, { weight: '1kg', price: 219.90 }],
    description: 'Creatina monohidratada micronizada 200 mesh. Pureza garantizada.' },
  { baseName: 'Micronized Creatine', brand: 'Optimum Nutrition', category: 'creatinas',
    presentations: [{ weight: '300g', price: 99.90 }, { weight: '600g', price: 169.90 }, { weight: '1.2kg', price: 299.90 }],
    description: 'Creatina monohidratada micronizada Creapure. 5g por servicio.' },
  { baseName: 'Cell-Tech', brand: 'MuscleTech', category: 'creatinas',
    presentations: [{ weight: '3lb', price: 159.90 }, { weight: '6lb', price: 279.90 }],
    description: 'Sistema de creatina con carbohidratos para máximo transporte muscular.' },
  { baseName: 'Platinum Creatine', brand: 'MuscleTech', category: 'creatinas',
    presentations: [{ weight: '400g', price: 79.90 }, { weight: '800g', price: 139.90 }],
    description: 'Creatina monohidratada ultra-pura. 5g HPLC-tested por servicio.' },
  { baseName: 'Creatine Powder', brand: 'Universal Nutrition', category: 'creatinas',
    presentations: [{ weight: '200g', price: 69.90 }, { weight: '500g', price: 119.90 }, { weight: '1kg', price: 199.90 }],
    description: 'Creatina monohidratada clásica de Universal. Probada desde 1977.' },

  // ==================== PRE-ENTRENOS ====================
  { baseName: 'C4 Original', brand: 'Cellucor', category: 'pre-entrenos',
    presentations: [{ weight: '30 serv', price: 139.90 }, { weight: '60 serv', price: 249.90 }],
    description: 'El pre-entreno más vendido de América. Energía explosiva con CarnoSyn Beta-Alanine.' },
  { baseName: 'C4 Ultimate', brand: 'Cellucor', category: 'pre-entrenos',
    presentations: [{ weight: '20 serv', price: 189.90 }],
    description: 'Versión premium de C4. Citrulina, Beta-Alanina y Cognizin para máximo rendimiento.' },
  { baseName: 'C4 Ripped', brand: 'Cellucor', category: 'pre-entrenos',
    presentations: [{ weight: '30 serv', price: 149.90 }],
    description: 'Pre-entreno con quemadores de grasa incluidos. Energía + definición.' },
  { baseName: 'The Shadow', brand: 'JNX Sports', category: 'pre-entrenos',
    presentations: [{ weight: '30 serv', price: 169.90 }],
    description: 'Pre-entreno hardcore de alta estimulación. Para usuarios experimentados.' },
  { baseName: 'Vapor X5 Next Gen', brand: 'MuscleTech', category: 'pre-entrenos',
    presentations: [{ weight: '30 serv', price: 159.90 }, { weight: '60 serv', price: 279.90 }],
    description: 'Pre-entreno con 5 complejos para energía, fuerza y pump.' },
  { baseName: 'N.O.-Xplode', brand: 'BSN', category: 'pre-entrenos',
    presentations: [{ weight: '30 serv', price: 149.90 }, { weight: '60 serv', price: 269.90 }],
    description: 'Pre-entreno legendario con cafeína, beta-alanina y creatina.' },
  { baseName: 'Venom', brand: 'Dragon Pharma', category: 'pre-entrenos',
    presentations: [{ weight: '40 serv', price: 159.90 }],
    description: 'Pre-entreno potente de Dragon Pharma. Energía extrema y vasodilatación.' },
  { baseName: 'Nitraflex', brand: 'GAT Sport', category: 'pre-entrenos',
    presentations: [{ weight: '30 serv', price: 159.90 }],
    description: 'Pre-entreno con potenciador de testosterona. Fuerza, energía y pump.' },
  { baseName: 'Outlift', brand: 'Nutrex Research', category: 'pre-entrenos',
    presentations: [{ weight: '20 serv', price: 169.90 }],
    description: 'Pre-entreno clínicamente dosificado. 10 ingredientes activos.' },

  // ==================== AMINOÁCIDOS ====================
  { baseName: 'Xtend BCAA', brand: 'Scivation', category: 'aminoacidos',
    presentations: [{ weight: '30 serv', price: 129.90 }, { weight: '90 serv', price: 319.90 }],
    description: 'Los BCAAs más vendidos del mundo. 7g BCAAs + electrolitos por servicio.' },
  { baseName: 'Amino Energy', brand: 'Optimum Nutrition', category: 'aminoacidos',
    presentations: [{ weight: '30 serv', price: 119.90 }, { weight: '65 serv', price: 219.90 }],
    description: 'Aminoácidos + cafeína natural. Energía limpia cualquier momento del día.' },
  { baseName: 'BCAA 1000 Caps', brand: 'Optimum Nutrition', category: 'aminoacidos',
    presentations: [{ weight: '200 caps', price: 79.90 }, { weight: '400 caps', price: 139.90 }],
    description: 'BCAAs en cápsulas convenientes. 1g por cápsula.' },
  { baseName: 'Glutamine Powder', brand: 'Optimum Nutrition', category: 'aminoacidos',
    presentations: [{ weight: '300g', price: 69.90 }, { weight: '600g', price: 119.90 }, { weight: '1kg', price: 179.90 }],
    description: 'L-Glutamina pura micronizada para recuperación e inmunidad.' },
  { baseName: 'Amino X', brand: 'BSN', category: 'aminoacidos',
    presentations: [{ weight: '30 serv', price: 109.90 }, { weight: '70 serv', price: 219.90 }],
    description: 'BCAAs efervescentes con 10g de aminoácidos por servicio.' },
  { baseName: 'BCAA 8:1:1', brand: 'Dragon Pharma', category: 'aminoacidos',
    presentations: [{ weight: '300g', price: 99.90 }, { weight: '600g', price: 169.90 }],
    description: 'BCAAs en proporción 8:1:1 para máxima síntesis proteica.' },

  // ==================== QUEMADORES ====================
  { baseName: 'Lipo-6 Black', brand: 'Nutrex Research', category: 'quemadores',
    presentations: [{ weight: '60 caps', price: 129.90 }],
    description: 'Termogénico de alta potencia con liberación rápida. El quemador más vendido.' },
  { baseName: 'Lipo-6 Black Hers', brand: 'Nutrex Research', category: 'quemadores',
    presentations: [{ weight: '60 caps', price: 119.90 }],
    description: 'Quemador de grasa diseñado para mujeres. Fórmula femenina.' },
  { baseName: 'OxyShred', brand: 'EHP Labs', category: 'quemadores',
    presentations: [{ weight: '60 serv', price: 159.90 }],
    description: 'Quemador de grasa australiano #1. Termogénico + energía + mood.' },
  { baseName: 'Hydroxycut Hardcore Elite', brand: 'MuscleTech', category: 'quemadores',
    presentations: [{ weight: '100 caps', price: 119.90 }],
    description: 'Potente termogénico con C. canephora robusta para pérdida de peso.' },
  { baseName: 'Super HD', brand: 'Cellucor', category: 'quemadores',
    presentations: [{ weight: '60 caps', price: 109.90 }, { weight: '120 caps', price: 189.90 }],
    description: 'Termogénico con nootropicos. Quema grasa + claridad mental.' },
  { baseName: 'Animal Cuts', brand: 'Universal Nutrition', category: 'quemadores',
    presentations: [{ weight: '42 packs', price: 169.90 }],
    description: 'Pack de definición completo: termogénico + diurético + metabolizador.' },

  // ==================== VITAMINAS ====================
  { baseName: 'Opti-Men', brand: 'Optimum Nutrition', category: 'vitaminas',
    presentations: [{ weight: '90 tabs', price: 89.90 }, { weight: '150 tabs', price: 139.90 }, { weight: '240 tabs', price: 199.90 }],
    description: 'Multivitamínico completo para hombres activos. 75+ ingredientes.' },
  { baseName: 'Opti-Women', brand: 'Optimum Nutrition', category: 'vitaminas',
    presentations: [{ weight: '60 caps', price: 79.90 }, { weight: '120 caps', price: 139.90 }],
    description: 'Multivitamínico diseñado para las necesidades de la mujer activa.' },
  { baseName: 'Fish Oil Omega 3', brand: 'Optimum Nutrition', category: 'vitaminas',
    presentations: [{ weight: '100 softgels', price: 59.90 }, { weight: '200 softgels', price: 99.90 }],
    description: 'Aceite de pescado purificado con EPA y DHA.' },
  { baseName: 'ZMA', brand: 'Optimum Nutrition', category: 'vitaminas',
    presentations: [{ weight: '90 caps', price: 49.90 }, { weight: '180 caps', price: 89.90 }],
    description: 'Zinc, Magnesio y B6 para recuperación nocturna.' },
  { baseName: 'Animal Pak', brand: 'Universal Nutrition', category: 'vitaminas',
    presentations: [{ weight: '15 packs', price: 69.90 }, { weight: '30 packs', price: 119.90 }, { weight: '44 packs', price: 159.90 }],
    description: 'El pack de vitaminas legendario para culturistas desde 1983.' },
  { baseName: 'Animal Flex', brand: 'Universal Nutrition', category: 'vitaminas',
    presentations: [{ weight: '44 packs', price: 119.90 }],
    description: 'Soporte completo para articulaciones y ligamentos.' },

  // ==================== GAINERS ====================
  { baseName: 'Serious Mass', brand: 'Optimum Nutrition', category: 'gainers',
    presentations: [{ weight: '6lb', price: 229.90 }, { weight: '12lb', price: 399.90 }],
    description: 'El gainer más vendido. 1250 calorías y 50g de proteína por servicio.' },
  { baseName: 'Pro Gainer', brand: 'Optimum Nutrition', category: 'gainers',
    presentations: [{ weight: '5lb', price: 239.90 }, { weight: '10lb', price: 429.90 }],
    description: 'Gainer de alta proteína con 60g protein y carbohidratos complejos.' },
  { baseName: 'Mass-Tech Extreme 2000', brand: 'MuscleTech', category: 'gainers',
    presentations: [{ weight: '6lb', price: 269.90 }, { weight: '22lb', price: 699.90 }],
    description: '2000 calorías, 80g proteína y 400g carbohidratos por servicio.' },
  { baseName: 'True Mass 1200', brand: 'BSN', category: 'gainers',
    presentations: [{ weight: '10lb', price: 309.90 }],
    description: 'Mass gainer premium con proteínas de múltiples fuentes.' },
  { baseName: 'Mutant Mass', brand: 'Mutant', category: 'gainers',
    presentations: [{ weight: '5lb', price: 199.90 }, { weight: '15lb', price: 519.90 }],
    description: 'Gainer con 1100 calorías y 56g proteína. Sabor delicioso.' },

  // ==================== ACCESORIOS ====================
  { baseName: 'Shaker GymFit Pro', brand: 'GymFit Pro', category: 'accesorios',
    presentations: [{ weight: '600ml', price: 24.90 }, { weight: '750ml', price: 29.90 }],
    description: 'Shaker premium con bola mezcladora. Hermético y resistente.' },
  { baseName: 'Cinturón de Lifting Cuero', brand: 'Schiek', category: 'accesorios',
    presentations: [{ weight: 'M', price: 159.90 }, { weight: 'L', price: 159.90 }, { weight: 'XL', price: 159.90 }],
    description: 'Cinturón de cuero genuino para sentadillas y peso muerto. 4 pulgadas.' },
  { baseName: 'Guantes de Gym', brand: 'Harbinger', category: 'accesorios',
    presentations: [{ weight: 'S', price: 89.90 }, { weight: 'M', price: 89.90 }, { weight: 'L', price: 89.90 }],
    description: 'Guantes acolchados con muñequera incorporada. Antideslizantes.' },
  { baseName: 'Straps de Levantamiento', brand: 'Versa Gripps', category: 'accesorios',
    presentations: [{ weight: 'Universal', price: 79.90 }],
    description: 'Straps profesionales para mejorar el agarre en jalones y peso muerto.' },
  { baseName: 'Banda de Resistencia Set', brand: 'Rogue Fitness', category: 'accesorios',
    presentations: [{ weight: 'Set 5 bandas', price: 149.90 }],
    description: 'Set completo de bandas elásticas de resistencia. 5 niveles.' },
];

function pickImage(category: string, idx: number): string {
  const list = IMG_BY_CATEGORY[CAT_MAP[category]] || IMG_BY_CATEGORY['Proteínas'];
  return list[idx % list.length];
}

async function main() {
  console.log('🛒 SEED PRODUCTS — Catálogo de suplementos GymFit\n');

  // 1. Tenant
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'gymfit-pro' } });
  if (!tenant) {
    console.error('❌ Tenant gymfit-pro no encontrado. Ejecuta el seed principal primero.');
    process.exit(1);
  }
  console.log(`✓ Tenant: ${tenant.name}\n`);

  // 2. Limpiar productos existentes del tenant
  const deleted = await prisma.product.deleteMany({ where: { tenantId: tenant.id } });
  if (deleted.count > 0) console.log(`🧹 Eliminados ${deleted.count} productos previos`);

  // 3. Crear productos — uno por presentación (variantes como productos separados)
  let totalCreated = 0;
  let order = 0;
  const stats: Record<string, number> = {};

  for (let pIdx = 0; pIdx < PRODUCTS.length; pIdx++) {
    const p = PRODUCTS[pIdx];
    const category = CAT_MAP[p.category] || 'Otros';
    const baseImage = pickImage(p.category, pIdx);

    for (const present of p.presentations) {
      const fullName = `${p.brand} ${p.baseName} ${present.weight}`;
      const publicPrice = present.price;
      // Precio miembros: ~12% descuento (redondeado a .90 ó .50)
      const memberPriceRaw = publicPrice * 0.88;
      const memberPrice = Math.floor(memberPriceRaw) + 0.90;

      await prisma.product.create({
        data: {
          name: fullName,
          description: p.description,
          imageUrl: baseImage,
          category,
          publicPrice,
          memberPrice,
          stock: Math.floor(Math.random() * 50) + 10,
          isActive: true,
          order: order++,
          tenantId: tenant.id,
        },
      });
      totalCreated++;
      stats[category] = (stats[category] || 0) + 1;
    }
  }

  console.log(`\n✅ ${totalCreated} productos creados:\n`);
  for (const [cat, count] of Object.entries(stats).sort()) {
    console.log(`   ${cat.padEnd(15)} → ${count} productos`);
  }
  console.log('');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
