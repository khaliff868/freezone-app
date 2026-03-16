'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Eye, ExternalLink, Image as ImageIcon } from 'lucide-react';

type FeePayment = {
  id: string;
  proofUploadUrl: string | null;
  method: string;
  status: string;
  reference: string | null;
};

type Listing = {
  id: string;
  title: string;
  listingType: string;
  status: string;
  price: number | null;
  category: string;
  images: string[];
  expiresAt: string | null;
  publishedAt: string | null;
  user: {
    name: string;
    email: string;
  };
  feePayments: FeePayment[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  PENDING_PAYMENT: 'bg-orange-100 text-orange-800',
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-gray-100 text-gray-600',
  SOLD: 'bg-purple-100 text-purple-800',
  SWAPPED: 'bg-blue-100 text-blue-800',
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; listingId: string | null }>({ open: false, listingId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadListings();
  }, [filter]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await apiClient<{ listings: Listing[] }>(`/api/admin/listings${params}`);
      setListings(data.listings || []);
    } catch (error: any) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId: string, isPendingPayment: boolean) => {
    try {
      setProcessing(listingId);
      const action = isPendingPayment ? 'approve_payment' : 'approve';
      await apiClient('/api/admin/listings', {
        method: 'PUT',
        body: JSON.stringify({ listingId, action }),
      });
      toast.success(isPendingPayment ? 'Payment verified and listing activated' : 'Listing approved');
      loadListings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve listing');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.listingId || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      setProcessing(rejectModal.listingId);
      await apiClient('/api/admin/listings', {
        method: 'PUT',
        body: JSON.stringify({ 
          listingId: rejectModal.listingId, 
          action: 'reject',
          reason: rejectReason,
        }),
      });
      toast.success('Listing rejected');
      setRejectModal({ open: false, listingId: null });
      setRejectReason('');
      loadListings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject listing');
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = listings.filter(l => ['PENDING_APPROVAL', 'PENDING_PAYMENT'].includes(l.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Listing Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review and approve listings. {pendingCount > 0 && (
            <span className="text-orange-600 font-semibold">{pendingCount} pending review</span>
          )}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
          { key: 'PENDING_PAYMENT', label: 'Pending Payment' },
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading listings...</td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No listings found</td>
                </tr>
              ) : (
                listings.map((listing) => {
                  const pendingPayment = listing.feePayments?.find(p => p.status === 'PENDING');
                  const isPendingApproval = listing.status === 'PENDING_APPROVAL';
                  const isPendingPayment = listing.status === 'PENDING_PAYMENT';
                  const needsAction = isPendingApproval || isPendingPayment;
                  
                  return (
                    <tr key={listing.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${needsAction ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-12 h-12 rounded object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{listing.title}</div>
                            <div className="text-xs text-gray-500">{listing.category} • {listing.listingType}</div>
                            <div className="text-xs text-gray-500">{listing.price ? `$${listing.price} TTD` : 'No price'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{listing.user.name}</div>
                        <div className="text-xs text-gray-500">{listing.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[listing.status] || 'bg-gray-100 text-gray-800'}`}>
                          {listing.status.replace('_', ' ')}
                        </span>
                        {listing.expiresAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Expires: {new Date(listing.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pendingPayment ? (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600 dark:text-gray-400">{pendingPayment.method}</div>
                            {pendingPayment.reference && (
                              <div className="text-xs text-gray-500">Ref: {pendingPayment.reference}</div>
                            )}
                            {pendingPayment.proofUploadUrl && (
                              <a 
                                href={pendingPayment.proofUploadUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <Eye className="w-3 h-3" /> View Proof
                              </a>
                            )}
                          </div>
                        ) : isPendingApproval ? (
                          <span className="text-xs text-gray-500">Free item - no payment</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {needsAction && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(listing.id, isPendingPayment)}
                              disabled={processing === listing.id || (isPendingPayment && !pendingPayment?.proofUploadUrl)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {isPendingPayment ? 'Verify Payment' : 'Approve'}
                            </button>
                            <button
                              onClick={() => setRejectModal({ open: true, listingId: listing.id })}
                              disabled={processing === listing.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reject Listing</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setRejectModal({ open: false, listingId: null }); setRejectReason(''); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing === rejectModal.listingId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
