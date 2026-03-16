'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Heart, Package, MapPin, Trash2, Loader2, HeartOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WishlistItem {
  id: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    description: string;
    price: number | null;
    currency: string;
    images: string[];
    category: string;
    condition: string;
    listingType: string;
    status: string;
    location: string;
    user: {
      id: string;
      name: string;
      location: string | null;
    };
  };
}

const conditionColors: Record<string, string> = {
  NEW: 'bg-green-500',
  LIKE_NEW: 'bg-emerald-500',
  GOOD: 'bg-blue-500',
  FAIR: 'bg-yellow-500',
  POOR: 'bg-red-500',
};

export default function WishlistPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setWishlist(data.wishlist);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        toast.error('Failed to load wishlist');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchWishlist();
    }
  }, [status]);

  const removeFromWishlist = async (listingId: string) => {
    setRemoving(listingId);
    try {
      const res = await fetch(`/api/wishlist?listingId=${listingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setWishlist(prev => prev.filter(item => item.listing.id !== listingId));
        toast.success('Removed from wishlist');
      } else {
        toast.error('Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    } finally {
      setRemoving(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              My Wishlist
              <Badge variant="secondary" className="ml-2">
                {wishlist.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wishlist.length === 0 ? (
              <div className="text-center py-12">
                <HeartOff className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Your wishlist is empty</h3>
                <p className="text-muted-foreground mt-2">
                  Start browsing and save items you like!
                </p>
                <Link href="/browse">
                  <Button className="mt-4">Browse Listings</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlist.map((item) => (
                  <Card
                    key={item.id}
                    className={cn(
                      'overflow-hidden transition-all',
                      item.listing.status !== 'ACTIVE' && 'opacity-60'
                    )}
                  >
                    <div className="relative aspect-video bg-muted">
                      {item.listing.images[0] ? (
                        <Image
                          src={item.listing.images[0]}
                          alt={item.listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      {item.listing.status !== 'ACTIVE' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="destructive">
                            {item.listing.status === 'SOLD' ? 'Sold' : 'Unavailable'}
                          </Badge>
                        </div>
                      )}
                      <Badge
                        className={cn(
                          'absolute top-2 left-2 text-white text-xs',
                          conditionColors[item.listing.condition]
                        )}
                      >
                        {item.listing.condition.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <Link href={`/dashboard/listings/${item.listing.id}`}>
                        <h3 className="font-semibold hover:text-primary transition-colors truncate">
                          {item.listing.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        {item.listing.price ? (
                          <span className="text-primary font-bold">
                            ${item.listing.price.toLocaleString()} {item.listing.currency}
                          </span>
                        ) : (
                          <Badge variant="secondary">Swap Only</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {item.listing.listingType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {item.listing.location}
                      </p>
                      <Link
                        href={`/profile/${item.listing.user.id}`}
                        className="text-xs text-muted-foreground hover:text-primary mt-1 block"
                      >
                        by {item.listing.user.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added {format(new Date(item.createdAt), 'MMM d, yyyy')}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeFromWishlist(item.listing.id)}
                        disabled={removing === item.listing.id}
                      >
                        {removing === item.listing.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
