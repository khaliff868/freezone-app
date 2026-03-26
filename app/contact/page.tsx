'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Phone, Mail, MessageCircle, Facebook, Instagram, Music, Pencil, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ContactInfo = {
  phone: string;
  whatsapp: string;
  email1: string;
  email2: string;
  tiktok: string;
  facebook: string;
  instagram: string;
};

const DEFAULT: ContactInfo = {
  phone: '', whatsapp: '', email1: '', email2: '',
  tiktok: '', facebook: '', instagram: '',
};

export default function ContactPage() {
  const { data: session } = useSession() || {};
  const isAdmin = session?.user?.role === 'ADMIN';

  const [info, setInfo] = useState<ContactInfo>(DEFAULT);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ContactInfo>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contact-info')
      .then(r => r.json())
      .then(data => { setInfo(data.info); setDraft(data.info); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/contact-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setInfo(data.info);
      setEditing(false);
      toast.success('Contact info updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(info);
    setEditing(false);
  };

  const Field = ({ label, value, field }: { label: string; value: string; field: keyof ContactInfo }) => (
    editing ? (
      <input
        value={draft[field]}
        onChange={e => setDraft(prev => ({ ...prev, [field]: e.target.value }))}
        placeholder={label}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-trini-red focus:border-transparent outline-none"
      />
    ) : (
      <p className="text-gray-700 dark:text-gray-300 text-lg font-medium select-all">{value || '—'}</p>
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-trini-red" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-trini-red to-tropical-orange flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contact Freezone</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Reach out to us for support, advertising, or marketplace inquiries.
            </p>
          </div>

          {/* Admin edit controls */}
          {isAdmin && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
            >
              <Pencil className="w-4 h-4" />Edit
            </button>
          )}
          {isAdmin && editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
              >
                <X className="w-4 h-4" />Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-4 py-2 bg-trini-red text-white rounded-lg text-sm font-medium hover:bg-trini-red/90 disabled:opacity-50 transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          )}
        </div>

        {editing && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ✏️ You are in edit mode. Update the fields below and click Save.
          </div>
        )}

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Phone</h2>
            </div>
            <Field label="Phone number" value={info.phone} field="phone" />
          </div>

          {/* WhatsApp */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">WhatsApp / Phone</h2>
            </div>
            <Field label="WhatsApp number" value={info.whatsapp} field="whatsapp" />
          </div>

          {/* Email */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h2>
            </div>
            <div className="space-y-3">
              <Field label="Primary email" value={info.email1} field="email1" />
              <Field label="Secondary email" value={info.email2} field="email2" />
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Social Media</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <Music className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">TikTok</p>
                  <Field label="TikTok handle" value={info.tiktok} field="tiktok" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Facebook</p>
                  <Field label="Facebook page" value={info.facebook} field="facebook" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Instagram</p>
                  <Field label="Instagram handle" value={info.instagram} field="instagram" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
