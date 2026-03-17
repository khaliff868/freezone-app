'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, TrendingUp, RefreshCcw, AlertCircle, Sparkles, MapPin, Tag, Star, Megaphone, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  listingType: string;
  status: string;
  category: string;
  location: string;
  featured: boolean;
  featuredStatus?: 'ACTIVE' | 'NONE';
  featuredStatus?: 'ACTIVE' | 'NONE';
  createdAt: string;
  images?: string[];
  views?: number;
};

export default function DashboardPage() {
  const { data: session } = useSession() || {};
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadListings();
    }
  }, [session]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await apiClient<{ listings: Listing[] }>('/api/listings', {
        params: { userId: session?.user?.id },
      });
      setListings(data.listings || []);
    } catch (error: any) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-200 text-gray-700',
      PENDING_PAYMENT: 'bg-orange-100 text-orange-700 border border-orange-300',
      ACTIVE: 'bg-caribbean-green/20 text-caribbean-green border border-caribbean-green',
      SOLD: 'bg-caribbean-ocean/20 text-caribbean-ocean border border-caribbean-ocean',
      SWAPPED: 'bg-tropical-purple/20 text-tropical-purple border border-tropical-purple',
      REMOVED: 'bg-trini-red/20 text-trini-red border border-trini-red',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      SELL: 'bg-caribbean-ocean text-white',
      SWAP: 'bg-tropical-purple text-white',
      BOTH: 'bg-gradient-to-r from-caribbean-ocean to-tropical-purple text-white',
    };
    return styles[type] || 'bg-gray-500 text-white';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Electronics': 'bg-caribbean-teal',
      'Vehicles': 'bg-trini-red',
      'Home & Garden': 'bg-caribbean-green',
      'Sports & Outdoors': 'bg-tropical-orange',
      'Fashion': 'bg-tropical-pink',
      'Books & Media': 'bg-tropical-purple',
      'Kids & Baby': 'bg-tropical-coral',
      'Services': 'bg-caribbean-ocean',
      'Food & Beverages': 'bg-tropical-lime',
    };
    return colors[category] || 'bg-gray-500';
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Welcome back, <span className="font-semibold text-trini-gold">{session.user.name}</span>!
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-6 border-l-4 border-caribbean-teal card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Listings</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {listings.length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-caribbean-teal to-caribbean-ocean rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-6 border-l-4 border-caribbean-green card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Listings</p>
                <p className="text-3xl font-bold text-caribbean-green mt-2">
                  {listings.filter((l) => l.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-caribbean-green to-tropical-lime rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-6 border-l-4 border-tropical-purple card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-tropical-purple mt-2">
                  {listings.filter((l) => l.status === 'PENDING_PAYMENT').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-tropical-purple to-tropical-pink rounded-xl flex items-center justify-center">
                <RefreshCcw className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-6 border-l-4 border-trini-gold card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Featured</p>
                <p className="text-3xl font-bold text-trini-gold mt-2">
                  {listings.filter((l) => l.featured).length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-trini-gold to-tropical-orange rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href="/dashboard/banners"
            className="flex items-center gap-3 px-5 py-3 bg-gray-100 dark:bg-white/10 border-2 border-tropical-purple/30 rounded-2xl hover:border-tropical-purple/60 hover:bg-gray-200 dark:hover:bg-white/20 transition-all group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-tropical-purple to-tropical-pink rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">My Banner Ads</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Promote your business</p>
            </div>
          </Link>
        </div>

        {/* Listings */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-white/10 bg-gradient-to-r from-trini-red/5 to-trini-gold/5 dark:from-trini-red/10 dark:to-trini-gold/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-trini-red" />
                My Listings
              </h2>
              <Link
                href="/dashboard/listings/create"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-trini-red to-tropical-orange text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Create Listing
              </Link>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-trini-red border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No listings yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Start selling or swapping today!</p>
                <Link
                  href="/dashboard/listings/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-trini-red to-tropical-orange text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/dashboard/listings/${listing.id}`}
                    className="group bg-white dark:bg-gray-700/50 border-2 border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden hover:border-trini-red/30 hover:shadow-xl transition-all"
                  >
                    {/* Image container */}
                    <div className="h-44 bg-white border-b border-gray-100 dark:border-white/10 relative flex items-center justify-center">
                      {listing.images && listing.images[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-gray-400" />
                      )}
                      {listing.featuredStatus === "ACTIVE" && (
                        <div className="absolute top-3 left-3 px-3 py-1 bg-trini-gold text-trini-black text-xs font-bold rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Featured
                        </div>
                      )}
                      <div className={`absolute top-3 right-3 px-3 py-1 ${getTypeBadge(listing.listingType)} text-xs font-bold rounded-full`}>
                        {listing.listingType}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-trini-red transition">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {listing.description}
                      </p>

                      <div className="mt-3">
                        {listing.price ? (
                          <div>
                            <span className="text-xl font-bold text-trini-red">${listing.price}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">TTD</span>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-tropical-purple">Swap Only</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {listing.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {listing.views || 0} views
                        </span>
                        <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(listing.status)}`}>
                          {listing.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}