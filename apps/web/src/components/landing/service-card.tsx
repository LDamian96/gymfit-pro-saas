'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Dumbbell, Users, Apple, Target, Trophy, ScanLine } from 'lucide-react';
import { AnimatedSection, AnimatedImage } from './animated-wrapper';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dumbbell: Dumbbell, users: Users, apple: Apple, target: Target, trophy: Trophy, 'scan-line': ScanLine,
};

interface ServiceCardProps {
  index: number;
  name: string;
  description: string;
  image: string;
  iconName: string;
  isReversed: boolean;
  slug: string;
}

export function ServiceCard({ index, name, description, image, iconName, isReversed, slug }: ServiceCardProps) {
  const Icon = iconMap[iconName] || Dumbbell;
  const num = String(index + 1).padStart(2, '0');

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden px-4 py-8">
        <AnimatedImage>
          <div className="relative h-[220px] rounded-2xl overflow-hidden mb-5 group">
            <Image src={image} alt={name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121A1AEE] via-[#121A1A40] to-transparent" />
            {/* Número */}
            <div className="absolute top-3 left-3 w-8 h-8 bg-[#B2E234] rounded-lg flex items-center justify-center">
              <span className="text-[#121A1A] text-xs font-black">{num}</span>
            </div>
            {/* Nombre sobre imagen */}
            <div className="absolute bottom-3 left-3 right-3">
              <h2 className="text-xl font-black text-[#F9FAFA] drop-shadow-lg">{name}</h2>
            </div>
          </div>
        </AnimatedImage>

        <AnimatedSection delay={0.15}>
          <div className="p-4 rounded-2xl bg-[#B3B8B80C] border border-[#B3B8B815]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[#B2E23415] rounded-xl flex items-center justify-center">
                <Icon className="h-4.5 w-4.5 text-[#B2E234]" />
              </div>
              <span className="text-[#B2E234] text-[10px] font-bold tracking-[3px]">SERVICIO {num}</span>
            </div>
            <p className="text-[#B3B8B8] text-sm leading-relaxed">{description}</p>
            <Link href={`/${slug}/planes`} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#B2E234] group">
              Conocer más <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </AnimatedSection>
      </div>

      {/* Desktop */}
      <div className="hidden md:block px-16 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-16 items-center">
          {/* Imagen */}
          <AnimatedImage delay={isReversed ? 0.2 : 0}>
            <div className={`relative h-[420px] rounded-2xl overflow-hidden group ${isReversed ? 'order-2' : ''}`}>
              <Image src={image} alt={name} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="50vw" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#B3B8B815]" />
              {/* Número */}
              <div className="absolute top-6 left-6 w-12 h-12 bg-[#B2E234] rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(178,226,52,0.3)]">
                <span className="text-[#121A1A] text-lg font-black">{num}</span>
              </div>
            </div>
          </AnimatedImage>

          {/* Texto */}
          <AnimatedSection delay={isReversed ? 0 : 0.2} direction={isReversed ? 'left' : 'right'}>
            <div className={isReversed ? 'order-1' : ''}>
              <div className="w-14 h-14 bg-[#B2E23415] rounded-2xl flex items-center justify-center mb-5">
                <Icon className="h-7 w-7 text-[#B2E234]" />
              </div>
              <span className="text-[#B3B8B860] text-[11px] font-bold tracking-[3px] uppercase">
                Servicio {num}
              </span>
              <h2 className="mt-2 text-3xl font-black text-[#F9FAFA] mb-4">{name}</h2>
              <p className="text-[#B3B8B8] text-base leading-relaxed mb-6">{description}</p>
              <Link
                href={`/${slug}/planes`}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#B2E234] hover:text-[#8DB52A] transition-colors duration-300 group"
              >
                Comenzar ahora <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </>
  );
}
