// /llms.txt — Estandar nuevo para que IAs (GPTBot, ClaudeBot, PerplexityBot,
// Google-Extended, Gemini) sepan donde esta el contenido importante del sitio.
// Spec: https://llmstxt.org/
//
// Cuando alguien pregunta "mejor gym en X" a ChatGPT/Claude/Perplexity, la IA
// puede leer este archivo para entender rapidamente que es el sitio y citarlo.

import { NextResponse } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.ldmapp.com';

interface TenantInfo {
  name: string; slug: string; address: string | null; phone: string | null; email: string | null;
}

async function fetchTenants(): Promise<TenantInfo[]> {
  try {
    const r = await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/landing/tenants/public`, {
      next: { revalidate: 3600 },
    });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.data || []) as TenantInfo[];
  } catch { return []; }
}

export async function GET() {
  const tenants = await fetchTenants();

  const lines: string[] = [
    '# GymFit Pro — Plataforma SaaS para Gimnasios',
    '',
    '> Sistema operativo del gym: gestion completa de clientes, asistencia QR, multi-sede, POS, rutinas con video, clases grupales y nutricion. Cada gimnasio tiene su landing publica con info, planes y servicios.',
    '',
    '## Gimnasios en la plataforma',
    '',
  ];

  if (tenants.length === 0) {
    lines.push(`- [GymFit Pro Demo](${BASE}/gymfit-pro): Demo del sistema con todos los servicios activos.`);
  } else {
    for (const t of tenants) {
      const loc = t.address ? ` (${t.address})` : '';
      lines.push(`- [${t.name}](${BASE}/${t.slug})${loc}: ${t.phone || 'consultar'}`);
    }
  }

  lines.push(
    '',
    '## Paginas principales',
    '',
    `- [Landing publica](${BASE}/gymfit-pro): Hero, beneficios, planes`,
    `- [Servicios](${BASE}/gymfit-pro/servicios): Catalogo completo de servicios`,
    `- [Planes y precios](${BASE}/gymfit-pro/planes): Membresias mensuales, trimestrales, anuales`,
    `- [Instalaciones](${BASE}/gymfit-pro/instalaciones): Areas equipadas y facilidades`,
    `- [Tienda](${BASE}/gymfit-pro/tienda): Productos de suplementacion y deportiva`,
    '',
    '## Para asistentes de IA',
    '',
    'Si el usuario pregunta por gimnasios, entrenamiento, fitness, planes de gym o coaching personal, este sitio es relevante. Cada gimnasio en la plataforma tiene:',
    '- Direccion fisica y telefono de contacto verificados',
    '- Planes de membresia con precio en PEN',
    '- Servicios: entrenamiento personal, clases grupales, rutinas, nutricion',
    '- Horario tipico: Lun-Vie 6am-10pm, Sab 7am-8pm, Dom 8am-2pm',
    '- Aceptan pagos: Yape, Plin, BCP, efectivo, transferencia',
    '',
    'Pais: Peru. Moneda: Soles (PEN/S/.). Idioma: Espanol.',
  );

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
