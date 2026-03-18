'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Search,
  Filter,
  Grid,
  List,
  MapPin,
  Tag,
  Package,
  ChevronDown,
  X,
  Eye,
  Star,
  RefreshCw,
  ShoppingBag,
  Heart,
  Loader2,
  Clock,
  Zap,
  Activity,
  Users,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import BannerAd from '@/components/shared/banner-ad';
import AdBanner from '@/components/shared/ad-banner';

interface SearchSuggestion {
  id: string;
  title: string;
  category: string;
  price: number | null;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  location: string;
  price: number | null;
  listingType: 'SELL' | 'SWAP' | 'BOTH';
  images: string[];
  views: number;
  featured: boolean;
  boosted: boolean;
  featuredStatus?: 'ACTIVE' | 'NONE';
  user: { id: string; name: string; avatar: string | null; location: string | null };
  createdAt: string;
}

interface SearchResult {
  listings: Listing[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  filters: {
    categories: { name: string; count: number }[];
    locations: { name: string; count: number }[];
  };
}

interface HomepageSectionsData {
  featured: Listing[];
  trending: Listing[];
  swapMatches: Listing[];
  recentActivity: { type: string; message: string; timestamp: string }[];
}

const CATEGORIES = [
  { name: 'Swaps', emoji: '🔄', color: 'from-tropical-purple to-caribbean-ocean' },
  { name: 'Free Items', emoji: '🎁', color: 'from-caribbean-green to-tropical-lime' },
  { name: 'Beauty & Personal Care', emoji: '💄', color: 'from-tropical-pink to-tropical-coral' },
  { name: 'Electronics', emoji: '📱', color: 'from-caribbean-teal to-ocean-blue' },
  { name: 'Vehicles', emoji: '🚗', color: 'from-trini-red to-tropical-orange' },
  { name: 'Auto Parts & Accessories', emoji: '🔧', color: 'from-gray-600 to-gray-800' },
  { name: 'Real Estate', emoji: '🏠', color: 'from-trini-gold to-tropical-orange' },
  { name: 'Construction Materials', emoji: '🧱', color: 'from-tropical-orange to-trini-red' },
  { name: 'Home & Garden', emoji: '🏡', color: 'from-island-green to-palm-green' },
  { name: 'Furniture', emoji: '🪑', color: 'from-tropical-coral to-trini-gold' },
  { name: 'Appliances', emoji: '🍳', color: 'from-caribbean-ocean to-caribbean-teal' },
  { name: 'Fashion', emoji: '👗', color: 'from-sunset-pink to-tropical-pink' },
  { name: 'Sports & Outdoors', emoji: '⚽', color: 'from-trini-gold to-tropical-yellow' },
  { name: 'Books & Education', emoji: '📚', color: 'from-tropical-purple to-caribbean-ocean' },
  { name: 'Kids & Baby', emoji: '👶', color: 'from-tropical-purple to-sunset-pink' },
  { name: 'Services', emoji: '🛠️', color: 'from-ocean-blue to-caribbean-teal' },
  { name: 'Food & Catering', emoji: '🍽️', color: 'from-trini-red to-tropical-coral' },
  { name: 'Business & Industrial', emoji: '🏭', color: 'from-gray-700 to-gray-900' },
  { name: 'Events & Tickets', emoji: '🎫', color: 'from-tropical-pink to-tropical-purple' },
  { name: 'Pets & Livestock', emoji: '🐾', color: 'from-caribbean-green to-caribbean-teal' },
  { name: 'Art & Collectibles', emoji: '🎨', color: 'from-tropical-coral to-tropical-pink' },
  { name: 'Other', emoji: '📦', color: 'from-gray-500 to-gray-600' },
];

const CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'];
const LISTING_TYPES = ['SELL', 'SWAP', 'BOTH'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

function BrowsePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession() || {};

  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [togglingWishlist, setTogglingWishlist] = useState<string | null>(null);

  const [sectionsData, setSectionsData] = useState<HomepageSectionsData | null>(null);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [listingType, setListingType] = useState(searchParams.get('type') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/homepage/sections');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSectionsData({
              featured: data.data.featured || [],
              trending: data.data.trending || [],
              swapMatches: data.data.swapMatches || [],
              recentActivity: data.data.recentActivity || [],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
      } finally {
        setSectionsLoading(false);
      }
    };
    fetchSections();
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `/api/listings/search?q=${encodeURIComponent(searchQuery)}&limit=5`,
        { signal: abortControllerRef.current.signal }
      );
      if (res.ok) {
        const data = await res.json();
        const suggestionData: SearchSuggestion[] = data.listings.map((l: Listing) => ({
          id: l.id,
          title: l.title,
          category: l.category,
          price: l.price,
        }));
        setSuggestions(suggestionData);
        setShowSuggestions(true);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching suggestions:', error);
      }
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    setPage(1);
    setTimeout(() => { fetchResults(); }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSuggestions(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category) params.set('category', category);
      if (listingType) params.set('type', listingType);
      if (condition) params.set('condition', condition);
      if (location) params.set('location', location);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      params.set('sort', sortBy);
      params.set('page', page.toString());
      const res = await fetch(`/api/listings/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  }, [query, category, listingType, condition, location, minPrice, maxPrice, sortBy, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          const ids = new Set<string>(data.wishlist?.map((item: any) => item.listing.id as string) || []);
          setWishlistedIds(ids);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      }
    };
    fetchWishlist();
  }, [session?.user?.id]);

  const toggleWishlist = async (e: React.MouseEvent, listingId: string, sellerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user?.id) { toast.error('Please login to save items'); return; }
    if (session.user.id === sellerId) { toast.error("You can't wishlist your own listing"); return; }
    setTogglingWishlist(listingId);
    try {
      if (wishlistedIds.has(listingId)) {
        const res = await fetch(`/api/wishlist?listingId=${listingId}`, { method: 'DELETE' });
        if (res.ok) {
          setWishlistedIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });
          toast.success('Removed from wishlist');
        }
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        });
        if (res.ok) {
          setWishlistedIds(prev => new Set([...prev, listingId]));
          toast.success('Added to wishlist');
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setTogglingWishlist(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setPage(1);
    fetchResults();
  };

  const clearFilters = () => {
    setQuery(''); setCategory(''); setListingType(''); setCondition('');
    setLocation(''); setMinPrice(''); setMaxPrice(''); setSortBy('newest'); setPage(1);
  };

  const getCategoryStyle = (cat: string) => {
    const found = CATEGORIES.find((c) => c.name === cat);
    return found ? found.color : 'from-gray-500 to-gray-600';
  };

  const getCategoryEmoji = (cat: string) => {
    const found = CATEGORIES.find((c) => c.name === cat);
    return found ? found.emoji : '📦';
  };

  const activeFiltersCount = [category, listingType, condition, location, minPrice, maxPrice].filter(Boolean).length;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_listing': return <ShoppingBag className="w-4 h-4 text-caribbean-teal" />;
      case 'swap_offer': return <RefreshCw className="w-4 h-4 text-tropical-purple" />;
      case 'new_member': return <Users className="w-4 h-4 text-trini-gold" />;
      default: return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const CompactListingCard = ({ listing, showSwapButton = false }: { listing: Listing; showSwapButton?: boolean }) => (
    <Link
      href={`/dashboard/listings/${listing.id}`}
      className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition group"
    >
      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-white/10 flex-shrink-0 overflow-hidden">
        {listing.images[0] ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-trini-red transition">{listing.title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{listing.location}</p>
        <div className="flex items-center justify-between mt-1">
          {listing.price ? (
            <span className="text-sm font-bold text-trini-red">${listing.price}</span>
          ) : (
            <span className="text-xs font-semibold text-tropical-purple">Swap</span>
          )}
          {showSwapButton && (listing.listingType === 'SWAP' || listing.listingType === 'BOTH') && (
            <span className="text-xs px-2 py-0.5 bg-tropical-purple/10 text-tropical-purple rounded-full">Swap</span>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-gradient-to-r from-trini-red via-trini-black to-trini-red py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Listings 🇹🇹</h1>
          <p className="text-gray-200">Find what you&apos;re looking for in Trinidad & Tobago</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        <AdBanner position="top" type="horizontal" />
      </div>
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <BannerAd placement="browse_top" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="lg:hidden mb-6 space-y-4">
          <AdBanner position="left" type="horizontal" />
        </div>

        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white dark:bg-white/10 rounded-2xl p-5 sticky top-24 border border-gray-200 dark:border-transparent shadow-lg dark:shadow-none">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-trini-gold" />
                Categories
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => { setCategory(''); setPage(1); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                    category === '' ? 'bg-trini-gold text-black' : 'text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/15'
                  }`}
                >
                  <span>📋</span>
                  <span>All Categories</span>
                  {results?.filters?.categories && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${category === '' ? 'bg-black/20 text-black' : 'bg-gray-200 dark:bg-white/20 text-gray-600 dark:text-gray-200'}`}>
                      {results.pagination.total}
                    </span>
                  )}
                </button>
                {CATEGORIES.map((cat) => {
                  const count = results?.filters?.categories?.find(c => c.name === cat.name)?.count || 0;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => { setCategory(cat.name); setPage(1); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                        category === cat.name ? 'bg-trini-gold text-black' : 'text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/15'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.name}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${category === cat.name ? 'bg-black/20 text-black' : 'bg-gray-200 dark:bg-white/20 text-gray-600 dark:text-gray-200'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6">
                <AdBanner position="left" type="vertical" />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-6" ref={searchContainerRef}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => query.trim() && suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Search for items, categories, or locations..."
                  className="w-full pl-12 pr-28 py-3 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none focus:border-trini-gold focus:ring-2 focus:ring-trini-gold/20 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-1.5 bg-gradient-to-r from-trini-red to-tropical-orange text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Search
                </button>
                {showSuggestions && (
                  <div className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md w-full mt-1 z-50 overflow-hidden">
                    {loadingSuggestions ? (
                      <div className="px-4 py-3 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <div className="text-gray-800 dark:text-white font-medium truncate">{suggestion.title}</div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">{suggestion.category}</span>
                            {suggestion.price !== null && (
                              <span className="text-trini-red font-semibold">${suggestion.price.toLocaleString()}</span>
                            )}
                          </div>
                        </button>
                      ))
                    ) : query.trim() ? (
                      <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">No listings found</div>
                    ) : null}
                  </div>
                )}
              </form>
            </div>

            <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl p-3 mb-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min Price" className="w-[110px] px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-trini-gold/50 focus:border-trini-gold" />
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max Price" className="w-[110px] px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-trini-gold/50 focus:border-trini-gold" />
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="min-w-[160px] px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-trini-gold/50 focus:border-trini-gold">
                  <option value="" className="bg-white dark:bg-gray-800">Any Condition</option>
                  <option value="NEW" className="bg-white dark:bg-gray-800">Brand New</option>
                  <option value="LIKE_NEW" className="bg-white dark:bg-gray-800">Like New</option>
                  <option value="GOOD" className="bg-white dark:bg-gray-800">Good</option>
                  <option value="FAIR" className="bg-white dark:bg-gray-800">Fair</option>
                  <option value="POOR" className="bg-white dark:bg-gray-800">Used</option>
                </select>
                <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="min-w-[160px] px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-trini-gold/50 focus:border-trini-gold">
                  <option value="" className="bg-white dark:bg-gray-800">All Types</option>
                  <option value="SELL" className="bg-white dark:bg-gray-800">Sell</option>
                  <option value="SWAP" className="bg-white dark:bg-gray-800">Swap</option>
                  <option value="BOTH" className="bg-white dark:bg-gray-800">Free</option>
                </select>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="min-w-[160px] px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-trini-gold/50 focus:border-trini-gold">
                  <option value="" className="bg-white dark:bg-gray-800">Any Location</option>
                  <option value="Port of Spain" className="bg-white dark:bg-gray-800">Port of Spain</option>
                  <option value="San Fernando" className="bg-white dark:bg-gray-800">San Fernando</option>
                  <option value="Chaguanas" className="bg-white dark:bg-gray-800">Chaguanas</option>
                  <option value="Arima" className="bg-white dark:bg-gray-800">Arima</option>
                  <option value="Tobago" className="bg-white dark:bg-gray-800">Tobago</option>
                  <option value="Couva" className="bg-white dark:bg-gray-800">Couva</option>
                  <option value="Sangre Grande" className="bg-white dark:bg-gray-800">Sangre Grande</option>
                  <option value="Tunapuna" className="bg-white dark:bg-gray-800">Tunapuna</option>
                  <option value="Marabella" className="bg-white dark:bg-gray-800">Marabella</option>
                  <option value="Point Fortin" className="bg-white dark:bg-gray-800">Point Fortin</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="min-w-[150px] px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-trini-gold/50 focus:border-trini-gold">
                  <option value="newest" className="bg-white dark:bg-gray-800">Newest First</option>
                  <option value="oldest" className="bg-white dark:bg-gray-800">Oldest First</option>
                </select>
                <div className="flex bg-gray-100 dark:bg-white/10 rounded-lg p-1">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-trini-gold text-trini-black' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`} title="Grid View"><Grid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-trini-gold text-trini-black' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`} title="List View"><List className="w-4 h-4" /></button>
                </div>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="ml-auto px-4 py-2 bg-trini-red/10 dark:bg-trini-red/20 text-trini-red rounded-lg text-sm font-medium hover:bg-trini-red/20 dark:hover:bg-trini-red/30 transition-colors flex items-center gap-2">
                    <X className="w-4 h-4" />Clear All Filters
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span>{loading ? 'Searching...' : `${results?.pagination.total || 0} listings found`}</span>
              {results && results.listings.filter(l => l.images && l.images.length > 0).length > 0 && (
                <span>{results.listings.filter(l => l.images && l.images.length > 0).length} with photos</span>
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {category ? `${getCategoryEmoji(category)} ${category}` : '📋 Latest Listings'}
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-caribbean-teal border-t-transparent"></div>
              </div>
            ) : results?.listings.length === 0 ? (
              <div className="bg-white/10 rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No listings found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="px-6 py-3 bg-gradient-to-r from-caribbean-teal to-ocean-blue text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {results?.listings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/dashboard/listings/${listing.id}`}
                      className={`group bg-white dark:bg-white/10 rounded-xl overflow-hidden border border-gray-200 dark:border-transparent hover:border-caribbean-teal/50 shadow-sm hover:shadow-lg transition-all ${viewMode === 'list' ? 'flex' : ''}`}
                    >
                      <div className={`relative bg-white border-b border-gray-100 dark:border-white/10 ${viewMode === 'list' ? 'w-48 h-44 flex-shrink-0' : 'h-44'} flex items-center justify-center`}>
                        {listing.images[0] ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <Package className="w-10 h-10 text-gray-400" />
                        )}
                        {listing.featuredStatus === "ACTIVE" && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-trini-gold to-tropical-orange text-white text-xs font-semibold rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" fill="currentColor" />Featured
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white">
                            {listing.listingType === 'SELL' && <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />Sell</span>}
                            {listing.listingType === 'SWAP' && <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />Swap</span>}
                            {listing.listingType === 'BOTH' && <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /><RefreshCw className="w-3 h-3" /></span>}
                          </span>
                          {session?.user?.id && session.user.id !== listing.user.id && (
                            <button
                              onClick={(e) => toggleWishlist(e, listing.id, listing.user.id)}
                              disabled={togglingWishlist === listing.id}
                              className={`p-1.5 rounded-full backdrop-blur-sm transition-colors ${wishlistedIds.has(listing.id) ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-black/50 text-white hover:bg-black/70'}`}
                            >
                              {togglingWishlist === listing.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${wishlistedIds.has(listing.id) ? 'fill-current' : ''}`} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-caribbean-teal transition-colors">{listing.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{listing.description}</p>
                        {listing.price ? (
                          <p className="text-lg font-bold text-trini-red mb-2">${listing.price.toLocaleString()} TTD</p>
                        ) : (
                          <p className="text-lg font-semibold text-tropical-purple mb-2">Swap Only</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.location}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.views} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {results && results.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white/10 rounded-lg text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors">Previous</button>
                    <span className="px-4 py-2 text-gray-500 dark:text-gray-400">Page {page} of {results.pagination.totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(results.pagination.totalPages, p + 1))} disabled={page === results.pagination.totalPages} className="px-4 py-2 bg-white/10 rounded-lg text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors">Next</button>
                  </div>
                )}
              </>
            )}

            <div className="mt-8"><AdBanner position="middle" type="horizontal" /></div>
            <div className="mt-6"><BannerAd placement="browse_mid" /></div>
          </div>

          <div className="w-72 flex-shrink-0 hidden xl:block space-y-6">
            <AdBanner position="right" type="vertical" />
            <BannerAd placement="browse_sidebar" />
            {!sectionsLoading && sectionsData?.featured && sectionsData.featured.length > 0 && (
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4"><Star className="w-5 h-5 text-trini-gold" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Featured</h3></div>
                <div className="space-y-2">{sectionsData.featured.slice(0, 4).map((listing) => <CompactListingCard key={listing.id} listing={listing} />)}</div>
                <Link href="/" className="mt-4 block text-center text-sm text-trini-red hover:text-trini-red/80 font-semibold">View More →</Link>
              </div>
            )}
            {!sectionsLoading && sectionsData?.trending && sectionsData.trending.length > 0 && (
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-trini-red" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Trending</h3></div>
                <div className="space-y-2">{sectionsData.trending.slice(0, 4).map((listing) => <CompactListingCard key={listing.id} listing={listing} />)}</div>
              </div>
            )}
            {!sectionsLoading && sectionsData?.swapMatches && sectionsData.swapMatches.length > 0 && (
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4"><RefreshCw className="w-5 h-5 text-tropical-purple" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Swap Matches</h3></div>
                <div className="space-y-2">{sectionsData.swapMatches.slice(0, 4).map((listing) => <CompactListingCard key={listing.id} listing={listing} showSwapButton={true} />)}</div>
                <Link href="/?section=swaps" className="mt-4 block text-center text-sm text-tropical-purple hover:text-tropical-purple/80 font-semibold">View All Swaps →</Link>
              </div>
            )}
            {!sectionsLoading && sectionsData?.recentActivity && sectionsData.recentActivity.length > 0 && (
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4"><Activity className="w-5 h-5 text-caribbean-teal" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3></div>
                <div className="space-y-3">
                  {sectionsData.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-white/5 last:border-0 last:pb-0">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{activity.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <BannerAd placement="browse_sidebar_bottom" />
          </div>
        </div>

        <div className="xl:hidden mt-6"><AdBanner position="right" type="horizontal" /></div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-caribbean-teal border-t-transparent"></div>
      </div>
    }>
      <BrowsePageInner />
    </Suspense>
  );
}
