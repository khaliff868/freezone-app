'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';

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
  const [banners, setBanners] = useState<BannerAdData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/banners?placement=${placement}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.banners && data.banners.length > 0) {
          setBanners(data.banners);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [placement]);

  // Auto-rotate banners every 6 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleClick = useCallback((bannerId: string) => {
    fetch(`/api/banners/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerId }),
    }).catch(() => {});
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (!loaded || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const bannerContent = (
    <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
      {/* Label */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-[10px] text-white/70 uppercase tracking-wider">
        <Megaphone className="w-3 h-3" />
        Sponsored
      </div>

      {/* Banner Image */}
      <div className="relative w-full aspect-[4/1] sm:aspect-[5/1] bg-gray-800">
        <Image
          src={currentBanner.imageUrl}
          alt={currentBanner.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-white w-4'
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (currentBanner.linkUrl) {
    return (
      <a
        href={currentBanner.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleClick(currentBanner.id)}
        className="block"
      >
        {bannerContent}
      </a>
    );
  }

  return bannerContent;
}
