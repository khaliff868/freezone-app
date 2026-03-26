// Home Page - Marketplace with Multiple Content Sections

import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Sparkles, TrendingUp, RefreshCcw, ShoppingBag, ArrowRight, Tag, Clock, Users, Activity, Zap, Heart, Grid3X3, Eye, Star, MapPin } from 'lucide-react';
import AdBanner from '@/components/shared/ad-banner';
import { ListingCard } from '@/components/shared/listing-card';

const CATEGORIES_DATA: Record<string, { emoji: string; color: string }> = {
  'Swaps': { emoji: '🔄', color: 'from-tropical-purple to-caribbean-ocean' },
  'Free Items': { emoji: '🎁', color: 'from-caribbean-green to-tropical-lime' },
  'Beauty & Personal Care': { emoji: '💄', color: 'from-tropical-pink to-tropical-coral' },
  'Electronics': { emoji: '📱', color: 'from-caribbean-teal to-caribbean-ocean' },
  'Vehicles': { emoji: '🚗', color: 'from-trini-red to-tropical-coral' },
  'Auto Parts & Accessories': { emoji: '🔧', color: 'from-gray-600 to-gray-800' },
  'House & Land': { emoji: '🏠', color: 'from-trini-gold to-tropical-orange' },
  'House & Land - Land': { emoji: '🏡', color: 'from-trini-gold to-tropical-orange' },
  'House & Land - House For Sale': { emoji: '🏠', color: 'from-trini-gold to-tropical-orange' },
  'House & Land - House For Rent': { emoji: '🔑', color: 'from-trini-gold to-tropical-orange' },
  'Construction Materials': { emoji: '🧱', color: 'from-tropical-orange to-trini-red' },
  'Home & Garden': { emoji: '🏡', color: 'from-caribbean-green to-tropical-lime' },
  'Furniture': { emoji: '🪑', color: 'from-tropical-coral to-trini-gold' },
  'Appliances': { emoji: '🍳', color: 'from-caribbean-ocean to-caribbean-teal' },
  'Fashion': { emoji: '👗', color: 'from-tropical-pink to-tropical-purple' },
  'Sports & Outdoors': { emoji: '⚽', color: 'from-tropical-orange to-trini-gold' },
  'Books & Education': { emoji: '📚', color: 'from-tropical-purple to-caribbean-ocean' },
  'Kids & Baby': { emoji: '👶', color: 'from-tropical-coral to-tropical-pink' },
  'Services': { emoji: '🛠️', color: 'from-caribbean-ocean to-caribbean-teal' },
  'Food & Catering': { emoji: '🍽️', color: 'from-trini-red to-tropical-coral' },
  'Business & Industrial': { emoji: '🏭', color: 'from-gray-700 to-gray-900' },
  'Events & Tickets': { emoji: '🎫', color: 'from-tropical-pink to-tropical-purple' },
  'Pets & Livestock': { emoji: '🐾', color: 'from-caribbean-green to-caribbean-teal' },
  'Art & Collectibles': { emoji: '🎨', color: 'from-tropical-coral to-tropical-pink' },
  'Other': { emoji: '📦', color: 'from-gray-500 to-gray-600' },
};

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
  createdAt: Date;
  user: { id: string; name: string; tier: string; verified: boolean };
};

export default async function HomePage() {
  const allListings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    include: { user: { select: { id: true, name: true, tier: true, verified: true } } },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 80,
  });

  const totalListings = allListings.length > 0 ? await prisma.listing.count({ where: { status: 'ACTIVE' } }) : 0;
  const totalUsers = await prisma.user.count();
  const totalSwaps = await prisma.swapOffer.count({ where: { status: 'COMPLETED' } });

  // Featured: exactly 6 visible, max 12 in pool
  const featuredPool = allListings.filter(l => l.featured).slice(0, 12);
  const featuredListings = featuredPool.slice(0, 6);
  if (featuredListings.length < 6) {
    const neededIds = new Set(featuredListings.map(l => l.id));
    const additional = allListings.filter(l => !neededIds.has(l.id)).slice(0, 6 - featuredListings.length);
    featuredListings.push(...additional);
  }

  const latestListings = allListings.slice(0, 10);

  const swapListings = allListings
    .filter(l => l.listingType === 'SWAP' || l.listingType === 'BOTH')
    .slice(0, 10);
  if (swapListings.length < 10) {
    const swapIds = new Set(swapListings.map(l => l.id));
    const additional = allListings.filter(l => !swapIds.has(l.id)).slice(0, 10 - swapListings.length);
    swapListings.push(...additional);
  }

  const trendingListings = [...allListings]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 10);

  const shuffled = [...allListings].sort(() => Math.random() - 0.5);
  const recommendedListings = shuffled.slice(0, 10);

  const categoryMap: Record<string, number> = {};
  allListings.forEach(l => {
    const cat = l.category.startsWith('House & Land') ? 'House & Land' : l.category;
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const popularCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      count,
      emoji: CATEGORIES_DATA[name]?.emoji || '📦',
      color: CATEGORIES_DATA[name]?.color || 'from-gray-500 to-gray-600',
    }));

  const recentActivity = allListings.slice(0, 6).map(l => ({
    type: 'new_listing',
    message: `New listing posted in ${l.category}`,
    timestamp: l.createdAt,
  }));

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_listing': return <ShoppingBag className="w-4 h-4 text-caribbean-teal" />;
      case 'swap_offer': return <RefreshCcw className="w-4 h-4 text-tropical-purple" />;
      case 'new_member': return <Users className="w-4 h-4 text-trini-gold" />;
      default: return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-trini-red via-trini-black to-trini-red py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-trini-red to-tropical-orange flex items-center justify-center shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
              Freezone <span className="text-trini-gold">Sell</span><span className="text-white">/</span><span className="text-trini-gold">Swap</span><span className="text-white"> or Free</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Trinidad & Tobago&apos;s premier marketplace for swapping and selling. Join our community today! 🇹🇹
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard/listings/create" className="px-8 py-4 bg-gradient-to-r from-trini-gold to-tropical-orange text-trini-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />Create Listing
              </Link>
              <Link href="/dashboard" className="px-8 py-4 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition border border-white/30 shadow-lg flex items-center gap-2">
                My Dashboard<ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="-mt-8 relative z-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-6 border-l-4 border-caribbean-teal card-hover">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-caribbean-teal to-caribbean-ocean rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div><p className="text-3xl font-bold text-gray-900 dark:text-white">{totalListings}</p><p className="text-sm text-gray-600 dark:text-gray-400">Active Listings</p></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-6 border-l-4 border-trini-gold card-hover">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-trini-gold to-tropical-orange rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div><p className="text-3xl font-bold text-gray-900 dark:text-white">{totalUsers}</p><p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-6 border-l-4 border-tropical-purple card-hover">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-tropical-purple to-tropical-pink rounded-xl flex items-center justify-center">
                  <RefreshCcw className="w-7 h-7 text-white" />
                </div>
                <div><p className="text-3xl font-bold text-gray-900 dark:text-white">{totalSwaps}</p><p className="text-sm text-gray-600 dark:text-gray-400">Successful Swaps</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banner - Top */}
      <section className="pt-12 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdBanner position="top" type="horizontal" />
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:hidden mb-6">
          <AdBanner position="left" type="horizontal" />
        </div>

        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-48 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <AdBanner position="left" type="vertical" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">

            {/* Featured Listings — 6 cards, 3-col grid (larger cards) */}
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
                <Link href="/browse" className="text-trini-red hover:text-trini-red/80 font-semibold flex items-center gap-1">View All<ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            </section>

            {/* Latest Listings */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-caribbean-teal to-caribbean-ocean rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest Listings</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fresh items just posted</p>
                  </div>
                </div>
                <Link href="/browse?sort=newest" className="text-trini-red hover:text-trini-red/80 font-semibold flex items-center gap-1">View All<ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            </section>

            {/* Ad Banner - Middle */}
            <section className="mb-12">
              <AdBanner position="middle" type="horizontal" />
            </section>

            {/* Suggested Swap Matches */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-tropical-purple to-tropical-pink rounded-xl flex items-center justify-center">
                    <RefreshCcw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Suggested Swap Matches</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Items available for swapping</p>
                  </div>
                </div>
                <Link href="/browse?type=SWAP" className="text-trini-red hover:text-trini-red/80 font-semibold flex items-center gap-1">View All<ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {swapListings.map((listing) => <ListingCard key={listing.id} listing={listing} showSwapButton={true} />)}
              </div>
            </section>

            {/* Trending Listings */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-trini-red to-tropical-coral rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Listings</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Most viewed items right now</p>
                  </div>
                </div>
                <Link href="/browse?sort=popular" className="text-trini-red hover:text-trini-red/80 font-semibold flex items-center gap-1">View All<ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            </section>

            {/* Recommended For You */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-caribbean-green to-tropical-lime rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended For You</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Discover items you might like</p>
                  </div>
                </div>
                <Link href="/browse" className="text-trini-red hover:text-trini-red/80 font-semibold flex items-center gap-1">View All<ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 flex-shrink-0 hidden xl:block space-y-6">
            <AdBanner position="right" type="vertical" />
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Grid3X3 className="w-5 h-5 text-trini-gold" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Popular Categories</h3>
              </div>
              <div className="space-y-2">
                {popularCategories.map((cat) => (
                  <Link key={cat.name} href={`/browse?category=${encodeURIComponent(cat.name)}`} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition group">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 bg-gradient-to-br ${cat.color} rounded-lg flex items-center justify-center text-sm`}>{cat.emoji}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-trini-red transition">{cat.name}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-gray-600 dark:text-gray-300">{cat.count}</span>
                  </Link>
                ))}
              </div>
              <Link href="/browse" className="mt-4 block text-center text-sm text-trini-red hover:text-trini-red/80 font-semibold">View All Categories →</Link>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-caribbean-teal" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-white/5 last:border-0 last:pb-0">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile right sidebar */}
      <div className="xl:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <AdBanner position="right" type="horizontal" />
      </div>

      {/* Browse Categories */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Browse Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Object.entries(CATEGORIES_DATA).map(([name, data]) => (
              <Link key={name} href={`/browse?category=${encodeURIComponent(name)}`} className={`bg-gradient-to-br ${data.color} p-4 rounded-2xl text-center cursor-pointer hover:scale-105 transition-transform shadow-lg`}>
                <span className="text-3xl mb-1 block">{data.emoji}</span>
                <span className="text-white font-semibold text-sm line-clamp-2">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-trini-black via-trini-red to-trini-black py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/80 text-sm">© 2026 Freezone Sell/Swap or Free. Made with <span className="text-trini-red">❤️</span> in Trinidad & Tobago 🇹🇹</p>
        </div>
      </footer>
    </div>
  );
}
