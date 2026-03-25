'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, MapPin, Eye, Package, RefreshCcw } from 'lucide-react';
import {
  FEATURED_LISTING_VISIBLE_COUNT,
  FEATURED_LISTING_ROTATION_INTERVAL,
} from '@/lib/constants';

type ListingWithUser = {
  id: string;
  title: string;
  description: string;
  category: string;
  listingType: string;
  price: number | null;
  location: string;
  images: string[];
  views: number;
  featured: boolean;
  featuredStatus?: string;
  createdAt: string;
  user: { id: string; name: string; verified: boolean };
};

const isFreeListing = (listing: ListingWithUser) => {
  return listing.listingType === 'FREE' || listing.category === 'Free Items' || (listing.price === 0 && listing.listingType !== 'SWAP');
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'SELL': return 'bg-caribbean-ocean text-white';
    case 'SWAP': return 'bg-tropical-purple text-white';
    case 'BOTH': return 'bg-gradient-to-r from-caribbean-ocean to-tropical-purple text-white';
    case 'FREE': return 'bg-caribbean-green text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const ListingCard = ({ listing }: { listing: ListingWithUser }) => (
  <Link
    href={`/dashboard/listings/${listing.id}`}
    className="group bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg overflow-hidden card-hover border border-gray-100 dark:border-white/10"
  >
    <div className="h-56 bg-white border-b border-gray-100 dark:border-white/10 relative flex items-center justify-center">
      {listing.images && listing.images[0] ? (
        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <Package className="w-10 h-10 text-gray-400" />
      )}
      {listing.featuredStatus === "ACTIVE" && (
        <div className="absolute top-3 left-3 px-3 py-1 bg-trini-gold text-trini-black text-xs font-bold rounded-full flex items-center gap-1 pulse-badge">
          <Star className="w-3 h-3" />Featured
        </div>
      )}
      <div className={`absolute top-3 right-3 px-3 py-1 ${getTypeColor(listing.listingType)} text-xs font-bold rounded-full`}>
        {listing.listingType}
      </div>
    </div>
    <div className="p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-trini-red transition">{listing.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{listing.description}</p>
      <div className="mt-3">
        {isFreeListing(listing) ? (
          <span className="inline-block px-3 py-1 bg-caribbean-green text-white text-lg font-bold rounded-full">FREE</span>
        ) : listing.price ? (
          <div>
            <span className="text-xl font-bold text-trini-red">${Math.round(listing.price).toLocaleString('en-US')}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">TTD</span>
          </div>
        ) : (
          <span className="text-lg font-semibold text-tropical-purple">Swap Only</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
        <MapPin className="w-3 h-3" /><span>{listing.location}</span><span>•</span><Eye className="w-3 h-3" /><span>{listing.views || 0} views</span>
      </div>
    </div>
  </Link>
);

interface FeaturedListingsSectionProps {
  initialListings?: ListingWithUser[];
}

export default function FeaturedListingsSection({ initialListings = [] }: FeaturedListingsSectionProps) {
  const [allFeaturedListings, setAllFeaturedListings] = useState<ListingWithUser[]>(initialListings);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [loading, setLoading] = useState(!initialListings.length);

  const fetchFeaturedListings = useCallback(async () => {
    try {
      const res = await fetch('/api/featured-listings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.listings) {
          // Cap pool at 12 max for rotation
          setAllFeaturedListings(data.listings.slice(0, 12));
        }
      }
    } catch (error) {
      console.error('Error fetching featured listings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialListings.length) {
      fetchFeaturedListings();
    }
  }, [fetchFeaturedListings, initialListings.length]);

  useEffect(() => {
    if (allFeaturedListings.length <= FEATURED_LISTING_VISIBLE_COUNT) return;
    const rotationInterval = setInterval(() => {
      setCurrentSetIndex((prev) => {
        const totalSets = Math.ceil(allFeaturedListings.length / FEATURED_LISTING_VISIBLE_COUNT);
        return (prev + 1) % totalSets;
      });
    }, FEATURED_LISTING_ROTATION_INTERVAL);
    return () => clearInterval(rotationInterval);
  }, [allFeaturedListings.length]);

  const getVisibleListings = () => {
    if (allFeaturedListings.length === 0) return [];
    const startIndex = currentSetIndex * FEATURED_LISTING_VISIBLE_COUNT;
    const endIndex = startIndex + FEATURED_LISTING_VISIBLE_COUNT;
    const visibleListings = allFeaturedListings.slice(startIndex, endIndex);
    if (visibleListings.length < FEATURED_LISTING_VISIBLE_COUNT && allFeaturedListings.length > FEATURED_LISTING_VISIBLE_COUNT) {
      const remaining = FEATURED_LISTING_VISIBLE_COUNT - visibleListings.length;
      const wrappedListings = allFeaturedListings.slice(0, remaining);
      return [...visibleListings, ...wrappedListings];
    }
    return visibleListings;
  };

  const visibleListings = getVisibleListings();
  const totalSets = Math.ceil(allFeaturedListings.length / FEATURED_LISTING_VISIBLE_COUNT);

  if (loading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-trini-gold to-tropical-orange rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Listings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top picks from our marketplace</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg overflow-hidden animate-pulse">
              <div className="h-56 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-5">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (visibleListings.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-trini-gold to-tropical-orange rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Listings</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Top picks from our marketplace</p>
              {totalSets > 1 && (
                <span className="flex items-center gap-1 text-xs text-trini-gold">
                  <RefreshCcw className="w-3 h-3" />
                  Set {currentSetIndex + 1}/{totalSets}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link href="/browse?featured=true" className="text-trini-red hover:text-trini-red/80 font-semibold flex items-center gap-1">
          View All<ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500">
        {visibleListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      {totalSets > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSets }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSetIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentSetIndex ? 'bg-trini-gold w-6' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`Show set ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
