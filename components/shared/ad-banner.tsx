'use client';

import Link from 'next/link';
import { Megaphone, ArrowRight } from 'lucide-react';

export type AdBannerPosition = 'top' | 'middle' | 'left' | 'right';
export type AdBannerType = 'horizontal' | 'vertical';

interface AdBannerProps {
  position: AdBannerPosition;
  type: AdBannerType;
  className?: string;
}

export default function AdBanner({ position, type, className = '' }: AdBannerProps) {
  // Horizontal banner (top / middle)
  if (type === 'horizontal') {
    return (
      <Link
        href="/advertise"
        className={`block w-full group ${className}`}
      >
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-trini-red/90 via-trini-black to-trini-red/90 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between px-6 py-4 sm:py-5">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-trini-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-trini-gold" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  Advertise with Freezone
                </h3>
                <p className="text-xs sm:text-sm text-white/70 truncate hidden sm:block">
                  Promote your business to thousands of buyers and sellers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <span className="hidden md:inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-trini-gold to-tropical-orange text-trini-black font-bold rounded-lg group-hover:scale-105 transition-transform text-sm shadow-lg">
                Learn More <ArrowRight className="w-4 h-4" />
              </span>
              <span className="md:hidden inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-trini-gold to-tropical-orange text-trini-black font-bold rounded-lg text-xs shadow-lg">
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Vertical banner (left / right sidebars)
  return (
    <div className={`hidden lg:block ${className}`}>
      <Link href="/advertise" className="block group">
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-trini-red/90 via-trini-black to-trini-red/90 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow p-5">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-trini-gold/20 rounded-xl flex items-center justify-center mb-3">
              <Megaphone className="w-6 h-6 text-trini-gold" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Advertise with Freezone
            </h3>
            <p className="text-xs text-white/70 mb-4 leading-relaxed">
              Promote your business to thousands of buyers and sellers
            </p>
            <span className="w-full px-4 py-2 bg-gradient-to-r from-trini-gold to-tropical-orange text-trini-black font-bold rounded-lg group-hover:scale-105 transition-transform text-sm shadow-lg text-center inline-flex items-center justify-center gap-1">
              Learn More <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
