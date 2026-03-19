'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  Megaphone,
  Plus,
  Trash2,
  ExternalLink,
  BarChart3,
  MousePointerClick,
  ArrowLeft,
  Pencil,
  X,
  Check,
  Upload,
  Loader2,
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
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: '⏳ Awaiting Payment', color: 'bg-orange-100 text-orange-700' },
  PENDING_VERIFICATION: { label: '🟡 Awaiting Verification', color: 'bg-yellow-100 text-yellow-700' },
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
  const [uploadingBannerId, setUploadingBannerId] = useState<string | null>(null);
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {banners.map((banner) => (
        <div key={banner.id} className="bg-white rounded-xl shadow-md p-4 mb-4">
          
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{banner.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">📍 {getPlacementLabel(banner.placement)}</p>

            </div>

            <div
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                STATUS_BADGES[banner.status]?.color || 'bg-gray-100 text-gray-500'
              }`}
            >
              {STATUS_BADGES[banner.status]?.label || banner.status}
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}
