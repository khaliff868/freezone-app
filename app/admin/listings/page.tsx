'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, ExternalLink, Image as ImageIcon, Trash2, Megaphone } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

type Listing = {
  itemType: 'listing';
  id: string;
  title: string;
  listingType: string;
  status: string;
  price: number | null;
  category: string;
  images: string[];
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  user: { name: string; email: string };
};

type BannerAd = {
  itemType: 'banner';
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
  status: string;
  amount: number;
  createdAt: string;
  user: { name: string; email: string } | null;
};

type Item = Listing | BannerAd;

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  PENDING_PAYMENT: 'bg-orange-100 text-orange-800',
  PENDING_VERIFICATION: 'bg-orange-100 text-orange-800',
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-gray-100 text-gray-600',
  SOLD: 'bg-purple-100 text-purple-800',
  SWAPPED: 'bg-blue-100 text-blue-800',
  REMOVED: 'bg-red-100 text-red-800',
};

const NEEDS_MODERATION_LISTING = ['PENDING_APPROVAL', 'PENDING_PAYMENT'];
const NEEDS_MODERATION_BANNER = ['PENDING_PAYMENT', 'PENDING_VERIFICATION'];

export default function AdminListingsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string | null; itemType: 'listing' | 'banner' | null }>({ open: false, id: null, itemType: null });
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, [filter]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';

      const [listingsData, bannersData] = await Promise.allSettled([
        apiClient<{ listings: any[] }>(`/api/admin/listings${params}`),
        apiClient<{ banners: any[] }>(`/api/admin/banners${params}`),
      ]);

      const listings: Listing[] = listingsData.status === 'fulfilled'
        ? (listingsData.value.listings || []).map((l: any) => ({ ...l, itemType: 'listing' as const }))
        : [];

      const banners: BannerAd[] = bannersData.status === 'fulfilled'
        ? (bannersData.value.banners || []).map((b: any) => ({ ...b, itemType: 'banner' as const }))
        : [];

      const merged: Item[] = [...listings, ...banners].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setItems(merged);
    } catch (error: any) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: Item) => {
    try {
      setProcessing(item.id);
      if (item.itemType === 'banner') {
        await apiClient('/api/admin/banners', {
          method: 'PUT',
          body: JSON.stringify({ bannerId: item.id, action: 'approve' }),
        });
        toast.success('Banner ad content approved — awaiting payment verification');
      } else {
        await apiClient('/api/admin/listings', {
          method: 'PUT',
          body: JSON.stringify({ listingId: item.id, action: 'approve' }),
        });
        toast.success('Listing approved — awaiting payment verification before going live');
      }
      loadAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.id || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      setProcessing(rejectModal.id);
      if (rejectModal.itemType === 'banner') {
        await apiClient('/api/admin/banners', {
          method: 'PUT',
          body: JSON.stringify({ bannerId: rejectModal.id, action: 'reject', reason: rejectReason }),
        });
        toast.success('Banner ad rejected');
      } else {
        await apiClient('/api/admin/listings', {
          method: 'PUT',
          body: JSON.stringify({ listingId: rejectModal.id, action: 'reject', reason: rejectReason }),
        });
        toast.success('Listing rejected');
      }
      setRejectModal({ open: false, id: null, itemType: null });
      setRejectReason('');
      loadAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const handleRemove = async (item: Item) => {
    if (!confirm('Are you sure you want to remove this? This cannot be undone.')) return;
    try {
      setProcessing(item.id);
      if (item.itemType === 'banner') {
        await apiClient('/api/admin/banners', {
          method: 'PUT',
          body: JSON.stringify({ bannerId: item.id, action: 'remove' }),
        });
        toast.success('Banner ad removed');
      } else {
        await apiClient('/api/admin/listings', {
          method: 'PUT',
          body: JSON.stringify({ listingId: item.id, action: 'remove' }),
        });
        toast.success('Listing removed');
      }
      loadAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove');
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = items.filter(item =>
    item.itemType === 'banner'
      ? NEEDS_MODERATION_BANNER.includes(item.status)
      : NEEDS_MODERATION_LISTING.includes(item.status)
  ).length;

  const needsMod = (item: Item) =>
    item.itemType === 'banner'
      ? NEEDS_MODERATION_BANNER.includes(item.status)
      : NEEDS_MODERATION_LISTING.includes(item.status);

  const isRemoved = (item: Item) => item.status === 'REJECTED' || item.status === 'REMOVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Listing Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review and approve listings and banner ads.{' '}
          {pendingCount > 0 && <span className="text-orange-600 font-semibold">{pendingCount} pending review</span>}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
          { key: 'ACTIVE', label: 'Active' },
          { key: 'EXPIRED', label: 'Expired' },
          { key: 'REJECTED', label: 'Rejected' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-trini-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Listing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No items found</td></tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={`${item.itemType}-${item.id}`}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${needsMod(item) ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {item.itemType === 'banner' ? (
                          item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-yellow-100 flex items-center justify-center flex-shrink-0">
                              <Megaphone className="w-6 h-6 text-yellow-600" />
                            </div>
                          )
                        ) : (
                          item.images?.[0] ? (
                            <img src={item.images[0]} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</div>
                            {item.itemType === 'banner' && (
                              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">BANNER AD</span>
                            )}
                          </div>
                          {item.itemType === 'listing' ? (
                            <>
                              <div className="text-xs text-gray-500">{item.category} • {item.listingType}</div>
                              <div className="text-xs text-gray-500">
                                {item.price ? `$${Math.round(item.price).toLocaleString('en-US')} TTD` : 'No price'}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-xs text-gray-500">Placement: {item.placement}</div>
                              <div className="text-xs text-gray-500">${Math.round(item.amount).toLocaleString('en-US')} TTD</div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{item.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{item.user?.email || ''}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800'}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={item.itemType === 'banner'
                            ? (item.imageUrl || item.linkUrl || '#')
                            : `/dashboard/listings/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                        >
                          <ExternalLink className="w-3 h-3" />Review
                        </a>

                        {needsMod(item) && (
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={processing === item.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 transition"
                          >
                            <CheckCircle className="w-3 h-3" />Approve
                          </button>
                        )}

                        {needsMod(item) && (
                          <button
                            onClick={() => setRejectModal({ open: true, id: item.id, itemType: item.itemType })}
                            disabled={processing === item.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 transition"
                          >
                            <XCircle className="w-3 h-3" />Reject
                          </button>
                        )}

                        {!isRemoved(item) && (
                          <button
                            onClick={() => handleRemove(item)}
                            disabled={processing === item.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-white text-xs font-medium rounded hover:bg-gray-900 disabled:opacity-50 transition"
                          >
                            <Trash2 className="w-3 h-3" />Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reject {rejectModal.itemType === 'banner' ? 'Banner Ad' : 'Listing'}
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setRejectModal({ open: false, id: null, itemType: null }); setRejectReason(''); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing === rejectModal.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
