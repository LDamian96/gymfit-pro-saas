'use client';

import Image from 'next/image';
import { AnimatedSection, AnimatedImage } from './animated-wrapper';

interface FacilityCardProps {
  index: number;
  name: string;
  description: string;
  image: string;
  isReversed: boolean;
}

export function FacilityCard({ index, name, description, image, isReversed }: FacilityCardProps) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden px-4 py-8">
        <AnimatedImage>
          <div className="relative h-[200px] rounded-2xl overflow-hidden mb-4 group">
            <Image src={image} alt={name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121A1AEE] via-[#121A1A40] to-transparent" />
            {/* Badge */}
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-[#B2E234] text-[10px] font-black tracking-wider text-[#121A1A]">
              ZONA {num}
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <h2 className="text-xl font-black text-[#F9FAFA] drop-shadow-lg">{name}</h2>
            </div>
          </div>
        </AnimatedImage>

        <AnimatedSection delay={0.15}>
          <p className="text-[#B3B8B8] text-sm leading-relaxed px-1">{description}</p>
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
              {/* Badge */}
              <div className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-[#B2E234] text-xs font-black tracking-wider text-[#121A1A] shadow-[0_4px_20px_rgba(178,226,52,0.3)]">
                ZONA {num}
              </div>
            </div>
          </AnimatedImage>

          {/* Texto */}
          <AnimatedSection delay={isReversed ? 0 : 0.2} direction={isReversed ? 'left' : 'right'}>
            <div className={isReversed ? 'order-1' : ''}>
              <h2 className="text-3xl font-black text-[#F9FAFA] mb-4">{name}</h2>
              <p className="text-[#B3B8B8] text-base leading-relaxed">{description}</p>
              {/* Línea decorativa animada */}
              <div className="mt-6 h-1 w-16 rounded-full bg-[#B2E234]" />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </>
  );
}
