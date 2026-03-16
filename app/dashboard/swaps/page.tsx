'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, ArrowRightLeft, Check, X, Clock, Package, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface SwapOffer {
  id: string;
  status: 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';
  message: string | null;
  fromUser: { id: string; name: string; avatar: string | null };
  toUser: { id: string; name: string; avatar: string | null };
  offeredListing: {
    id: string;
    title: string;
    images: string[];
    category: string;
    price: number | null;
    condition: string;
  };
  requestedListing: {
    id: string;
    title: string;
    images: string[];
    category: string;
    price: number | null;
    condition: string;
  };
  createdAt: string;
  respondedAt: string | null;
}

export default function SwapsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [swapOffers, setSwapOffers] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSwapOffers();
    }
  }, [session, filter]);

  const fetchSwapOffers = async () => {
    try {
      const res = await fetch(`/api/swaps?type=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setSwapOffers(data);
      }
    } catch (error) {
      console.error('Error fetching swap offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (offerId: string, action: 'accept' | 'decline' | 'cancel') => {
    setProcessing(offerId);
    try {
      const res = await fetch(`/api/swaps/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        toast.success(
          action === 'accept'
            ? 'Swap accepted! 🎉'
            : action === 'decline'
            ? 'Swap declined'
            : 'Swap cancelled'
        );
        fetchSwapOffers();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Action failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OFFERED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      ACCEPTED: 'bg-green-500/20 text-green-400 border-green-500/50',
      DECLINED: 'bg-red-500/20 text-red-400 border-red-500/50',
      CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      COMPLETED: 'bg-caribbean-teal/20 text-caribbean-teal border-caribbean-teal/50',
    };
    return `px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.OFFERED}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-tropical-orange border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-tropical-orange to-trini-gold rounded-xl">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Swap Offers</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your swap proposals</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'sent', 'received'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                filter === tab
                  ? 'bg-gradient-to-r from-tropical-orange to-trini-gold text-white'
                  : 'bg-white dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Swap Offers List */}
        {swapOffers.length === 0 ? (
          <div className="bg-white dark:bg-white/10 rounded-2xl p-12 text-center shadow-lg dark:shadow-none border border-gray-200 dark:border-transparent">
            <RefreshCw className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No swap offers</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Browse listings and propose swaps to get started!
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tropical-orange to-trini-gold text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Browse Listings
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {swapOffers.map((offer) => {
              const isSender = offer.fromUser.id === session?.user?.id;
              const isReceiver = offer.toUser.id === session?.user?.id;
              const isPending = offer.status === 'OFFERED';

              return (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-white/10 rounded-xl p-6 border border-gray-200 dark:border-white/10 hover:border-tropical-orange/50 transition-all shadow-sm dark:shadow-none"
                >
                  {/* Status & Time */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={getStatusBadge(offer.status)}>{offer.status}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {isSender && <span className="text-xs text-caribbean-teal">You proposed</span>}
                    {isReceiver && <span className="text-xs text-tropical-orange">Received</span>}
                  </div>

                  {/* Swap Visual */}
                  <div className="flex items-center gap-4">
                    {/* Offered Listing */}
                    <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {isSender ? 'Your item' : `${offer.fromUser.name}'s item`}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                          {offer.offeredListing.images[0] ? (
                            <img
                              src={offer.offeredListing.images[0]}
                              alt={offer.offeredListing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {offer.offeredListing.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {offer.offeredListing.condition.replace('_', ' ')}
                          </p>
                          {offer.offeredListing.price && (
                            <p className="text-sm text-trini-gold">
                              ${offer.offeredListing.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-tropical-orange to-trini-gold flex items-center justify-center">
                        <ArrowRightLeft className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Requested Listing */}
                    <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {isReceiver ? 'Your item' : `${offer.toUser.name}'s item`}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                          {offer.requestedListing.images[0] ? (
                            <img
                              src={offer.requestedListing.images[0]}
                              alt={offer.requestedListing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {offer.requestedListing.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {offer.requestedListing.condition.replace('_', ' ')}
                          </p>
                          {offer.requestedListing.price && (
                            <p className="text-sm text-trini-gold">
                              ${offer.requestedListing.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {offer.message && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-white/5 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">"
                        {offer.message}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <div className="mt-4 flex gap-3 justify-end">
                      {isReceiver && (
                        <>
                          <button
                            onClick={() => handleAction(offer.id, 'decline')}
                            disabled={processing === offer.id}
                            className="px-4 py-2 bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/50 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Decline
                          </button>
                          <button
                            onClick={() => handleAction(offer.id, 'accept')}
                            disabled={processing === offer.id}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Accept Swap
                          </button>
                        </>
                      )}
                      {isSender && (
                        <button
                          onClick={() => handleAction(offer.id, 'cancel')}
                          disabled={processing === offer.id}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-500/50 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500/30 transition-colors disabled:opacity-50"
                        >
                          Cancel Offer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
