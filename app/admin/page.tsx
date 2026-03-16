'use client';

import { useEffect, useState } from 'react';
import { Users, Package, DollarSign, RefreshCcw, AlertCircle, Shield, TrendingUp, Megaphone } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';

type Stats = {
  users: {
    total: number;
  };
  listings: {
    byStatus: { status: string; _count: number }[];
    byType: { listingType: string; _count: number }[];
  };
  revenue: {
    total: number;
    transactions: number;
  };
  pendingDeposits: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient<Stats>('/api/admin/stats');
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-caribbean-green text-white';
      case 'PENDING_PAYMENT': return 'bg-orange-500 text-white';
      case 'DRAFT': return 'bg-gray-400 text-white';
      case 'SOLD': return 'bg-caribbean-ocean text-white';
      case 'SWAPPED': return 'bg-tropical-purple text-white';
      case 'REMOVED': return 'bg-trini-red text-white';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-trini-red border-t-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-trini-red mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Failed to load dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trini-red to-tropical-orange flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Platform overview and management</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-caribbean-ocean card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats.users.total}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-caribbean-ocean to-caribbean-teal rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-caribbean-green card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-4xl font-bold text-caribbean-green mt-2">
                  {stats.listings.byStatus.find((s) => s.status === 'ACTIVE')?._count || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-caribbean-green to-tropical-lime rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-tropical-purple card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-4xl font-bold text-tropical-purple mt-2">
                  ${stats.revenue.total.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">TTD • {stats.revenue.transactions} transactions</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-tropical-purple to-tropical-pink rounded-xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-trini-gold card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Deposits</p>
                <p className="text-4xl font-bold text-trini-gold mt-2">
                  {stats.pendingDeposits}
                </p>
                {stats.pendingDeposits > 0 && (
                  <p className="text-xs text-trini-red font-semibold mt-1">Needs attention!</p>
                )}
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-trini-gold to-tropical-orange rounded-xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Listings by Status */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-caribbean-teal" />
              Listings by Status
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.listings.byStatus.map((status) => (
                <div key={status.status} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(status.status)}`}>
                    {status.status.replace('_', ' ')}
                  </span>
                  <span className="text-xl font-bold text-gray-900">{status._count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-trini-red" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/admin/users"
              className="group p-6 bg-gradient-to-br from-caribbean-ocean/5 to-caribbean-teal/10 border-2 border-caribbean-ocean/20 rounded-2xl hover:border-caribbean-ocean hover:shadow-xl transition-all card-hover"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-caribbean-ocean to-caribbean-teal rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Manage Users</h3>
              <p className="text-gray-600 text-sm mt-1">View, ban/unban users</p>
            </Link>

            <Link
              href="/admin/listings"
              className="group p-6 bg-gradient-to-br from-caribbean-green/5 to-tropical-lime/10 border-2 border-caribbean-green/20 rounded-2xl hover:border-caribbean-green hover:shadow-xl transition-all card-hover"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-caribbean-green to-tropical-lime rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Manage Listings</h3>
              <p className="text-gray-600 text-sm mt-1">Review, approve, remove listings</p>
            </Link>

            <Link
              href="/admin/payments"
              className="group p-6 bg-gradient-to-br from-trini-gold/5 to-tropical-orange/10 border-2 border-trini-gold/20 rounded-2xl hover:border-trini-gold hover:shadow-xl transition-all card-hover"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-trini-gold to-tropical-orange rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Verify Payments</h3>
              <p className="text-gray-600 text-sm mt-1">Review and verify bank deposits</p>
              {stats.pendingDeposits > 0 && (
                <span className="inline-block mt-2 px-3 py-1 bg-trini-red text-white text-xs font-bold rounded-full pulse-badge">
                  {stats.pendingDeposits} pending
                </span>
              )}
            </Link>

            <Link
              href="/admin/banners"
              className="group p-6 bg-gradient-to-br from-tropical-purple/5 to-tropical-pink/10 border-2 border-tropical-purple/20 rounded-2xl hover:border-tropical-purple hover:shadow-xl transition-all card-hover"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-tropical-purple to-tropical-pink rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Megaphone className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Banner Ads</h3>
              <p className="text-gray-600 text-sm mt-1">Create & manage banner advertisements</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
