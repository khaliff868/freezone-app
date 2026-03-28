'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Megaphone, ArrowRight } from 'lucide-react';

export type AdBannerPosition = 'top' | 'middle' | 'left' | 'right';
export type AdBannerType = 'horizontal' | 'vertical';

interface AdBannerProps {
  position: AdBannerPosition;
  type: AdBannerType;
  className?: string;
}

// Map position to BannerAd placement values (new + legacy)
const PLACEMENT_MAP: Record<AdBannerPosition, string[]> = {
  top: ['homepage_top_middle', 'homepage_top', 'browse_top_bottom', 'browse_top'],
  middle: ['homepage_top_middle', 'homepage_mid', 'browse_top_bottom', 'browse_mid'],
  left: ['homepage_sides', 'browse_sides', 'homepage_sidebar', 'browse_sidebar'],
  right: ['homepage_sides', 'browse_sides', 'homepage_sidebar', 'homepage_sidebar_bottom', 'browse_sidebar', 'browse_sidebar_bottom'],
};

const ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface BannerData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
}

export default function AdBanner({ position, type, className = '' }: AdBannerProps) {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pool, setPool] = useState<BannerData[]>([]);
  const [index, setIndex] = useState(0);

  const placements = PLACEMENT_MAP[position];

  useEffect(() => {
    // Try fetching a real banner for any of the placements for this position
    const fetchBanners = async () => {
      try {
        const results = await Promise.all(
          placements.map(p =>
            fetch(`/api/banners?placement=${p}`)
              .then(r => r.ok ? r.json() : { banners: [] })
              .catch(() => ({ banners: [] }))
          )
        );

        // Flatten all banners from all placements, cap at 12
        const allBanners: BannerData[] = results
          .flatMap((r: any) => r.banners || [])
          .slice(0, 12);

        if (allBanners.length > 0) {
          setPool(allBanners);
          setBanner(allBanners[0]);
        }
      } catch {
        // silently fail — fall back to CTA
      } finally {
        setLoaded(true);
      }
    };

    fetchBanners();
  }, [position]);

  // Rotate every 5 minutes
  useEffect(() => {
    if (pool.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(prev => {
        const next = (prev + 1) % pool.length;
        setBanner(pool[next]);
        return next;
      });
    }, ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, [pool]);

  const handleClick = useCallback((bannerId: string) => {
    fetch('/api/banners/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerId }),
    }).catch(() => {});
  }, []);

  // If we have a real paid banner, show it
  if (loaded && banner) {
    const bannerContent = (
      <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-[10px] text-white/70 uppercase tracking-wider">
          <Megaphone className="w-3 h-3" />Sponsored
        </div>
        <div className={`relative w-full bg-gray-800 ${type === 'vertical' ? 'aspect-[3/4]' : 'aspect-[16/3] sm:aspect-[20/3]'}`}>
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>
    );

    if (banner.linkUrl) {
      return (
        <a
          href={banner.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleClick(banner.id)}
          className={`block ${className}`}
        >
          {bannerContent}
        </a>
      );
    }

    return bannerContent;
  }

  // Fall back to "Advertise with Freezone" CTA
  if (type === 'horizontal') {
    return (
      <Link href="/advertise" className={`block w-full group ${className}`}>
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-trini-red/90 via-trini-black to-trini-red/90 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between px-6 py-9 sm:py-12">
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

  // Vertical fallback
  return (
    <div className={`hidden lg:block ${className}`}>
      <Link href="/advertise" className="block group">
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-trini-red/90 via-trini-black to-trini-red/90 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow p-5">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-trini-gold/20 rounded-xl flex items-center justify-center mb-3">
              <Megaphone className="w-6 h-6 text-trini-gold" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Advertise with Freezone</h3>
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
