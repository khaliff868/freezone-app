'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Megaphone } from 'lucide-react';

const MAX_POOL = 12;
const ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface BannerAdData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
}

interface BannerAdProps {
  placement: string;
  className?: string;
}

export default function BannerAd({ placement, className = '' }: BannerAdProps) {
  const [pool, setPool] = useState<BannerAdData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Fetch banners once, cap pool at MAX_POOL
  useEffect(() => {
    fetch(`/api/banners?placement=${placement}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.banners && data.banners.length > 0) {
          setPool(data.banners.slice(0, MAX_POOL));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [placement]);

  // Rotate to next banner every 5 minutes
  useEffect(() => {
    if (pool.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % pool.length);
    }, ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, [pool.length]);

  const handleClick = useCallback((bannerId: string) => {
    fetch('/api/banners/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerId }),
    }).catch(() => {});
  }, []);

  if (!loaded || pool.length === 0) return null;

  const banner = pool[currentIndex];

  const bannerContent = (
    <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-[10px] text-white/70 uppercase tracking-wider">
        <Megaphone className="w-3 h-3" />
        Sponsored
      </div>
      <div className="relative w-full aspect-[8/3] sm:aspect-[10/3] bg-gray-800">
        <Image
          src={banner.imageUrl}
          alt={banner.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
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
        className="block"
      >
        {bannerContent}
      </a>
    );
  }

  return bannerContent;
}
