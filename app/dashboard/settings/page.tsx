'use client';

import { useSession } from 'next-auth/react';
import {
  Settings, Sun, Moon, Monitor, User, Bell, Shield, ShoppingBag,
  ShoppingCart, Package, MessageSquare, CreditCard, Truck, Sparkles,
  Link2, HelpCircle, Eye, EyeOff, Lock, Trash2, LogOut, Upload,
  ChevronDown, ChevronUp, Save, Loader2, Check, X, AlertTriangle,
  MapPin, Tag, Heart, Store, Globe, Facebook, Instagram, Phone,
  Mail, FileText, Download, Flag, BookOpen, Users, Zap, Volume2,
  VolumeX, Clock, DollarSign, Palette, Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const CATEGORIES = [
  'Swaps', 'Free Items', 'Beauty & Personal Care', 'Electronics', 'Vehicles',
  'Auto Parts & Accessories', 'Real Estate', 'Construction Materials', 'Home & Garden',
  'Furniture', 'Appliances', 'Fashion', 'Sports & Outdoors', 'Books & Education',
  'Kids & Baby', 'Services', 'Food & Catering', 'Business & Industrial',
  'Events & Tickets', 'Pets & Livestock', 'Art & Collectibles', 'Other',
];

const LOCATIONS = [
  'Port of Spain', 'San Fernando', 'Arima', 'Chaguanas', 'Point Fortin',
  'Sangre Grande', 'Princes Town', 'Mayaro', 'Couva', 'Tunapuna',
  'Siparia', 'Rio Claro', 'Penal', 'Diego Martin', 'La Brea',
  'Moruga', 'Arouca', 'Curepe', 'St. Augustine', 'Valsayn',
  'El Socorro', 'Barataria', 'San Juan', 'Petit Valley', 'Carapichaima',
  'Freeport', 'Claxton Bay', 'California', 'Gasparillo', 'Fyzabad',
  'Debe', 'Barrackpore', 'Woodbrook', 'Belmont', 'Glencoe',
  'Santa Cruz', 'La Romaine', 'Maracas Bay', 'Tobago',
];

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
];

interface ProfileData {
  name: string; displayName: string; email: string; phone: string;
  whatsapp: string; avatar: string; location: string; bio: string;
}

interface PreferencesData {
  [key: string]: unknown;
  theme: string; compactMode: boolean; reduceMotion: boolean;
  enableAllNotifications: boolean; pushNotifications: boolean; emailNotifications: boolean;
  inAppNotifications: boolean; smsNotifications: boolean; whatsappNotifications: boolean;
  notifyNewMessage: boolean; notifySellerReplied: boolean; notifyOfferAccepted: boolean;
  notifyOfferDeclined: boolean; notifyItemSold: boolean; notifyItemRelisted: boolean;
  notifyWishlistUpdated: boolean; notifyPriceDropped: boolean;
  notifyBuyerMessage: boolean; notifyNewOffer: boolean; notifyListingApproved: boolean;
  notifyListingExpired: boolean; notifyRenewalReminder: boolean; notifyListingSold: boolean;
  notifyPerformanceSummary: boolean; notifyPaymentReceived: boolean; notifySwapRequest: boolean;
  notifyNewDeviceLogin: boolean; notifyPasswordChanged: boolean; notifySecurityAlert: boolean;
  notifyAccountUpdates: boolean; notifyPolicyUpdates: boolean; notifyPromotionalEmails: boolean;
  profileVisibility: string; showPhone: boolean; showWhatsapp: boolean;
  showEmail: boolean; allowSearchEngineIndex: boolean; twoFactorEnabled: boolean;
  defaultBrowseLocation: string; preferredCategories: string[]; preferredCondition: string;
  showFeaturedFirst: boolean; showNewestFirst: boolean; hideSoldListings: boolean;
  hideSwapOnly: boolean; hideFreeItems: boolean; defaultListingView: string;
  budgetMin: number | null; budgetMax: number | null; interestedCategories: string[];
  acceptInternational: boolean; localOnly: boolean; meetUpPreferred: boolean;
  deliveryPreferred: boolean; autoFollowSearches: boolean; notifyMatchingItems: boolean;
  defaultListingType: string; defaultItemLocation: string; defaultCondition: string;
  autoRenewListing: boolean; renewalReminder: boolean; showSellerPhone: boolean;
  showSellerWhatsapp: boolean; allowOffers: boolean; allowSwapProposals: boolean;
  vacationMode: boolean; autoMarkUnavailable: boolean; preferredContactMethod: string;
  allowBuyerMessages: boolean; allowLoggedInOnly: boolean; muteMessageSounds: boolean;
  emailOnMessage: boolean; showReadReceipts: boolean; showOnlineStatus: boolean;
  autoReplyMessage: string;
  preferredPaymentMethod: string; billingEmail: string; billingPhone: string;
  renewalPaymentReminder: boolean; invoiceEmailToggle: boolean; payoutPreference: string;
  taxId: string; businessName: string;
  transactionMethod: string; preferredMeetupAreas: string; deliveryAvailable: boolean;
  deliveryFee: string; pickupInstructions: string; availableTimes: string;
  saveRecentlyViewed: boolean; personalizedRecs: boolean; recommendedCategories: boolean;
  trendingItems: boolean; promotionalSuggestions: boolean; homepagePersonalization: boolean;
  facebookUrl: string; instagramUrl: string; tiktokUrl: string; websiteUrl: string; storeName: string;
}

const defaultPreferences: PreferencesData = {
  theme: 'system', compactMode: false, reduceMotion: false,
  enableAllNotifications: true, pushNotifications: true, emailNotifications: true,
  inAppNotifications: true, smsNotifications: false, whatsappNotifications: false,
  notifyNewMessage: true, notifySellerReplied: true, notifyOfferAccepted: true,
  notifyOfferDeclined: true, notifyItemSold: true, notifyItemRelisted: true,
  notifyWishlistUpdated: true, notifyPriceDropped: true,
  notifyBuyerMessage: true, notifyNewOffer: true, notifyListingApproved: true,
  notifyListingExpired: true, notifyRenewalReminder: true, notifyListingSold: true,
  notifyPerformanceSummary: false, notifyPaymentReceived: true, notifySwapRequest: true,
  notifyNewDeviceLogin: true, notifyPasswordChanged: true, notifySecurityAlert: true,
  notifyAccountUpdates: true, notifyPolicyUpdates: false, notifyPromotionalEmails: false,
  profileVisibility: 'public', showPhone: false, showWhatsapp: false,
  showEmail: false, allowSearchEngineIndex: true, twoFactorEnabled: false,
  defaultBrowseLocation: '', preferredCategories: [], preferredCondition: '',
  showFeaturedFirst: true, showNewestFirst: false, hideSoldListings: false,
  hideSwapOnly: false, hideFreeItems: false, defaultListingView: 'grid',
  budgetMin: null, budgetMax: null, interestedCategories: [],
  acceptInternational: false, localOnly: true, meetUpPreferred: true,
  deliveryPreferred: false, autoFollowSearches: false, notifyMatchingItems: false,
  defaultListingType: 'SELL', defaultItemLocation: '', defaultCondition: 'GOOD',
  autoRenewListing: false, renewalReminder: true, showSellerPhone: false,
  showSellerWhatsapp: false, allowOffers: true, allowSwapProposals: true,
  vacationMode: false, autoMarkUnavailable: true, preferredContactMethod: 'message',
  allowBuyerMessages: true, allowLoggedInOnly: true, muteMessageSounds: false,
  emailOnMessage: true, showReadReceipts: true, showOnlineStatus: true,
  autoReplyMessage: '',
  preferredPaymentMethod: '', billingEmail: '', billingPhone: '',
  renewalPaymentReminder: true, invoiceEmailToggle: true, payoutPreference: '',
  taxId: '', businessName: '',
  transactionMethod: 'both', preferredMeetupAreas: '', deliveryAvailable: false,
  deliveryFee: '', pickupInstructions: '', availableTimes: '',
  saveRecentlyViewed: true, personalizedRecs: true, recommendedCategories: true,
  trendingItems: true, promotionalSuggestions: false, homepagePersonalization: true,
  facebookUrl: '', instagramUrl: '', tiktokUrl: '', websiteUrl: '', storeName: '',
};

const defaultProfile: ProfileData = {
  name: '', displayName: '', email: '', phone: '', whatsapp: '', avatar: '', location: '', bio: '',
};

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function SectionCard({ icon: Icon, iconColor, title, description, children, defaultOpen = false }: {
  icon: React.ElementType; iconColor: string; title: string; description: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconColor}`}><Icon className="w-5 h-5" /></div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100 dark:border-white/5 pt-4 space-y-4">{children}</div>}
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <SettingRow label={label} description={description}><Switch checked={checked} onCheckedChange={onChange} /></SettingRow>;
}

function TextInput({ value, onChange, placeholder, type = 'text', className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string }) {
  return <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-trini-red/50 focus:border-trini-red outline-none transition ${className}`} />;
}

function TextAreaInput({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-trini-red/50 focus:border-trini-red outline-none transition resize-none" />;
}

function SelectInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-trini-red/50 focus:border-trini-red outline-none transition">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function MultiSelect({ selected, onChange, options, placeholder }: { selected: string[]; onChange: (v: string[]) => void; options: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const toggle = (item: string) => onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-left flex items-center justify-between">
        <span className={selected.length ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{selected.length ? `${selected.length} selected` : placeholder || 'Select...'}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          {options.map(opt => (
            <button key={opt} type="button" onClick={() => toggle(opt)} className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(opt) ? 'bg-trini-red border-trini-red text-white' : 'border-gray-300 dark:border-gray-500'}`}>
                {selected.includes(opt) && <Check className="w-3 h-3" />}
              </div>
              <span className="text-gray-900 dark:text-white">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SubSectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide pt-2 pb-1 border-b border-gray-100 dark:border-white/5">{children}</h4>;
}

function SupportItem({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-white/5 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-sm text-gray-700 dark:text-gray-300 group">
        <Icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 flex-shrink-0" />
        <span className="flex-1 text-left font-medium">{label}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
      </button>
      {open && <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-gray-800/30">{children}</div>}
    </div>
  );
}

// ============================================================
// MAIN SETTINGS PAGE
// ============================================================

export default function SettingsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [prefs, setPrefs] = useState<PreferencesData>(defaultPreferences);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(prev => ({ ...prev, ...data.profile }));
        if (data.preferences && Object.keys(data.preferences).length > 0) setPrefs(prev => ({ ...prev, ...data.preferences }));
        const loadedTheme = data.preferences?.theme;
        if (loadedTheme && loadedTheme !== 'system') {
          if (loadedTheme === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
      }
    } catch { console.error('Failed to load settings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === 'authenticated') loadSettings(); }, [status, loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile, preferences: prefs }) });
      if (res.ok) toast.success('Settings saved successfully');
      else { const err = await res.json(); toast.error(err.error || 'Failed to save settings'); }
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) { toast.error('New passwords do not match'); return; }
    if (passwordForm.new.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/change-password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.new }) });
      if (res.ok) { toast.success('Password changed successfully'); setPasswordForm({ current: '', new: '', confirm: '' }); }
      else { const err = await res.json(); toast.error(err.error || 'Failed to change password'); }
    } catch { toast.error('Failed to change password'); }
    finally { setChangingPassword(false); }
  };

  const handleThemeChange = (newTheme: string) => {
    setPrefs(p => ({ ...p, theme: newTheme }));
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else if (newTheme === 'light') document.documentElement.classList.remove('dark');
    else { const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; if (prefersDark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }
  };

  const updateProfile = (field: keyof ProfileData, value: string) => setProfile(p => ({ ...p, [field]: value }));
  const updatePref = (field: string, value: unknown) => setPrefs(p => ({ ...p, [field]: value }));

  if (status === 'loading' || !mounted || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trini-red"></div></div>;
  }
  if (!session) { router.push('/auth/login'); return null; }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-trini-red/10 dark:bg-trini-red/20 rounded-xl"><Settings className="w-8 h-8 text-trini-red" /></div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and marketplace settings</p>
          </div>
          <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-trini-red hover:bg-trini-red/90 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-trini-red/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>

        <div className="space-y-4">

          {/* 1. APPEARANCE */}
          <SectionCard icon={Palette} iconColor="bg-trini-gold/10 text-trini-gold dark:bg-trini-gold/20" title="Appearance" description="Customize how Freezone looks on your device" defaultOpen={true}>
            <SettingRow label="Theme" description="Choose your preferred color mode">
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {[{ val: 'light', icon: Sun, label: 'Light' }, { val: 'dark', icon: Moon, label: 'Dark' }, { val: 'system', icon: Monitor, label: 'System' }].map(({ val, icon: Ic, label }) => (
                  <button key={val} onClick={() => handleThemeChange(val)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${prefs.theme === val ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <Ic className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>
            </SettingRow>
            <ToggleRow label="Compact mode" description="Reduce spacing and use smaller elements" checked={prefs.compactMode} onChange={v => updatePref('compactMode', v)} />
            <ToggleRow label="Reduce motion" description="Minimize animations and transitions" checked={prefs.reduceMotion} onChange={v => updatePref('reduceMotion', v)} />
          </SectionCard>

          {/* 2. ACCOUNT */}
          <SectionCard icon={User} iconColor="bg-caribbean-teal/10 text-caribbean-teal dark:bg-caribbean-teal/20" title="Account" description="Your profile and account information">
            <div className="grid gap-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label><TextInput value={profile.name} onChange={v => updateProfile('name', v)} placeholder="Your full name" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name / Username</label><TextInput value={profile.displayName} onChange={v => updateProfile('displayName', v)} placeholder="How you appear to others" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label><TextInput value={profile.email} onChange={() => {}} placeholder="Email" type="email" className="opacity-60 cursor-not-allowed" /><p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Contact support to update.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label><TextInput value={profile.phone} onChange={v => updateProfile('phone', v)} placeholder="+1 (868) 000-0000" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Number</label><TextInput value={profile.whatsapp} onChange={v => updateProfile('whatsapp', v)} placeholder="+1 (868) 000-0000" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location / Region</label><SelectInput value={profile.location} onChange={v => updateProfile('location', v)} options={LOCATIONS.map(l => ({ value: l, label: l }))} placeholder="Select your location" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio / Seller Profile</label><TextAreaInput value={profile.bio} onChange={v => updateProfile('bio', v)} placeholder="Tell buyers a bit about yourself..." rows={3} /></div>
            </div>
            <SubSectionLabel>Change Password</SubSectionLabel>
            <div className="grid gap-3">
              <TextInput value={passwordForm.current} onChange={v => setPasswordForm(p => ({ ...p, current: v }))} placeholder="Current password" type="password" />
              <TextInput value={passwordForm.new} onChange={v => setPasswordForm(p => ({ ...p, new: v }))} placeholder="New password (min 8 characters)" type="password" />
              <TextInput value={passwordForm.confirm} onChange={v => setPasswordForm(p => ({ ...p, confirm: v }))} placeholder="Confirm new password" type="password" />
              <button onClick={handleChangePassword} disabled={changingPassword || !passwordForm.current || !passwordForm.new} className="self-start flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}Update Password
              </button>
            </div>
          </SectionCard>

          {/* 3. NOTIFICATIONS */}
          <SectionCard icon={Bell} iconColor="bg-tropical-orange/10 text-tropical-orange dark:bg-tropical-orange/20" title="Notifications" description="Control how and when you receive alerts">
            <SubSectionLabel>General</SubSectionLabel>
            <ToggleRow label="Enable all notifications" description="Master toggle for all notifications" checked={prefs.enableAllNotifications} onChange={v => updatePref('enableAllNotifications', v)} />
            <ToggleRow label="Push notifications" checked={prefs.pushNotifications} onChange={v => updatePref('pushNotifications', v)} />
            <ToggleRow label="Email notifications" checked={prefs.emailNotifications} onChange={v => updatePref('emailNotifications', v)} />
            <ToggleRow label="In-app notifications" checked={prefs.inAppNotifications} onChange={v => updatePref('inAppNotifications', v)} />
            <ToggleRow label="SMS notifications" checked={prefs.smsNotifications} onChange={v => updatePref('smsNotifications', v)} />
            <ToggleRow label="WhatsApp notifications" checked={prefs.whatsappNotifications} onChange={v => updatePref('whatsappNotifications', v)} />
            <SubSectionLabel>Buyer Notifications</SubSectionLabel>
            <ToggleRow label="New message received" checked={prefs.notifyNewMessage} onChange={v => updatePref('notifyNewMessage', v)} />
            <ToggleRow label="Seller replied" checked={prefs.notifySellerReplied} onChange={v => updatePref('notifySellerReplied', v)} />
            <ToggleRow label="Offer accepted" checked={prefs.notifyOfferAccepted} onChange={v => updatePref('notifyOfferAccepted', v)} />
            <ToggleRow label="Offer declined" checked={prefs.notifyOfferDeclined} onChange={v => updatePref('notifyOfferDeclined', v)} />
            <ToggleRow label="Item marked sold" checked={prefs.notifyItemSold} onChange={v => updatePref('notifyItemSold', v)} />
            <ToggleRow label="Item back in stock / relisted" checked={prefs.notifyItemRelisted} onChange={v => updatePref('notifyItemRelisted', v)} />
            <ToggleRow label="Wishlist item updated" checked={prefs.notifyWishlistUpdated} onChange={v => updatePref('notifyWishlistUpdated', v)} />
            <ToggleRow label="Price dropped on saved item" checked={prefs.notifyPriceDropped} onChange={v => updatePref('notifyPriceDropped', v)} />
            <SubSectionLabel>Seller Notifications</SubSectionLabel>
            <ToggleRow label="New message from buyer" checked={prefs.notifyBuyerMessage} onChange={v => updatePref('notifyBuyerMessage', v)} />
            <ToggleRow label="New offer received" checked={prefs.notifyNewOffer} onChange={v => updatePref('notifyNewOffer', v)} />
            <ToggleRow label="Listing approved" checked={prefs.notifyListingApproved} onChange={v => updatePref('notifyListingApproved', v)} />
            <ToggleRow label="Listing expired" checked={prefs.notifyListingExpired} onChange={v => updatePref('notifyListingExpired', v)} />
            <ToggleRow label="Listing renewal reminder" checked={prefs.notifyRenewalReminder} onChange={v => updatePref('notifyRenewalReminder', v)} />
            <ToggleRow label="Listing sold" checked={prefs.notifyListingSold} onChange={v => updatePref('notifyListingSold', v)} />
            <ToggleRow label="Listing performance summary" checked={prefs.notifyPerformanceSummary} onChange={v => updatePref('notifyPerformanceSummary', v)} />
            <ToggleRow label="Payment received" checked={prefs.notifyPaymentReceived} onChange={v => updatePref('notifyPaymentReceived', v)} />
            <ToggleRow label="Swap request received" checked={prefs.notifySwapRequest} onChange={v => updatePref('notifySwapRequest', v)} />
            <SubSectionLabel>Account Notifications</SubSectionLabel>
            <ToggleRow label="Login from new device" checked={prefs.notifyNewDeviceLogin} onChange={v => updatePref('notifyNewDeviceLogin', v)} />
            <ToggleRow label="Password changed" checked={prefs.notifyPasswordChanged} onChange={v => updatePref('notifyPasswordChanged', v)} />
            <ToggleRow label="Security alert" checked={prefs.notifySecurityAlert} onChange={v => updatePref('notifySecurityAlert', v)} />
            <ToggleRow label="Account updates" checked={prefs.notifyAccountUpdates} onChange={v => updatePref('notifyAccountUpdates', v)} />
            <ToggleRow label="Policy updates" checked={prefs.notifyPolicyUpdates} onChange={v => updatePref('notifyPolicyUpdates', v)} />
            <ToggleRow label="Promotional emails" checked={prefs.notifyPromotionalEmails} onChange={v => updatePref('notifyPromotionalEmails', v)} />
          </SectionCard>

          {/* 4. PRIVACY & SECURITY */}
          <SectionCard icon={Shield} iconColor="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20" title="Privacy & Security" description="Control your visibility and protect your account">
            <SettingRow label="Profile visibility" description="Who can see your profile">
              <SelectInput value={prefs.profileVisibility} onChange={v => updatePref('profileVisibility', v)} options={[{ value: 'public', label: 'Public' }, { value: 'members', label: 'Members only' }, { value: 'private', label: 'Private' }]} />
            </SettingRow>
            <ToggleRow label="Show phone number" description="Display your phone on your profile" checked={prefs.showPhone} onChange={v => updatePref('showPhone', v)} />
            <ToggleRow label="Show WhatsApp number" checked={prefs.showWhatsapp} onChange={v => updatePref('showWhatsapp', v)} />
            <ToggleRow label="Show email address" checked={prefs.showEmail} onChange={v => updatePref('showEmail', v)} />
            <ToggleRow label="Allow search engine indexing" description="Let Google and others find your profile" checked={prefs.allowSearchEngineIndex} onChange={v => updatePref('allowSearchEngineIndex', v)} />
            <ToggleRow label="Two-factor authentication" description="Add extra security to your account" checked={prefs.twoFactorEnabled} onChange={v => updatePref('twoFactorEnabled', v)} />
            <SubSectionLabel>Account Actions</SubSectionLabel>
            <div className="flex flex-wrap gap-3 pt-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"><LogOut className="w-4 h-4" />Logout from all devices</button>
              <button onClick={() => setDeactivateConfirm(!deactivateConfirm)} className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm font-medium text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"><AlertTriangle className="w-4 h-4" />Deactivate Account</button>
              <button onClick={() => setDeleteConfirm(!deleteConfirm)} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"><Trash2 className="w-4 h-4" />Delete Account</button>
            </div>
            {deactivateConfirm && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">Deactivating your account will hide your profile and listings. You can reactivate later by logging in.</p>
                <div className="flex gap-2"><button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition">Confirm Deactivate</button><button onClick={() => setDeactivateConfirm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition">Cancel</button></div>
              </div>
            )}
            {deleteConfirm && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300 mb-3">⚠️ This action is permanent and cannot be undone. All your data, listings, and messages will be deleted.</p>
                <div className="flex gap-2"><button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">Permanently Delete</button><button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition">Cancel</button></div>
              </div>
            )}
          </SectionCard>

          {/* 5. MARKETPLACE */}
          <SectionCard icon={Store} iconColor="bg-purple-500/10 text-purple-500 dark:bg-purple-500/20" title="Marketplace Preferences" description="Customize your browsing experience">
            <SettingRow label="Default browse location"><div className="w-48"><SelectInput value={prefs.defaultBrowseLocation} onChange={v => updatePref('defaultBrowseLocation', v)} options={LOCATIONS.map(l => ({ value: l, label: l }))} placeholder="Any location" /></div></SettingRow>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Categories</label><MultiSelect selected={prefs.preferredCategories} onChange={v => updatePref('preferredCategories', v)} options={CATEGORIES} placeholder="Select categories" /></div>
            <SettingRow label="Preferred item condition"><div className="w-36"><SelectInput value={prefs.preferredCondition} onChange={v => updatePref('preferredCondition', v)} options={CONDITIONS.map(c => ({ value: c.value, label: c.label }))} placeholder="Any" /></div></SettingRow>
            <ToggleRow label="Show featured listings first" checked={prefs.showFeaturedFirst} onChange={v => updatePref('showFeaturedFirst', v)} />
            <ToggleRow label="Show newest listings first" checked={prefs.showNewestFirst} onChange={v => updatePref('showNewestFirst', v)} />
            <ToggleRow label="Hide sold listings" checked={prefs.hideSoldListings} onChange={v => updatePref('hideSoldListings', v)} />
            <ToggleRow label="Hide swap-only listings" checked={prefs.hideSwapOnly} onChange={v => updatePref('hideSwapOnly', v)} />
            <ToggleRow label="Hide free items" checked={prefs.hideFreeItems} onChange={v => updatePref('hideFreeItems', v)} />
            <SettingRow label="Default listing view">
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {[{ val: 'grid', label: 'Grid' }, { val: 'list', label: 'List' }].map(({ val, label }) => (
                  <button key={val} onClick={() => updatePref('defaultListingView', val)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${prefs.defaultListingView === val ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>{label}</button>
                ))}
              </div>
            </SettingRow>
          </SectionCard>

          {/* 6. BUYING */}
          <SectionCard icon={ShoppingCart} iconColor="bg-green-500/10 text-green-500 dark:bg-green-500/20" title="Buying Preferences" description="Set your shopping and discovery preferences">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Budget (TTD)</label><TextInput value={prefs.budgetMin?.toString() || ''} onChange={v => updatePref('budgetMin', v ? parseFloat(v) : null)} placeholder="0" type="number" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Budget (TTD)</label><TextInput value={prefs.budgetMax?.toString() || ''} onChange={v => updatePref('budgetMax', v ? parseFloat(v) : null)} placeholder="No limit" type="number" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interested Categories</label><MultiSelect selected={prefs.interestedCategories} onChange={v => updatePref('interestedCategories', v)} options={CATEGORIES} placeholder="Select categories you're interested in" /></div>
            <ToggleRow label="Accept international sellers" checked={prefs.acceptInternational} onChange={v => updatePref('acceptInternational', v)} />
            <ToggleRow label="Local only" description="Only show items from Trinidad & Tobago" checked={prefs.localOnly} onChange={v => updatePref('localOnly', v)} />
            <ToggleRow label="Meet-up preferred" checked={prefs.meetUpPreferred} onChange={v => updatePref('meetUpPreferred', v)} />
            <ToggleRow label="Delivery preferred" checked={prefs.deliveryPreferred} onChange={v => updatePref('deliveryPreferred', v)} />
            <ToggleRow label="Auto-follow saved searches" checked={prefs.autoFollowSearches} onChange={v => updatePref('autoFollowSearches', v)} />
            <ToggleRow label="Notify on matching items" checked={prefs.notifyMatchingItems} onChange={v => updatePref('notifyMatchingItems', v)} />
          </SectionCard>

          {/* 7. SELLING */}
          <SectionCard icon={Tag} iconColor="bg-orange-500/10 text-orange-500 dark:bg-orange-500/20" title="Selling Preferences" description="Configure your selling defaults and behavior">
            <SettingRow label="Default listing type"><div className="w-36"><SelectInput value={prefs.defaultListingType} onChange={v => updatePref('defaultListingType', v)} options={[{ value: 'SELL', label: 'Sell' }, { value: 'SWAP', label: 'Swap' }, { value: 'BOTH', label: 'Both' }, { value: 'FREE', label: 'Free' }]} /></div></SettingRow>
            <SettingRow label="Default item location"><div className="w-48"><SelectInput value={prefs.defaultItemLocation} onChange={v => updatePref('defaultItemLocation', v)} options={LOCATIONS.map(l => ({ value: l, label: l }))} placeholder="Select location" /></div></SettingRow>
            <SettingRow label="Default condition"><div className="w-36"><SelectInput value={prefs.defaultCondition} onChange={v => updatePref('defaultCondition', v)} options={CONDITIONS.map(c => ({ value: c.value, label: c.label }))} /></div></SettingRow>
            <ToggleRow label="Auto-renew listings" description="Automatically renew when expiring" checked={prefs.autoRenewListing} onChange={v => updatePref('autoRenewListing', v)} />
            <ToggleRow label="Renewal reminder" description="Get reminded before listings expire" checked={prefs.renewalReminder} onChange={v => updatePref('renewalReminder', v)} />
            <ToggleRow label="Show phone number on listings" checked={prefs.showSellerPhone} onChange={v => updatePref('showSellerPhone', v)} />
            <ToggleRow label="Show WhatsApp on listings" checked={prefs.showSellerWhatsapp} onChange={v => updatePref('showSellerWhatsapp', v)} />
            <ToggleRow label="Allow offers" checked={prefs.allowOffers} onChange={v => updatePref('allowOffers', v)} />
            <ToggleRow label="Allow swap proposals" checked={prefs.allowSwapProposals} onChange={v => updatePref('allowSwapProposals', v)} />
            <ToggleRow label="Vacation mode" description="Pause all your listings temporarily" checked={prefs.vacationMode} onChange={v => updatePref('vacationMode', v)} />
            <ToggleRow label="Auto-mark unavailable when paused" checked={prefs.autoMarkUnavailable} onChange={v => updatePref('autoMarkUnavailable', v)} />
            <SettingRow label="Preferred contact method"><div className="w-40"><SelectInput value={prefs.preferredContactMethod} onChange={v => updatePref('preferredContactMethod', v)} options={[{ value: 'message', label: 'Message' }, { value: 'phone', label: 'Phone' }, { value: 'whatsapp', label: 'WhatsApp' }]} /></div></SettingRow>
          </SectionCard>

          {/* 8. MESSAGING */}
          <SectionCard icon={MessageSquare} iconColor="bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20" title="Messaging & Chat" description="Control your messaging experience">
            <ToggleRow label="Allow buyers to message me" checked={prefs.allowBuyerMessages} onChange={v => updatePref('allowBuyerMessages', v)} />
            <ToggleRow label="Allow only logged-in users to message" checked={prefs.allowLoggedInOnly} onChange={v => updatePref('allowLoggedInOnly', v)} />
            <ToggleRow label="Mute message sounds" checked={prefs.muteMessageSounds} onChange={v => updatePref('muteMessageSounds', v)} />
            <ToggleRow label="Email me when I get a message" checked={prefs.emailOnMessage} onChange={v => updatePref('emailOnMessage', v)} />
            <ToggleRow label="Show read receipts" checked={prefs.showReadReceipts} onChange={v => updatePref('showReadReceipts', v)} />
            <ToggleRow label="Show online status" checked={prefs.showOnlineStatus} onChange={v => updatePref('showOnlineStatus', v)} />
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auto-reply message when unavailable</label><TextAreaInput value={prefs.autoReplyMessage} onChange={v => updatePref('autoReplyMessage', v)} placeholder="e.g., I'm currently unavailable. I'll get back to you soon!" rows={2} /></div>
            <div className="pt-2"><button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"><Users className="w-4 h-4" />Manage Blocked Users</button></div>
          </SectionCard>

          {/* 9. PAYMENT */}
          <SectionCard icon={CreditCard} iconColor="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" title="Payment & Payout" description="Manage billing, payments, and payouts">
            <SettingRow label="Preferred payment method"><div className="w-48"><SelectInput value={prefs.preferredPaymentMethod} onChange={v => updatePref('preferredPaymentMethod', v)} options={[{ value: 'bank_deposit', label: 'Bank Deposit' }, { value: 'online_bank', label: 'Online Banking' }, { value: 'paypal', label: 'PayPal' }, { value: 'cash', label: 'Cash on Meet-up' }]} placeholder="Select method" /></div></SettingRow>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Email</label><TextInput value={prefs.billingEmail} onChange={v => updatePref('billingEmail', v)} placeholder="billing@example.com" type="email" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Phone</label><TextInput value={prefs.billingPhone} onChange={v => updatePref('billingPhone', v)} placeholder="+1 (868) 000-0000" /></div>
            </div>
            <ToggleRow label="Renewal payment reminder" description="Get reminded before subscriptions renew" checked={prefs.renewalPaymentReminder} onChange={v => updatePref('renewalPaymentReminder', v)} />
            <ToggleRow label="Send invoice / receipt by email" checked={prefs.invoiceEmailToggle} onChange={v => updatePref('invoiceEmailToggle', v)} />
            <SettingRow label="Payout preference"><div className="w-48"><SelectInput value={prefs.payoutPreference} onChange={v => updatePref('payoutPreference', v)} options={[{ value: 'bank', label: 'Bank Transfer' }, { value: 'paypal', label: 'PayPal' }, { value: 'cheque', label: 'Cheque' }]} placeholder="Select payout method" /></div></SettingRow>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax ID / BIR Number</label><TextInput value={prefs.taxId} onChange={v => updatePref('taxId', v)} placeholder="Optional" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label><TextInput value={prefs.businessName} onChange={v => updatePref('businessName', v)} placeholder="Optional" /></div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"><FileText className="w-4 h-4" />Transaction History</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"><CreditCard className="w-4 h-4" />Saved Payment Methods</button>
            </div>
          </SectionCard>

          {/* 10. DELIVERY */}
          <SectionCard icon={Truck} iconColor="bg-sky-500/10 text-sky-500 dark:bg-sky-500/20" title="Delivery & Meet-up" description="Set your preferred transaction and delivery options">
            <SettingRow label="Preferred transaction method"><div className="w-40"><SelectInput value={prefs.transactionMethod} onChange={v => updatePref('transactionMethod', v)} options={[{ value: 'meetup', label: 'Meet-up' }, { value: 'delivery', label: 'Delivery' }, { value: 'both', label: 'Both' }]} /></div></SettingRow>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Meet-up Areas</label><TextAreaInput value={prefs.preferredMeetupAreas} onChange={v => updatePref('preferredMeetupAreas', v)} placeholder="e.g., Port of Spain, Chaguanas, Gulf City Mall..." rows={2} /></div>
            <ToggleRow label="Delivery available" description="Offer delivery on your listings" checked={prefs.deliveryAvailable} onChange={v => updatePref('deliveryAvailable', v)} />
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Fee (TTD)</label><TextInput value={prefs.deliveryFee} onChange={v => updatePref('deliveryFee', v)} placeholder="e.g., 50 or Free" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Instructions</label><TextAreaInput value={prefs.pickupInstructions} onChange={v => updatePref('pickupInstructions', v)} placeholder="Directions or special instructions for meet-up..." rows={2} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Days / Times</label><TextAreaInput value={prefs.availableTimes} onChange={v => updatePref('availableTimes', v)} placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm" rows={2} /></div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2"><Shield className="w-4 h-4 flex-shrink-0" /><span><strong>Safety Tip:</strong> Always meet in public, well-lit areas. Bring a friend if possible. Never share personal financial information during meet-ups.</span></p>
            </div>
          </SectionCard>

          {/* 11. PERSONALIZATION */}
          <SectionCard icon={Sparkles} iconColor="bg-pink-500/10 text-pink-500 dark:bg-pink-500/20" title="Saved Preferences & Personalization" description="Control how Freezone personalizes your experience">
            <ToggleRow label="Save recently viewed items" checked={prefs.saveRecentlyViewed} onChange={v => updatePref('saveRecentlyViewed', v)} />
            <ToggleRow label="Personalized recommendations" description="Get suggestions based on your activity" checked={prefs.personalizedRecs} onChange={v => updatePref('personalizedRecs', v)} />
            <ToggleRow label="Recommended categories" checked={prefs.recommendedCategories} onChange={v => updatePref('recommendedCategories', v)} />
            <ToggleRow label="Trending items" checked={prefs.trendingItems} onChange={v => updatePref('trendingItems', v)} />
            <ToggleRow label="Promotional suggestions" checked={prefs.promotionalSuggestions} onChange={v => updatePref('promotionalSuggestions', v)} />
            <ToggleRow label="Homepage personalization" checked={prefs.homepagePersonalization} onChange={v => updatePref('homepagePersonalization', v)} />
          </SectionCard>

          {/* 12. CONNECTED ACCOUNTS */}
          <SectionCard icon={Link2} iconColor="bg-violet-500/10 text-violet-500 dark:bg-violet-500/20" title="Connected Accounts & Social Links" description="Link your social profiles and online presence">
            <div className="grid gap-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-600" /> Facebook</label><TextInput value={prefs.facebookUrl} onChange={v => updatePref('facebookUrl', v)} placeholder="https://facebook.com/yourpage" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-500" /> Instagram</label><TextInput value={prefs.instagramUrl} onChange={v => updatePref('instagramUrl', v)} placeholder="https://instagram.com/yourhandle" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"><Zap className="w-4 h-4" /> TikTok</label><TextInput value={prefs.tiktokUrl} onChange={v => updatePref('tiktokUrl', v)} placeholder="https://tiktok.com/@yourhandle" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"><Globe className="w-4 h-4" /> Website</label><TextInput value={prefs.websiteUrl} onChange={v => updatePref('websiteUrl', v)} placeholder="https://yourwebsite.com" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"><Store className="w-4 h-4" /> Store Name</label><TextInput value={prefs.storeName} onChange={v => updatePref('storeName', v)} placeholder="Your store or business name" /></div>
            </div>
          </SectionCard>

          {/* 13. SUPPORT & LEGAL */}
          <SectionCard icon={HelpCircle} iconColor="bg-gray-500/10 text-gray-500 dark:bg-gray-400/20" title="Support & Legal" description="Get help, review policies, and manage your data">
            <div className="grid gap-2">

              <SupportItem icon={HelpCircle} label="Help Center">
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <p>Freezone Sell/Swap or Free is a marketplace for users in Trinidad &amp; Tobago to sell, swap, or give items away for free.</p>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Getting Started</h4>
                  <ol className="list-decimal pl-4 space-y-1"><li>Create an account or sign in.</li><li>Complete your profile.</li><li>Browse listings or create your own.</li><li>Use messages to contact other users.</li><li>Agree on terms before meeting or completing a transaction.</li></ol>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Creating a Listing</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>Title clearly describes the item</li><li>Photos are clear and accurate</li><li>Description includes condition, size, brand, and defects if any</li><li>Correct category is selected</li><li>Price or swap preference is realistic</li><li>Listing type is correct: Sell, Swap, or Free</li></ul>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Buying an Item</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>Read the full listing carefully</li><li>Ask the seller questions through Messages</li><li>Confirm item condition and availability</li><li>Arrange a safe public meeting place when possible</li><li>Never send payment outside trusted methods unless you fully understand the risk</li></ul>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Swapping Items</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>Clearly describe what you are offering</li><li>Confirm both items&apos; condition in advance</li><li>Share recent photos if requested</li><li>Agree on meeting time and location beforehand</li><li>Inspect the item before completing the exchange</li></ul>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Giving Items Away for Free</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>State whether pickup is required</li><li>Mention any item defects honestly</li><li>Clarify whether the item is first come, first served</li><li>Remove the listing once collected</li></ul>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Safety Tips</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>Meet in public places</li><li>Bring someone if possible</li><li>Inspect items before payment or exchange</li><li>Avoid sharing sensitive personal information</li><li>Report suspicious users or listings immediately</li></ul>
                </div>
              </SupportItem>

              <SupportItem icon={Mail} label="Contact Support">
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <p>Our support team is here to assist with account issues, listing problems, messaging concerns, payment-related questions, and general platform support.</p>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Support Channels</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>In-app Contact Support form</li><li>Official support email</li><li>Website support request form</li></ul>
                  <h4 className="font-semibold text-gray-900 dark:text-white">What to Include in Your Request</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>Your full name and account email address</li><li>A clear description of the issue</li><li>Listing ID, message ID, or order details if relevant</li><li>Screenshots where applicable</li><li>Device and browser information if the issue is technical</li></ul>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Types of Issues We Can Help With</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>Unable to sign in</li><li>Listing not showing</li><li>Problems uploading images</li><li>Account access issues</li><li>Suspicious or abusive user behavior</li><li>Membership or billing questions</li><li>Technical errors on the platform</li></ul>
                  <p className="text-xs text-gray-400">Support is typically reviewed during regular business hours. Response times may vary.</p>
                  <a href="/contact" className="inline-flex items-center gap-2 px-4 py-2 bg-trini-red text-white rounded-lg text-sm font-medium hover:bg-trini-red/90 transition"><Mail className="w-4 h-4" />Go to Contact Form</a>
                </div>
              </SupportItem>

              <SupportItem icon={Flag} label="Report a Problem">
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <p>If you find a bug, a broken page, suspicious activity, or policy violation, please report it so we can investigate.</p>
                  <h4 className="font-semibold text-gray-900 dark:text-white">What Can Be Reported</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>Technical bugs or broken features</li><li>Fraudulent or misleading listings</li><li>Harassment or abusive behavior</li><li>Spam messages</li><li>Inappropriate content</li><li>Copyright concerns</li><li>Safety concerns related to users or listings</li></ul>
                  <h4 className="font-semibold text-gray-900 dark:text-white">What to Include</h4>
                  <ul className="list-disc pl-4 space-y-1"><li>A short issue title and detailed description</li><li>Steps to reproduce the issue, if technical</li><li>Screenshots or screen recordings if available</li><li>Relevant listing, chat, or account details</li><li>Date and time the issue occurred</li></ul>
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-xs text-red-700 dark:text-red-300"><strong>Urgent Safety Issues:</strong> If the matter involves immediate danger, theft, threats, or unlawful activity, contact the relevant local authorities first. Platform reports do not replace emergency services.</p></div>
                </div>
              </SupportItem>

              <SupportItem icon={FileText} label="Terms of Service">
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  {[
                    { title: '1. Acceptance of Terms', content: 'By accessing or using Freezone Sell/Swap or Free, you agree to comply with these Terms of Service. If you do not agree, you must not use the platform.' },
                    { title: '2. Platform Purpose', content: 'Freezone Sell/Swap or Free provides an online marketplace where users may create listings to sell, swap, or give away items. We do not own listed items and are not a direct party to transactions between users unless explicitly stated.' },
                    { title: '3. User Accounts', content: 'Users are responsible for providing accurate registration details, maintaining account security, keeping login credentials confidential, and all activity that occurs under their account. We may suspend or terminate accounts that violate platform rules.' },
                    { title: '4. Listings', content: 'Users must ensure that listings are accurate and truthful, do not contain misleading descriptions, do not include prohibited items, comply with applicable laws, and respect intellectual property rights. We reserve the right to remove listings that violate these terms.' },
                    { title: '5. Transactions', content: "All transactions are made at the users' own discretion and risk. Users are responsible for confirming item condition, agreeing on payment or swap terms, and arranging collection or meetup. We do not guarantee the quality, safety, legality, or availability of any listed item." },
                    { title: '6. Prohibited Conduct', content: 'Users may not post illegal, stolen, counterfeit, or prohibited goods; harass, threaten, or abuse other users; create fraudulent or deceptive listings; attempt unauthorized access to accounts or systems; or use the platform for spam or unlawful conduct.' },
                    { title: '7. Fees and Membership', content: 'Some features may require fees or paid membership. Any applicable pricing, benefits, and limits will be displayed on the platform and may be updated from time to time.' },
                    { title: '8. Content Rights', content: 'Users retain rights to the content they upload, but grant the platform a non-exclusive right to display, host, and use the content for operating and promoting the service.' },
                    { title: '9. Account Suspension or Termination', content: 'We reserve the right to suspend, restrict, or terminate accounts or content that violate these Terms, applicable law, or platform safety standards.' },
                    { title: '10. Disclaimer', content: 'The platform is provided on an as-is and as-available basis. We make no warranties regarding uninterrupted service, listing accuracy, or transaction outcomes.' },
                    { title: '11. Limitation of Liability', content: 'To the maximum extent permitted by law, Freezone Sell/Swap or Free is not liable for indirect, incidental, special, or consequential damages arising from use of the platform.' },
                    { title: '12. Changes to Terms', content: 'We may update these Terms from time to time. Continued use of the platform after updates means you accept the revised Terms.' },
                  ].map(({ title, content }) => (
                    <div key={title}><h4 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h4><p>{content}</p></div>
                  ))}
                </div>
              </SupportItem>

              <SupportItem icon={Shield} label="Privacy Policy">
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  {[
                    { title: '1. Overview', content: 'Freezone Sell/Swap or Free respects your privacy and is committed to protecting your personal information. This Privacy Policy explains what we collect, how we use it, and your choices.' },
                    { title: '2. Information We Collect', content: 'We may collect: name, email address, phone number, profile information, account login details, messages sent through the platform, listing details and uploaded images, device/browser/usage data, and payment or subscription-related information where applicable.' },
                    { title: '3. How We Use Information', content: 'We use information to create and manage user accounts, display listings and enable messaging, improve platform performance and security, process subscriptions or payments, send account notifications, prevent fraud and policy violations, and comply with legal obligations.' },
                    { title: '4. Sharing of Information', content: 'We may share data with service providers supporting the platform, when required by law, to protect users or platform security, or in connection with business restructuring if applicable. We do not sell personal information in a way inconsistent with this policy.' },
                    { title: '5. Data Retention', content: 'We keep personal information only as long as necessary for business, legal, safety, and operational purposes.' },
                    { title: '6. Security', content: 'We use reasonable safeguards to protect user information. However, no system is completely secure, and users should also take steps to protect their accounts.' },
                    { title: '7. Your Choices', content: 'You may be able to update profile details, change notification settings, request account deletion, and contact support about data concerns.' },
                    { title: '8. Cookies and Analytics', content: 'We may use cookies or similar technologies to improve functionality, remember preferences, and understand platform usage.' },
                    { title: "9. Children's Privacy", content: 'The platform is not intended for users below the minimum age required by applicable law. Users below the required age must not create accounts.' },
                    { title: '10. Policy Updates', content: 'We may revise this Privacy Policy from time to time. Continued use of the platform means you accept the updated version.' },
                  ].map(({ title, content }) => (
                    <div key={title}><h4 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h4><p>{content}</p></div>
                  ))}
                </div>
              </SupportItem>

              <SupportItem icon={BookOpen} label="Community Guidelines">
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <p>Freezone Sell/Swap or Free is meant to be a respectful, safe, and trustworthy marketplace. All users are expected to act honestly and responsibly.</p>
                  {[
                    { title: '1. Be Respectful', dos: ['Communicate politely', 'Respond honestly', "Respect other users' time and boundaries"], donts: ['Harass, insult, threaten, or intimidate others', 'Use hateful, discriminatory, or abusive language', 'Send spam or unwanted repeated messages'] },
                    { title: '2. Be Honest', dos: ['Describe items accurately', 'Share real photos when possible', 'Mention defects or missing parts clearly'], donts: ['Misrepresent items', 'Use fake photos', 'Hide important item damage or issues', 'Pretend to offer items you do not have'] },
                  ].map(({ title, dos, donts }) => (
                    <div key={title}>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg"><p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">✅ Do</p><ul className="text-xs space-y-0.5">{dos.map(d => <li key={d}>• {d}</li>)}</ul></div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg"><p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">❌ Do not</p><ul className="text-xs space-y-0.5">{donts.map(d => <li key={d}>• {d}</li>)}</ul></div>
                      </div>
                    </div>
                  ))}
                  <div><h4 className="font-semibold text-gray-900 dark:text-white mb-1">3. Post Allowed Items Only</h4><p>Users must not list illegal, dangerous, stolen, counterfeit, or prohibited items. Any listing that violates law or policy may be removed without notice.</p></div>
                  <div><h4 className="font-semibold text-gray-900 dark:text-white mb-1">4. Keep Transactions Safe</h4><ul className="list-disc pl-4 space-y-1"><li>Meet in safe public places when possible</li><li>Check items before paying or swapping</li><li>Avoid sharing unnecessary personal information</li><li>Report suspicious behavior immediately</li></ul></div>
                  <div><h4 className="font-semibold text-gray-900 dark:text-white mb-1">5. No Fraud or Manipulation</h4><ul className="list-disc pl-4 space-y-1"><li>Do not scam users or use fake accounts</li><li>Do not manipulate ratings, listings, or messages</li><li>Do not attempt payment fraud</li><li>Do not misuse promotional tools</li></ul></div>
                  <div><h4 className="font-semibold text-gray-900 dark:text-white mb-1">6. Enforcement</h4><p>Violations may result in content removal, listing suspension, account restriction, permanent account ban, or reports to authorities where necessary.</p></div>
                </div>
              </SupportItem>

            </div>

            <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"><Download className="w-4 h-4" />Download My Data</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"><Trash2 className="w-4 h-4" />Request Account Deletion</button>
            </div>
          </SectionCard>

        </div>

        <div className="sticky bottom-4 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Remember to save your changes</p>
            <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-trini-red hover:bg-trini-red/90 text-white rounded-xl font-medium transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
