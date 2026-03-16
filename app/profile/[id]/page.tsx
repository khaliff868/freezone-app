'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  User,
  MapPin,
  Calendar,
  Package,
  ArrowRightLeft,
  CheckCircle,
  Star,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string;
  location: string | null;
  bio: string | null;
  avatar: string | null;
  verified: boolean;
  createdAt: string;
  listings: Array<{
    id: string;
    title: string;
    price: number | null;
    currency: string;
    images: string[];
    category: string;
    condition: string;
    listingType: string;
    location: string;
    createdAt: string;
  }>;
  stats: {
    activeListings: number;
    completedSales: number;
    completedSwaps: number;
    totalTransactions: number;
    memberSince: string;
  };
}

const conditionColors: Record<string, string> = {
  NEW: 'bg-green-500',
  LIKE_NEW: 'bg-emerald-500',
  GOOD: 'bg-blue-500',
  FAIR: 'bg-yellow-500',
  POOR: 'bg-red-500',
};

export default function PublicProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${params.id}`);
        if (!res.ok) {
          throw new Error('User not found');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-destructive">User Not Found</h2>
          <p className="text-muted-foreground mt-2">{error || 'This profile does not exist.'}</p>
          <Link href="/browse" className="mt-4 inline-block text-primary hover:underline">
            Browse Listings
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={profile.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                      <User className="w-16 h-16 text-primary" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
                  {profile.verified && (
                    <Badge className="bg-blue-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-muted-foreground mt-2">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Member since {format(new Date(profile.stats.memberSince), 'MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{profile.stats.activeListings}</div>
              <div className="text-sm text-muted-foreground">Active Listings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <div className="text-2xl font-bold">{profile.stats.completedSales}</div>
              <div className="text-sm text-muted-foreground">Items Sold</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ArrowRightLeft className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{profile.stats.completedSwaps}</div>
              <div className="text-sm text-muted-foreground">Swaps Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <div className="text-2xl font-bold">{profile.stats.totalTransactions}</div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.listings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No active listings at the moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {profile.listings.map((listing) => (
                  <Link key={listing.id} href={`/dashboard/listings/${listing.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="relative aspect-square bg-muted">
                        {listing.images[0] ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge
                          className={cn(
                            'absolute top-2 right-2 text-white text-xs',
                            conditionColors[listing.condition]
                          )}
                        >
                          {listing.condition.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold truncate">{listing.title}</h3>
                        <div className="flex items-center justify-between mt-1">
                          {listing.price ? (
                            <span className="text-primary font-bold">
                              ${listing.price.toLocaleString()} {listing.currency}
                            </span>
                          ) : (
                            <Badge variant="secondary">Swap Only</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {listing.listingType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {listing.location}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
