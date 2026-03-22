'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ListingStatus =
  | 'PENDING_APPROVAL'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'REJECTED'
  | 'REMOVED'
  | 'EXPIRED';

type Listing = {
  id: string;
  title: string;
  description?: string;
  category: string;
  listingType: string;
  status: ListingStatus;
  createdAt: string;
  location?: string;
  user: {
    name: string;
    email: string;
    tier: string;
  };
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/listings');
    const data = await res.json();
    setListings(data.listings || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const runAction = async (listingId: string, action: string, extra?: any) => {
    setActionLoadingId(listingId);

    await fetch('/api/admin/listings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        action,
        ...extra,
      }),
    });

    setActionLoadingId(null);
    fetchListings();
  };

  const handleApprove = (id: string) => runAction(id, 'approve');

  const handleReject = (listing: Listing) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    runAction(listing.id, 'reject', { reason });
  };

  const handleRemove = (id: string) => {
    if (!confirm('Remove this listing?')) return;
    runAction(id, 'remove');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* 🔙 BACK TO ADMIN */}
        <div className="mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </div>

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Listing Management</h1>
          <p className="text-sm text-slate-600">
            Review and approve listings. Payment handled in Verify Payments.
          </p>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-100 text-left text-sm">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-6">
                    Loading...
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6">
                    No listings found
                  </td>
                </tr>
              ) : (
                listings.map((listing) => {
                  const isBusy = actionLoadingId === listing.id;

                  return (
                    <tr key={listing.id} className="border-t">
                      <td className="px-4 py-4">
                        <div className="font-semibold">{listing.title}</div>
                        <div className="text-xs text-gray-500">
                          {listing.location}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm">
                        <div>{listing.user.name}</div>
                        <div className="text-xs text-gray-500">
                          {listing.user.email}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {listing.category}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {listing.status}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2 flex-wrap">

                          {/* REVIEW */}
                          <button className="bg-blue-600 text-white px-3 py-1 rounded">
                            Review
                          </button>

                          {/* APPROVE / REJECT */}
                          {listing.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleApprove(listing.id)}
                                disabled={isBusy}
                                className="bg-green-600 text-white px-3 py-1 rounded"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => handleReject(listing)}
                                disabled={isBusy}
                                className="bg-red-600 text-white px-3 py-1 rounded"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* REMOVE */}
                          <button
                            onClick={() => handleRemove(listing.id)}
                            disabled={isBusy}
                            className="bg-gray-700 text-white px-3 py-1 rounded"
                          >
                            Remove
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
