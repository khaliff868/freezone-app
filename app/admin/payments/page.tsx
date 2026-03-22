'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

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
    title: string;
  } | null;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<{ payments: Payment[] }>('/api/admin/payments');
      console.log('[AdminPayments] fetched payments:', data.payments?.length, data.payments);
      setPayments(data.payments || []);
    } catch (error: any) {
      console.error('[AdminPayments] Error loading payments:', error);
      setError('Failed to load payments');
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: string, action: 'VERIFY' | 'REJECT') => {
    try {
      await apiClient(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      toast.success(`Payment ${action.toLowerCase()}d successfully`);
      loadPayments();
    } catch (error: any) {
      console.error('[AdminPayments] Error verifying payment:', error);
      toast.error('Failed to verify payment');
    }
  };

  const getListingLabel = (payment: Payment) => {
    if (payment.listing?.title) return payment.listing.title;
    if (payment.bannerAdId) return 'Banner Ad';
    if (payment.purpose) return payment.purpose.replace(/_/g, ' ');
    return 'N/A';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="mt-2 text-gray-600">Review and verify bank deposits</p>
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
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading payments...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-red-500">{error}</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No payments found</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{payment.user?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{getListingLabel(payment)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        ${typeof payment.amount === 'number' ? payment.amount.toFixed(2) : payment.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{payment.method}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : payment.status === 'VERIFIED' || payment.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.reference || 'N/A'}</div>
                      {payment.proofUploadUrl && (
                        <a
                          href={payment.proofUploadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Proof
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.status === 'PENDING' && payment.method === 'BANK_DEPOSIT' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerify(payment.id, 'VERIFY')}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                            title="Verify"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleVerify(payment.id, 'REJECT')}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                            title="Reject"
                          >
                            <X size={16} />
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
    </div>
  );
}
