'use client';

import { useEffect, useMemo, useState } from 'react';

type ListingStatus =
  | 'PENDING_APPROVAL'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'REJECTED'
  | 'REMOVED'
  | 'EXPIRED';

type UserTier = 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS' | string;

type FeePayment = {
  id: string;
  status: string;
  createdAt: string;
};

type ListingUser = {
  id: string;
  name: string | null;
  email: string;
  tier: UserTier;
};

type Listing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  listingType: string;
  status: ListingStatus;
  price?: number | null;
  createdAt: string;
  publishedAt?: string | null;
  expiresAt?: string | null;
  activatedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  location?: string | null;
  userId: string;
  user: ListingUser;
  feePayments: FeePayment[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const STATUS_OPTIONS = [
  'ALL',
  'PENDING_APPROVAL',
  'PENDING_PAYMENT',
  'ACTIVE',
  'REJECTED',
  'REMOVED',
  'EXPIRED',
] as const;

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getStatusBadgeClass(status: ListingStatus) {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'PENDING_PAYMENT':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'REMOVED':
      return 'bg-slate-100 text-slate-800 border border-slate-200';
    case 'EXPIRED':
      return 'bg-gray-100 text-gray-700 border border-gray-200';
    default:
      return 'bg-slate-100 text-slate-800 border border-slate-200';
  }
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewListing, setReviewListing] = useState<Listing | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());
    params.set('page', String(pagination.page));
    params.set('limit', String(pagination.limit));
    return params.toString();
  }, [statusFilter, search, pagination.page, pagination.limit]);

  const fetchListings = async (pageOverride?: number) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(pageOverride ?? pagination.page));
      params.set('limit', String(pagination.limit));

      const res = await fetch(`/api/admin/listings?${params.toString()}`, {
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch listings');
      }

      setListings(data.listings || []);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1,
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

  const runAction = async (
    listingId: string,
    action: 'approve' | 'reject' | 'remove',
    extraBody?: Record<string, unknown>
  ) => {
    try {
      setActionLoadingId(listingId);
      setError(null);

      const res = await fetch('/api/admin/listings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          action,
          ...extraBody,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} listing`);
      }

      await fetchListings();
      if (reviewListing?.id === listingId) {
        setReviewListing(data.listing || null);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = async (listingId: string) => {
    await runAction(listingId, 'approve');
  };

  const handleReject = async (listing: Listing) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason || !reason.trim()) return;
    await runAction(listing.id, 'reject', { reason: reason.trim() });
  };

  const handleRemove = async (listingId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to remove this listing?'
    );
    if (!confirmed) return;
    await runAction(listingId, 'remove');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearch(searchInput);
  };

  const goToPage = async (page: number) => {
    if (page < 1 || page > pagination.pages || page === pagination.page) return;
    await fetchListings(page);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Listing Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review and approve listings. Payment verification stays in Verify
            Payments.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row"
            >
              <div className="flex-1">
                <label
                  htmlFor="search"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Search listings
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by title or description"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-400"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
              >
                Search
              </button>
            </form>

            <div className="w-full md:w-64">
              <label
                htmlFor="status"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setPagination((prev) => ({ ...prev, page: 1 }));
                  setStatusFilter(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL'
                      ? 'All Statuses'
                      : status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Listing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      Loading listings...
                    </td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      No listings found.
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => {
                    const isBusy = actionLoadingId === listing.id;

                    return (
                      <tr key={listing.id} className="align-top">
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="font-semibold text-slate-900">
                              {listing.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {listing.listingType}
                              {listing.location ? ` • ${listing.location}` : ''}
                            </div>
                            {listing.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                                {listing.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="font-medium text-slate-900">
                            {listing.user?.name || 'Unnamed User'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {listing.user?.email}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Tier: {listing.user?.tier || '—'}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {listing.category}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                              listing.status
                            )}`}
                          >
                            {listing.status.replaceAll('_', ' ')}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(listing.createdAt)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setReviewListing(listing)}
                              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              Review
                            </button>

                            {listing.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleApprove(listing.id)}
                                  disabled={isBusy}
                                  className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isBusy ? 'Working...' : 'Approve'}
                                </button>

                                <button
                                  onClick={() => handleReject(listing)}
                                  disabled={isBusy}
                                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleRemove(listing.id)}
                              disabled={isBusy}
                              className="inline-flex items-center rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row">
            <div className="text-sm text-slate-600">
              Showing page {pagination.page} of {pagination.pages} •{' '}
              {pagination.total} total listings
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || loading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {reviewListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Review Listing
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review listing details before taking action.
                  </p>
                </div>
                <button
                  onClick={() => setReviewListing(null)}
                  className="rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="space-y-6 px-6 py-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {reviewListing.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        reviewListing.status
                      )}`}
                    >
                      {reviewListing.status.replaceAll('_', ' ')}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {reviewListing.category}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {reviewListing.listingType}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Seller
                    </div>
                    <div className="mt-2 text-sm text-slate-900">
                      {reviewListing.user?.name || 'Unnamed User'}
                    </div>
                    <div className="text-sm text-slate-600">
                      {reviewListing.user?.email}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Tier: {reviewListing.user?.tier || '—'}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dates
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      <div>
                        <span className="font-medium text-slate-900">
                          Created:
                        </span>{' '}
                        {formatDate(reviewListing.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">
                          Published:
                        </span>{' '}
                        {formatDate(reviewListing.publishedAt)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">
                          Expires:
                        </span>{' '}
                        {formatDate(reviewListing.expiresAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {reviewListing.description || 'No description provided.'}
                  </p>
                </div>

                {reviewListing.rejectionReason && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
                      Rejection Reason
                    </div>
                    <p className="mt-2 text-sm text-red-800">
                      {reviewListing.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4">
                {reviewListing.status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      onClick={() => handleReject(reviewListing)}
                      disabled={actionLoadingId === reviewListing.id}
                      className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleApprove(reviewListing.id)}
                      disabled={actionLoadingId === reviewListing.id}
                      className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoadingId === reviewListing.id
                        ? 'Working...'
                        : 'Approve'}
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleRemove(reviewListing.id)}
                  disabled={actionLoadingId === reviewListing.id}
                  className="inline-flex items-center rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>

                <button
                  onClick={() => setReviewListing(null)}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Current workflow: approved paid listings move to{' '}
          <span className="font-semibold text-slate-900">PENDING PAYMENT</span>{' '}
          for the Verify Payments tab. Free listings go live immediately.
        </div>
      </div>
    </div>
  );
}
