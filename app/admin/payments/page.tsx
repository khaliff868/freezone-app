'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Check, X, ArrowLeft, ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  proofUploadUrl: string | null;
  purpose?: string;
  bannerAdId?: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  listing: {
    id: string;
    title: string;
    status: string;
  } | null;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; paymentId: string | null }>({ open: false, paymentId: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<{ payments: Payment[] }>('/api/admin/payments');
      setPayments(data.payments || []);
    } catch (error: any) {
      setError('Failed to load payments');
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    try {
      setProcessing(paymentId);
      await apiClient(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ action: 'VERIFY' }),
      });
      toast.success('Payment approved — listing is now live');
      loadPayments();
    } catch (error: any) {
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.paymentId) return;
    if (!rejectReason.trim()) { toast.error('Please enter a rejection reason'); return; }
    try {
      setProcessing(rejectModal.paymentId);
      await apiClient(`/api/admin/payments/${rejectModal.paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ action: 'REJECT', reason: rejectReason.trim() }),
      });
      toast.success('Payment rejected — user has been notified');
      setRejectModal({ open: false, paymentId: null });
      setRejectReason('');
      loadPayments();
    } catch (error: any) {
      toast.error('Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  const getListingLabel = (payment: Payment) => {
    if (payment.listing?.title) return payment.listing.title;
    if (payment.bannerAdId) return 'Banner Ad';
    if (payment.purpose) return payment.purpose.replace(/_/g, ' ');
    return 'N/A';
  };

  const canAction = (payment: Payment) =>
    payment.status === 'PENDING' &&
    ['BANK_DEPOSIT', 'ONLINE_BANK'].includes(payment.method);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="mt-2 text-gray-600">Review proof of payment, then approve or reject</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">All Payments</h2>
            <span className="text-sm text-gray-600">{payments.length} total</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing / Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading payments...</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-red-500">{error}</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No payments found</td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{payment.user?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{getListingLabel(payment)}</div>
                      {payment.listing?.id && (
                        <a href={`/dashboard/listings/${payment.listing.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
                          View listing <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        ${Math.round(typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount)).toLocaleString('en-US')} TTD
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{payment.method}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800'
                        : payment.status === 'VERIFIED' || payment.status === 'PAID' ? 'bg-green-100 text-green-800'
                        : payment.status === 'REJECTED' ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.reference || 'N/A'}</div>
                      {payment.proofUploadUrl ? (
                        <a href={payment.proofUploadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
                          <FileText className="w-3 h-3" />View Proof
                        </a>
                      ) : canAction(payment) ? (
                        <div className="text-xs text-orange-500 mt-0.5">No proof yet</div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canAction(payment) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(payment.id)}
                            disabled={processing === payment.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 transition"
                          >
                            <Check size={14} />Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, paymentId: payment.id })}
                            disabled={processing === payment.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 transition"
                          >
                            <X size={14} />Reject
                          </button>
                        </div>
                      )}
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
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Payment</h3>
            <p className="text-sm text-gray-600 mb-4">The user will be notified and can resubmit payment. Please provide a reason.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Proof is unclear, wrong amount, unreadable receipt..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setRejectModal({ open: false, paymentId: null }); setRejectReason(''); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing === rejectModal.paymentId}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject & Notify User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
