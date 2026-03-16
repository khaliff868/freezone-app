'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Megaphone, Plus, Trash2, Eye, EyeOff, ExternalLink, BarChart3, MousePointerClick, ArrowLeft, Pencil, X, Check, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

interface BannerAd {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'REJECTED';
  active: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  startDate: string | null;
  endDate: string | null;
  clicks: number;
  impressions: number;
  amount: number;
  paymentProofUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: '⏳ Awaiting Payment', color: 'bg-orange-100 text-orange-700' },
  ACTIVE: { label: '🟢 Active', color: 'bg-green-100 text-green-700' },
  EXPIRED: { label: '⏹ Expired', color: 'bg-gray-100 text-gray-600' },
  REJECTED: { label: '❌ Rejected', color: 'bg-red-100 text-red-700' },
};

const PLACEMENTS = [
  { value: 'homepage_top', label: 'Homepage - Top' },
  { value: 'homepage_mid', label: 'Homepage - Middle' },
  { value: 'browse_top', label: 'Browse - Top' },
  { value: 'browse_mid', label: 'Browse - Bottom' },
];

export default function UserBannersPage() {
  const { data: session } = useSession() || {};
  const searchParams = useSearchParams();
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    placement: 'homepage_top',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (session?.user) {
      loadBanners();
    }
  }, [session]);

  // Auto-open create form when ?create=true is in URL
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/banners/my');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', imageUrl: '', linkUrl: '', placement: 'homepage_top', startDate: '', endDate: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (banner: BannerAd) => {
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      placement: banner.placement,
      startDate: banner.startDate ? banner.startDate.slice(0, 10) : '',
      endDate: banner.endDate ? banner.endDate.slice(0, 10) : '',
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error('Title and Image URL are required');
      return;
    }

    try {
      setSaving(true);
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...form } : form;

      const res = await fetch('/api/banners/my', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed');

      toast.success(editingId ? 'Banner updated!' : 'Banner created!');
      resetForm();
      loadBanners();
    } catch {
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: BannerAd) => {
    try {
      const res = await fetch('/api/banners/my', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id, active: !banner.active }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(banner.active ? 'Banner paused' : 'Banner activated');
      loadBanners();
    } catch {
      toast.error('Failed to update banner');
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner permanently?')) return;
    try {
      const res = await fetch(`/api/banners/my?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Banner deleted');
      loadBanners();
    } catch {
      toast.error('Failed to delete banner');
    }
  };

  const getPlacementLabel = (placement: string) => {
    return PLACEMENTS.find((p) => p.value === placement)?.label || placement;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-tropical-purple" />
                My Banner Ads
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Create and manage your advertisements</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-tropical-purple to-tropical-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            New Ad
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-tropical-purple/10 to-tropical-pink/10 dark:from-tropical-purple/20 dark:to-tropical-pink/20 rounded-2xl p-4 mb-6 border border-tropical-purple/20">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">📢 Promote your business or products!</span> Banner ads cost <span className="font-bold text-tropical-purple">1,000 TTD</span> for 90 days.
            Recommended image size: <span className="font-medium">1200×240px</span> (5:1 ratio).
            After creating an ad, submit payment proof for admin verification.
          </p>
        </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-tropical-purple/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? 'Edit Banner' : 'Create New Banner'}
            </h2>
            <button onClick={resetForm} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent"
                  placeholder="e.g. My Shop Grand Opening"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Where to show *</label>
                <select
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent"
                >
                  {PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL *</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent"
                placeholder="https://cdn.shopify.com/s/files/1/0090/9236/6436/files/RECOMMENDED_SHOPIFY_BANNER_SIZE_FOR_DESKTOP_1024x1024.png?v=1732779229"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Recommended size: 1200×240px (5:1 ratio)</p>
            </div>

            {form.imageUrl && (
              <div className="relative w-full aspect-[5/1] bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={form.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Click-through URL (optional)</label>
              <input
                type="url"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent"
                placeholder="https://your-website.com (where visitors go when clicking)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (optional)</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-tropical-purple to-tropical-pink text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create Ad'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-tropical-purple border-t-transparent"></div>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No ads yet</h3>
          <p className="text-gray-500 mb-6">Create your first banner ad to get your business seen!</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tropical-purple to-tropical-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create First Ad
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-colors ${
                banner.active ? 'border-transparent hover:border-tropical-purple/20' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div className="relative w-full md:w-64 aspect-[5/1] md:aspect-auto md:h-auto bg-gray-100 flex-shrink-0">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{banner.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">📍 {getPlacementLabel(banner.placement)}</p>
                      {banner.linkUrl && (
                        <a
                          href={banner.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-caribbean-ocean hover:underline mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {banner.linkUrl.length > 40 ? banner.linkUrl.substring(0, 40) + '...' : banner.linkUrl}
                        </a>
                      )}
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      STATUS_BADGES[banner.status]?.color || 'bg-gray-100 text-gray-500'
                    }`}>
                      {STATUS_BADGES[banner.status]?.label || banner.status}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <BarChart3 className="w-4 h-4" />
                      <span>{banner.impressions.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MousePointerClick className="w-4 h-4" />
                      <span>{banner.clicks.toLocaleString()} clicks</span>
                    </div>
                    {banner.impressions > 0 && (
                      <span className="text-xs text-gray-400">
                        {((banner.clicks / banner.impressions) * 100).toFixed(1)}% CTR
                      </span>
                    )}
                  </div>

                  {/* Date range */}
                  {banner.endsAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Expires: {new Date(banner.endsAt).toLocaleDateString()}
                    </p>
                  )}

                  {/* Rejection reason */}
                  {banner.status === 'REJECTED' && banner.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                      Reason: {banner.rejectionReason}
                    </p>
                  )}

                  {/* Payment Info for Pending Payment */}
                  {banner.status === 'PENDING_PAYMENT' && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-800 font-medium">
                        💳 Payment of 1,000 TTD required
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Submit payment proof to activate this banner ad for 90 days.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {banner.status === 'PENDING_PAYMENT' && (
                      <button
                        onClick={() => startEdit(banner)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                    
                    {/* Renewal button for Active/Expired banners */}
                    {(banner.status === 'ACTIVE' || banner.status === 'EXPIRED') && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/banners/my', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: banner.id, action: 'renew' }),
                            });
                            if (!res.ok) throw new Error('Failed');
                            toast.success('Renewal initiated. Please submit payment.');
                            loadBanners();
                          } catch {
                            toast.error('Failed to initiate renewal');
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-trini-gold to-tropical-orange text-white font-medium rounded-lg hover:opacity-90 transition"
                      >
                        Renew for 1000 TTD
                      </button>
                    )}

                    {banner.status === 'PENDING_PAYMENT' && (
                      <button
                        onClick={() => deleteBanner(banner.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                  
                  {/* Helper text for renewal */}
                  {(banner.status === 'ACTIVE' || banner.status === 'EXPIRED') && (
                    <p className="text-xs text-gray-500 mt-2">
                      Submit payment proof to renew this banner ad for another 90 days.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
