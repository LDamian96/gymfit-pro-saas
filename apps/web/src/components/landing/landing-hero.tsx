'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  slug: string;
  heroImage: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

// Helper: parte el título en líneas y resalta la palabra "CUERPO" / "MÁXIMO" con orange.
function renderTitle(title: string) {
  const lines = title.split('\n');
  const HIGHLIGHT = /(\bCUERPO\b|\bMÁXIMO\b|\bTRANSFORMA\b)/i;
  return lines.map((line, i) => (
    <span key={i} className="block">
      {line.split(HIGHLIGHT).map((part, j) =>
        HIGHLIGHT.test(part) ? (
          <span key={j} style={{ color: 'var(--gym-orange)' }}>{part}</span>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
    </span>
  ));
}

export function LandingHero({
  slug,
  heroImage,
  title = 'TRANSFORMA\nTU CUERPO',
  subtitle: _subtitle,
  description = 'Entrenamiento personalizado, coaching profesional y un espacio diseñado para resultados reales. Sin excusas.',
}: HeroProps) {
  return (
    <section className="relative min-h-[100svh] flex items-end overflow-hidden mesh-bg grain">
      {/* Imagen de fondo */}
      <Image
        src={heroImage}
        alt="Gimnasio"
        fill
        className="object-cover opacity-55"
        priority
        sizes="100vw"
      />

      {/* Overlays — vignette dramático + glow naranja */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,11,13,0.55) 0%, rgba(10,11,13,0.35) 35%, rgba(10,11,13,0.85) 75%, rgba(10,11,13,0.97) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 12% 70%, rgba(255,90,31,0.22) 0%, transparent 70%)',
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 w-full px-6 md:px-16 pt-24 md:pt-32 pb-16 md:pb-24 max-w-6xl mx-auto">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-3 mb-6"
        >
          <span
            className="w-7 h-[2px] rounded-full"
            style={{ background: 'var(--gym-orange)' }}
          />
          <span className="label-athletic" style={{ color: 'var(--gym-orange)' }}>
            / Forja tu mejor versión
          </span>
        </motion.div>

        {/* Título display gigante */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-display text-foreground tracking-tight leading-[0.88]"
          style={{ fontSize: 'clamp(3.6rem, 11vw, 9rem)' }}
        >
          {renderTitle(title)}
        </motion.h1>

        {/* Descripción */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-7 max-w-xl text-base md:text-[17px] leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.68)' }}
        >
          {description}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-wrap gap-3 mt-9"
        >
          <Link href={`/${slug}/planes`} className="btn-fire">
            Empieza hoy
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <Link
            href={`/${slug}/instalaciones`}
            className="btn-ghost"
          >
            <Play className="h-4 w-4" style={{ color: 'var(--gym-orange)' }} strokeWidth={2.5} />
            Conoce el gym
          </Link>
        </motion.div>

        {/* Hero numerals — stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10 mt-14 pt-8 border-t border-white/10"
        >
          {[
            { value: '2.5K', suffix: '+', label: 'Miembros activos' },
            { value: '12', suffix: '', label: 'Coaches certificados' },
            { value: '98', suffix: '%', label: 'Retención mensual' },
            { value: '700', suffix: 'm²', label: 'De espacio premium' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span
                  className="hero-num"
                  style={{ fontSize: 'clamp(40px, 5.2vw, 60px)', color: 'var(--gym-orange)' }}
                >
                  {s.value}
                </span>
                <span className="font-display text-[18px] md:text-[22px]" style={{ color: 'var(--gym-orange)' }}>
                  {s.suffix}
                </span>
              </div>
              <span
                className="label-athletic mt-2"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
