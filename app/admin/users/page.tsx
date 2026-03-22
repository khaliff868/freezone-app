'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
  _count: {
    listings: number;
    feePayments: number;
  };
};

export default function AdminUsersPage() {
  const { data: session } = useSession() || {};
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiClient<{ users: User[] }>('/api/admin/users');
      const fetchedUsers = data.users || [];
      fetchedUsers.forEach(u => {
        console.log(`[AdminUsers] id=${u.id} name=${u.name} banned=${u.banned} role=${u.role}`);
      });
      setUsers(fetchedUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId: string, action: 'ban' | 'unban') => {
    const confirmed = confirm(
      action === 'ban'
        ? 'Are you sure you want to ban this user? They will be immediately signed out.'
        : 'Are you sure you want to unban this user?'
    );
    if (!confirmed) return;

    setTogglingId(userId);
    try {
      const res = await fetch('/api/admin/users/ban-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      const responseData = await res.json().catch(() => ({}));
      console.log('[AdminUsers] ban-toggle response:', responseData);

      if (!res.ok) {
        toast.error(responseData.error || 'Failed to update user status');
        return;
      }

      setUsers(prev => {
        const updated = prev.map(u =>
          u.id === userId ? { ...u, banned: action === 'ban' } : u
        );
        console.log('[AdminUsers] updated user state:', updated.find(u => u.id === userId));
        return updated;
      });

      toast.success(action === 'ban' ? 'User banned successfully' : 'User unbanned successfully');
    } catch (error) {
      console.error('[AdminUsers] Ban/unban request failed:', error);
      toast.error('Failed to update user status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">Manage all platform users</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">All Users</h2>
            <span className="text-sm text-gray-600">{users.length} total</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = session?.user?.id === user.id;
                  const isAdmin = user.role === 'ADMIN';
                  const isBanned = user.banned === true;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-trini-gold text-trini-black' : 'bg-gray-100 text-gray-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{user._count.listings}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isBanned ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Banned
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSelf || isAdmin ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <button
                            onClick={() => handleToggleBan(user.id, isBanned ? 'unban' : 'ban')}
                            disabled={togglingId === user.id}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                              isBanned
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {togglingId === user.id ? '...' : isBanned ? 'Unban' : 'Ban'}
                          </button>
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
    </div>
  );
}
