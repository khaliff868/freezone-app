'use client';

import Link from 'next/link';
import { Megaphone, Sparkles } from 'lucide-react';

// Demo Banner Variants Configuration
export type DemoBannerVariant = 'main' | 'sidebar' | 'midpage';

interface DemoBannerContent {
  title: string;
  subtitle: string;
  button: string;
  price: string;
  badge: string;
}

const DEMO_BANNER_CONTENT: Record<DemoBannerVariant, DemoBannerContent> = {
  main: {
    title: 'Advertise Your Business Here',
    subtitle: 'Reach thousands of buyers and sellers across Trinidad & Tobago',
    button: 'Post Your Banner Ad',
    price: 'Banner Ads — 1000 TTD for 30 days',
    badge: 'Demo Ad',
  },
  sidebar: {
    title: 'Your Ad Here',
    subtitle: 'Promote your business today',
    button: 'Advertise',
    price: '1000 TTD / 30 days',
    badge: 'Demo',
  },
  midpage: {
    title: 'Boost Your Brand on Freezone',
    subtitle: 'Get seen by active buyers and sellers',
    button: 'Post Banner Ad',
    price: 'Banner Ads — 1000 TTD for 30 days',
    badge: 'Demo Ad',
  },
};

// Map placement names to demo variants
export function getVariantFromPlacement(placement: string): DemoBannerVariant {
  if (placement.includes('sidebar')) {
    return 'sidebar';
  }
  if (placement.includes('mid')) {
    return 'midpage';
  }
  return 'main';
}

interface DemoBannerProps {
  variant: DemoBannerVariant;
  className?: string;
}

export default function DemoBanner({ variant, className = '' }: DemoBannerProps) {
  const content = DEMO_BANNER_CONTENT[variant];

  // Main/Midpage horizontal banner
  if (variant === 'main' || variant === 'midpage') {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
        {/* Gradient Background */}
        <div className="relative w-full aspect-[4/1] sm:aspect-[5/1] bg-gradient-to-r from-trini-red via-trini-black to-trini-red">
          {/* Demo Badge */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-trini-gold/90 rounded-full text-[10px] text-trini-black font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            {content.badge}
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-trini-gold" />
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {content.title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-3 max-w-md">
              {content.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <Link
                href="/dashboard/banners"
                className="px-4 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-trini-gold to-tropical-orange text-trini-black font-bold rounded-lg hover:scale-105 transition-transform text-xs sm:text-sm shadow-lg"
              >
                {content.button}
              </Link>
              <span className="text-[10px] sm:text-xs text-white/70 bg-white/10 px-2 py-1 rounded-full">
                {content.price}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar banner (vertical/compact)
  return (
    <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
      {/* Gradient Background */}
      <div className="relative w-full bg-gradient-to-b from-trini-red via-trini-black to-trini-red p-5">
        {/* Demo Badge */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-trini-gold/90 rounded-full text-[10px] text-trini-black font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          {content.badge}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-12 h-12 bg-trini-gold/20 rounded-xl flex items-center justify-center mb-3">
            <Megaphone className="w-6 h-6 text-trini-gold" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {content.title}
          </h3>
          <p className="text-xs text-white/70 mb-3">
            {content.subtitle}
          </p>
          <Link
            href="/dashboard/banners"
            className="w-full px-4 py-2 bg-gradient-to-r from-trini-gold to-tropical-orange text-trini-black font-bold rounded-lg hover:scale-105 transition-transform text-sm shadow-lg text-center"
          >
            {content.button}
          </Link>
          <span className="mt-2 text-[10px] text-white/60">
            {content.price}
          </span>
        </div>
      </div>
    </div>
  );
}
