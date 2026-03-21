'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MapPin, Eye, Package, Star, RefreshCcw } from 'lucide-react';

type ListingCardProps = {
  listing: {
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
  };
  showSwapButton?: boolean;
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

export function ListingCard({ listing, showSwapButton = false }: ListingCardProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();

  const handleClick = () => {
    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=/dashboard/listings/${listing.id}`);
    } else {
      router.push(`/dashboard/listings/${listing.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg overflow-hidden card-hover border border-gray-100 dark:border-white/10 cursor-pointer"
    >
      <div className="h-44 bg-white border-b border-gray-100 dark:border-white/10 relative flex items-center justify-center">
        {listing.images && listing.images[0] ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Package className="w-10 h-10 text-gray-400" />
        )}
        {listing.featuredStatus === 'ACTIVE' && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-trini-gold text-trini-black text-xs font-bold rounded-full flex items-center gap-1 pulse-badge">
            <Star className="w-3 h-3" />Featured
          </div>
        )}
        <div className={`absolute top-3 right-3 px-3 py-1 ${getTypeColor(listing.listingType)} text-xs font-bold rounded-full`}>
          {listing.listingType}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-trini-red transition">{listing.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{listing.description}</p>
        <div className="mt-3">
          {listing.price ? (
            <div><span className="text-xl font-bold text-trini-red">${listing.price}</span><span className="text-sm text-gray-500 dark:text-gray-400 ml-1">TTD</span></div>
          ) : (
            <span className="text-lg font-semibold text-tropical-purple">{listing.listingType === 'FREE' ? 'Free' : 'Swap Only'}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <MapPin className="w-3 h-3" /><span>{listing.location}</span><span>•</span><Eye className="w-3 h-3" /><span>{listing.views || 0} views</span>
        </div>
        {showSwapButton && (listing.listingType === 'SWAP' || listing.listingType === 'BOTH') && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-tropical-purple/10 text-tropical-purple text-xs font-semibold rounded-full">
              <RefreshCcw className="w-3 h-3" />Offer Swap
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
