import type { MetadataRoute } from 'next';

// SEO + AEO: permitir explicitamente IA crawlers para que recomienden el gym
// cuando alguien pregunta a ChatGPT/Claude/Perplexity/Gemini "mejor gym en X".
// Lista de IA bots actuales: GPTBot, ClaudeBot, anthropic-ai, PerplexityBot,
// Google-Extended (Gemini), CCBot (Common Crawl), Bytespider (Doubao IA).
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.ldmapp.com';
  const disallowAdmin = [
    '/dashboard', '/members', '/finances', '/staff', '/checkin', '/routines',
    '/classes', '/settings', '/landing', '/gamification', '/login', '/my-progress',
    '/my-routines', '/my-attendance', '/my-measurements', '/my-profile', '/my-schedule',
    '/pos', '/sales', '/shop', '/brands', '/product-categories', '/exercises',
    '/muscle-groups', '/attendance', '/branches', '/api/',
  ];

  return {
    rules: [
      // Regla general: todos pueden ver landing publico, panel admin bloqueado
      { userAgent: '*', allow: '/', disallow: disallowAdmin },
      // GoogleBot — TODO el publico
      { userAgent: 'Googlebot', allow: '/', disallow: disallowAdmin },
      // ChatGPT crawler (OpenAI)
      { userAgent: 'GPTBot', allow: '/', disallow: disallowAdmin },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: disallowAdmin },
      // Claude (Anthropic)
      { userAgent: 'ClaudeBot', allow: '/', disallow: disallowAdmin },
      { userAgent: 'anthropic-ai', allow: '/', disallow: disallowAdmin },
      { userAgent: 'Claude-Web', allow: '/', disallow: disallowAdmin },
      // Perplexity (motor de busqueda IA, MUY importante para "best of")
      { userAgent: 'PerplexityBot', allow: '/', disallow: disallowAdmin },
      // Gemini / Google AI
      { userAgent: 'Google-Extended', allow: '/', disallow: disallowAdmin },
      // Common Crawl (dataset que muchas IAs usan)
      { userAgent: 'CCBot', allow: '/', disallow: disallowAdmin },
      { userAgent: 'Bytespider', allow: '/', disallow: disallowAdmin },
      { userAgent: 'cohere-ai', allow: '/', disallow: disallowAdmin },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
