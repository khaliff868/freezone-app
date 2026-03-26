'use client';

import { useEffect, useState } from 'react';
import {
  Megaphone, Plus, Trash2, ExternalLink, BarChart3,
  MousePointerClick, ArrowLeft, Pencil, X, Check, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

interface BannerAd {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
  status: 'PENDING_PAYMENT' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'EXPIRED' | 'REJECTED';
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
  paymentReference?: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: '⏳ Awaiting Payment', color: 'bg-orange-100 text-orange-700' },
  PENDING_VERIFICATION: { label: '🟡 Awaiting Verification', color: 'bg-yellow-100 text-yellow-700' },
  ACTIVE: { label: '✅ Active', color: 'bg-green-100 text-green-700' },
  EXPIRED: { label: '⏹ Expired', color: 'bg-gray-100 text-gray-600' },
  REJECTED: { label: '❌ Rejected', color: 'bg-red-100 text-red-700' },
};

const PLACEMENTS = [
  { value: 'homepage_top_middle', label: 'Homepage - Top & Middle' },
  { value: 'homepage_sides', label: 'Homepage - Left & Right Sides' },
  { value: 'browse_top_bottom', label: 'Browse - Top & Bottom' },
  { value: 'browse_sides', label: 'Browse - Left & Right Sides' },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    placement: 'homepage_top_middle',
    active: true,
    sortOrder: 0,
    startDate: '',
    endDate: '',
  });

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/banners');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', imageUrl: '', linkUrl: '', placement: 'homepage_top_middle', active: true, sortOrder: 0, startDate: '', endDate: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (banner: BannerAd) => {
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      placement: banner.placement,
      active: banner.active,
      sortOrder: banner.sortOrder,
      startDate: banner.startDate ? banner.startDate.slice(0, 10) : '',
      endDate: banner.endDate ? banner.endDate.slice(0, 10) : '',
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) { toast.error('Title and Image URL are required'); return; }
    try {
      setSaving(true);
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...form } : form;
      const res = await fetch('/api/admin/banners', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
      const res = await fetch('/api/admin/banners', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: banner.id, active: !banner.active }) });
      if (!res.ok) throw new Error('Failed');
      toast.success(banner.active ? 'Banner disabled' : 'Banner enabled');
      loadBanners();
    } catch { toast.error('Failed to update banner'); }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner permanently?')) return;
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Banner deleted');
      loadBanners();
    } catch { toast.error('Failed to delete banner'); }
  };

  const approveBanner = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await fetch('/api/admin/banners', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'approve' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Banner approved and activated');
      loadBanners();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve banner');
    } finally { setProcessingId(null); }
  };

  const rejectBanner = async (id: string) => {
    const reason = rejectionReason[id]?.trim();
    if (!reason) { toast.error('Rejection reason is required'); return; }
    try {
      setProcessingId(id);
      const res = await fetch('/api/admin/banners', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'reject', reason }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Banner rejected');
      setRejectionReason((prev) => ({ ...prev, [id]: '' }));
      loadBanners();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject banner');
    } finally { setProcessingId(null); }
  };

  const getPlacementLabel = (placement: string) =>
    PLACEMENTS.find((p) => p.value === placement)?.label || placement;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-tropical-purple" />Banner Ads
            </h1>
            <p className="text-gray-600 text-sm mt-1">View and manage all user banner ads across the site</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-tropical-purple to-tropical-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />Add Banner
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-tropical-purple/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Banner' : 'New Banner'}</h2>
            <button onClick={resetForm} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent"
                  placeholder="Banner title (internal reference)" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placement *</label>
                <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent">
                  {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
              <input type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent"
                placeholder="https://example.com/banner-image.jpg" required />
              <p className="text-xs text-gray-500 mt-1">Recommended size: 1400×263px</p>
            </div>
            {form.imageUrl && (
              <div className="relative w-full aspect-[5/1] bg-gray-100 rounded-lg overflow-hidden">
                <Image src={form.imageUrl} alt="Preview" fill className="object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
              <input type="url" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent"
                placeholder="https://example.com" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent" min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (optional)</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tropical-purple focus:border-transparent" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 text-tropical-purple focus:ring-tropical-purple border-gray-300 rounded" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-tropical-purple to-tropical-pink text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                <Check className="w-4 h-4" />{saving ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-tropical-purple border-t-transparent"></div>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No banners yet</h3>
          <p className="text-gray-500 mb-6">Create your first banner ad to display on the site</p>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tropical-purple to-tropical-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
            <Plus className="w-5 h-5" />Create First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div key={banner.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-colors ${banner.active ? 'border-transparent' : 'border-gray-200'}`}>
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-72 aspect-[5/1] md:aspect-auto md:h-auto bg-gray-100 flex-shrink-0">
                  <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{banner.title}</h3>
                      {banner.user && (
                        <p className="text-xs text-tropical-purple mt-0.5">By: {banner.user.name} ({banner.user.email})</p>
                      )}
                      <p className="text-sm text-gray-500 mt-0.5">{getPlacementLabel(banner.placement)}</p>
                      {banner.linkUrl && (
                        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-caribbean-ocean hover:underline mt-1">
                          <ExternalLink className="w-3 h-3" />{banner.linkUrl}
                        </a>
                      )}
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[banner.status]?.color || 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_BADGES[banner.status]?.label || banner.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <BarChart3 className="w-4 h-4" /><span>{banner.impressions.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MousePointerClick className="w-4 h-4" /><span>{banner.clicks.toLocaleString()} clicks</span>
                    </div>
                    {banner.impressions > 0 && (
                      <span className="text-xs text-gray-400">{((banner.clicks / banner.impressions) * 100).toFixed(1)}% CTR</span>
                    )}
                  </div>

                  {(banner.startsAt || banner.endsAt) && (
                    <p className="text-xs text-gray-400 mt-2">
                      {banner.startsAt ? `From ${new Date(banner.startsAt).toLocaleDateString()}` : ''}
                      {banner.startsAt && banner.endsAt ? ' — ' : ''}
                      {banner.endsAt ? `Until ${new Date(banner.endsAt).toLocaleDateString()}` : ''}
                    </p>
                  )}

                  {banner.status === 'PENDING_PAYMENT' && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800 font-medium">Payment not submitted yet</p>
                      <p className="text-xs text-orange-700 mt-1">Waiting for user to submit payment for 700 TTD banner activation.</p>
                    </div>
                  )}

                  {banner.status === 'PENDING_VERIFICATION' && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800 font-medium">Payment proof awaiting review</p>
                      <p className="text-xs text-yellow-700 mt-1">Review payment proof and approve or reject. Approved banners run for 30 days.</p>
                      {banner.paymentReference && (
                        <p className="text-xs text-yellow-800 mt-2">Reference: <span className="font-semibold">{banner.paymentReference}</span></p>
                      )}
                      {banner.paymentProofUrl && (
                        <a href={banner.paymentProofUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-caribbean-ocean hover:underline mt-2">
                          <ExternalLink className="w-3 h-3" />View Payment Proof
                        </a>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button onClick={() => approveBanner(banner.id)} disabled={processingId === banner.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                          {processingId === banner.id ? 'Processing...' : 'Approve'}
                        </button>
                        <input type="text" value={rejectionReason[banner.id] || ''}
                          onChange={(e) => setRejectionReason((prev) => ({ ...prev, [banner.id]: e.target.value }))}
                          placeholder="Rejection reason"
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                        <button onClick={() => rejectBanner(banner.id)} disabled={processingId === banner.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {banner.status === 'REJECTED' && banner.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">Reason: {banner.rejectionReason}</p>
                  )}

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <button onClick={() => startEdit(banner)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />Edit
                    </button>
                    <button onClick={() => toggleActive(banner)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${banner.active ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}>
                      {banner.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {banner.active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => deleteBanner(banner.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
