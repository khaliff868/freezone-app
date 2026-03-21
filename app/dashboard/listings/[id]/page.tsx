'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Tag, Clock, User, Star, RefreshCcw, Edit, Trash2, CreditCard, AlertCircle, MessageSquare, ArrowRightLeft, X, Check, Loader2, Building, Landmark, Copy, Upload, ExternalLink, Heart, ShoppingBag } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { ImageGallery } from '@/components/ui/image-gallery';

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  listingType: string;
  status: string;
  category: string;
  condition: string;
  location: string;
  swapTerms: string | null;
  featured: boolean;
  featuredStatus?: 'ACTIVE' | 'NONE';
  images: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    whatsapp: string | null;
    tier: string;
    verified: boolean;
  };
};

type UserListing = {
  id: string;
  title: string;
  images: string[];
  listingType: string;
  status: string;
};

type PaymentMethod = 'PAYPAL' | 'ONLINE_BANK' | 'BANK_DEPOSIT';

type PaymentInfo = {
  paymentId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  usdAmount?: string;
  reference: string;
  listingTitle?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    instructions: string;
  };
  instructions?: string;
};

export default function ListingDetailPage() {
  const { data: session, status } = useSession() || {};
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [selectedListing, setSelectedListing] = useState('');
  const [swapMessage, setSwapMessage] = useState('');
  const [sendingSwap, setSendingSwap] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'details' | 'upload'>('select');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [markingAsSold, setMarkingAsSold] = useState(false);

  const listingId = params?.id as string;

  // Redirect guests to login with callbackUrl
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/auth/login?callbackUrl=/dashboard/listings/${listingId}`);
    }
  }, [status, listingId, router]);

  const calculateTimeRemaining = useCallback(() => {
    if (!listing || listing.status !== 'PENDING_PAYMENT') {
      return { expired: false, timeString: '' };
    }
    const createdAt = new Date(listing.createdAt).getTime();
    const expiresAt = createdAt + 72 * 60 * 60 * 1000;
    const now = Date.now();
    const remaining = expiresAt - now;
    if (remaining <= 0) return { expired: true, timeString: '' };
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return { expired: false, timeString: `${hours}h ${minutes}m` };
  }, [listing]);

  useEffect(() => {
    if (!listing || listing.status !== 'PENDING_PAYMENT') {
      setPaymentExpired(false);
      setTimeRemaining('');
      return;
    }
    const updateTimer = () => {
      const { expired, timeString } = calculateTimeRemaining();
      setPaymentExpired(expired);
      setTimeRemaining(timeString);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [listing, calculateTimeRemaining]);

  useEffect(() => {
    if (listingId) loadListing();
  }, [listingId]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast.success('Payment successful! Your listing is now active. 🎉');
      loadListing();
    } else if (payment === 'cancelled') {
      toast.error('Payment was cancelled');
    }
  }, [searchParams]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await apiClient<{ listing: Listing }>(`/api/listings/${listingId}`);
      setListing(data.listing);
      if (session?.user?.id) checkWishlistStatus();
    } catch (error: any) {
      console.error('Error loading listing:', error);
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        const found = data.wishlist?.some((item: any) => item.listing.id === listingId);
        setIsWishlisted(found);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!session?.user?.id) { toast.error('Please login to save items'); return; }
    setTogglingWishlist(true);
    try {
      if (isWishlisted) {
        const res = await fetch(`/api/wishlist?listingId=${listingId}`, { method: 'DELETE' });
        if (res.ok) { setIsWishlisted(false); toast.success('Removed from wishlist'); }
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        });
        if (res.ok) { setIsWishlisted(true); toast.success('Added to wishlist'); }
        else { const error = await res.json(); toast.error(error.error || 'Failed to add to wishlist'); }
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setTogglingWishlist(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await apiClient(`/api/listings/${listingId}`, { method: 'DELETE' });
      toast.success('Listing deleted');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete listing');
    }
  };

  const handleMarkAsSold = async () => {
    if (!confirm('Mark this listing as sold? This will disable further engagement and notify the admin.')) return;
    setMarkingAsSold(true);
    try {
      const res = await fetch('/api/listings/mark-sold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listingId }),
      });
      if (res.ok) {
        toast.success('Listing marked as sold!');
        loadListing();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to mark as sold');
      }
    } catch (error) {
      toast.error('Failed to mark as sold');
    } finally {
      setMarkingAsSold(false);
    }
  };

  const handlePayFee = () => {
    if (!session?.user?.id) { toast.error('Please login to pay'); return; }
    setShowPaymentModal(true);
    setPaymentStep('select');
    setSelectedPaymentMethod(null);
    setPaymentInfo(null);
  };

  const handleSelectPaymentMethod = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setProcessingPayment(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, method }),
      });
      const data = await res.json();
      if (res.ok) { setPaymentInfo(data); setPaymentStep('details'); }
      else toast.error(data.error || 'Failed to initiate payment');
    } catch {
      toast.error('Payment service unavailable. Please try again later.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleUploadClick = () => {
    console.log('[UploadProof] Upload button clicked');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('[UploadProof] File selected:', file?.name, file?.size);
    if (!file) return;

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Only images (JPG, PNG, WebP) and PDF files are allowed');
      event.target.value = '';
      return;
    }
    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      event.target.value = '';
      return;
    }

    await handleUploadProof(file);
    event.target.value = '';
  };

  const handleUploadProof = async (file: File) => {
    if (!paymentInfo) return;
    setUploadingProof(true);
    try {
      console.log('[UploadProof] Uploading to storage:', file.name);
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload/presigned', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        console.error('[UploadProof] Storage upload failed:', err);
        throw new Error('Failed to upload file');
      }
      const { publicUrl } = await uploadRes.json();
      console.log('[UploadProof] Storage upload success, publicUrl:', publicUrl);

      const proofRes = await fetch('/api/payments/upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: paymentInfo.paymentId, proofUrl: publicUrl }),
      });
      if (proofRes.ok) {
        console.log('[UploadProof] Proof saved successfully');

        // Notify via toast - proof submitted successfully
        toast.success('✅ Proof submitted! Admin will verify your payment within 24-48 hours.');
        setProofSubmitted(true);
        setShowPaymentModal(false);
        loadListing();
      } else {
        const error = await proofRes.json();
        console.error('[UploadProof] Proof save failed:', error);
        toast.error(error.error || 'Failed to save proof');
      }
    } catch (error) {
      console.error('[UploadProof] Upload error:', error);
      toast.error('Failed to upload proof. Please try again.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleContactSeller = () => {
    if (!session?.user?.id) { toast.error('Please login to contact seller'); router.push('/auth/login'); return; }
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) { toast.error('Please enter a message'); return; }
    setSendingMessage(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: listing?.user.id, listingId: listing?.id, initialMessage: message.trim() }),
      });
      if (res.ok) {
        const conv = await res.json();
        toast.success('Message sent!');
        router.push(`/dashboard/messages/${conv.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch { toast.error('Something went wrong'); }
    finally { setSendingMessage(false); }
  };

  const handleProposeSwap = async () => {
    if (!session?.user?.id) { toast.error('Please login to propose a swap'); router.push('/auth/login'); return; }
    try {
      const res = await fetch('/api/listings?type=swap&status=ACTIVE');
      if (res.ok) {
        const data = await res.json();
        const swappable = data.listings.filter(
          (l: UserListing) => l.id !== listingId && (l.listingType === 'SWAP' || l.listingType === 'BOTH')
        );
        setUserListings(swappable);
        setShowSwapModal(true);
      }
    } catch { toast.error('Failed to load your listings'); }
  };

  const handleSubmitSwap = async () => {
    if (!selectedListing) { toast.error('Please select a listing to offer'); return; }
    setSendingSwap(true);
    try {
      const res = await fetch('/api/swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offeredListingId: selectedListing, requestedListingId: listingId, message: swapMessage.trim() || null }),
      });
      if (res.ok) { toast.success('Swap offer sent! 🔄'); setShowSwapModal(false); router.push('/dashboard/swaps'); }
      else { const error = await res.json(); toast.error(error.error || 'Failed to send swap offer'); }
    } catch { toast.error('Something went wrong'); }
    finally { setSendingSwap(false); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-200 text-gray-700',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      PENDING_PAYMENT: 'bg-orange-100 text-orange-800 border border-orange-300',
      PENDING_FEE: 'bg-trini-gold/20 text-trini-gold border border-trini-gold',
      ACTIVE: 'bg-caribbean-green/20 text-caribbean-green border border-caribbean-green',
      EXPIRED: 'bg-gray-300 text-gray-700 border border-gray-400',
      REJECTED: 'bg-trini-red/20 text-trini-red border border-trini-red',
      SOLD: 'bg-caribbean-ocean/20 text-caribbean-ocean border border-caribbean-ocean',
      SWAPPED: 'bg-tropical-purple/20 text-tropical-purple border border-tropical-purple',
      REMOVED: 'bg-trini-red/20 text-trini-red border border-trini-red',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      SELL: 'bg-caribbean-ocean text-white',
      SWAP: 'bg-tropical-purple text-white',
      BOTH: 'bg-gradient-to-r from-caribbean-ocean to-tropical-purple text-white',
    };
    return styles[type] || 'bg-gray-500 text-white';
  };

  const getConditionBadge = (condition: string) => {
    const styles: Record<string, string> = {
      NEW: 'bg-caribbean-green text-white',
      LIKE_NEW: 'bg-caribbean-teal text-white',
      GOOD: 'bg-trini-gold text-trini-black',
      FAIR: 'bg-tropical-orange text-white',
      POOR: 'bg-gray-500 text-white',
    };
    return styles[condition] || 'bg-gray-400 text-white';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Swaps': 'from-tropical-purple to-caribbean-ocean',
      'Free Items': 'from-caribbean-green to-tropical-lime',
      'Beauty & Personal Care': 'from-tropical-pink to-tropical-coral',
      'Electronics': 'from-caribbean-teal to-caribbean-ocean',
      'Vehicles': 'from-trini-red to-tropical-coral',
      'Auto Parts & Accessories': 'from-gray-600 to-gray-800',
      'House & Land': 'from-trini-gold to-tropical-orange',
      'House & Land - Land': 'from-trini-gold to-tropical-orange',
      'House & Land - House For Sale': 'from-trini-gold to-tropical-orange',
      'House & Land - House For Rent': 'from-trini-gold to-tropical-orange',
      'Construction Materials': 'from-tropical-orange to-trini-red',
      'Home & Garden': 'from-caribbean-green to-tropical-lime',
      'Furniture': 'from-tropical-coral to-trini-gold',
      'Appliances': 'from-caribbean-ocean to-caribbean-teal',
      'Fashion': 'from-tropical-pink to-tropical-purple',
      'Sports & Outdoors': 'from-tropical-orange to-trini-gold',
      'Books & Education': 'from-tropical-purple to-caribbean-ocean',
      'Kids & Baby': 'from-tropical-coral to-tropical-pink',
      'Services': 'from-caribbean-ocean to-caribbean-teal',
      'Food & Catering': 'from-trini-red to-tropical-coral',
      'Business & Industrial': 'from-gray-700 to-gray-900',
      'Events & Tickets': 'from-tropical-pink to-tropical-purple',
      'Pets & Livestock': 'from-caribbean-green to-caribbean-teal',
      'Art & Collectibles': 'from-tropical-coral to-tropical-pink',
      'Other': 'from-gray-500 to-gray-600',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'Swaps': '🔄', 'Free Items': '🎁', 'Beauty & Personal Care': '💄',
      'Electronics': '📱', 'Vehicles': '🚗', 'Auto Parts & Accessories': '🔧',
      'House & Land': '🏠', 'House & Land - Land': '🏡', 'House & Land - House For Sale': '🏠', 'House & Land - House For Rent': '🔑', 'Construction Materials': '🧱', 'Home & Garden': '🏡',
      'Furniture': '🪑', 'Appliances': '🍳', 'Fashion': '👗',
      'Sports & Outdoors': '⚽', 'Books & Education': '📚', 'Kids & Baby': '👶',
      'Services': '🛠️', 'Food & Catering': '🍽️', 'Business & Industrial': '🏭',
      'Events & Tickets': '🎫', 'Pets & Livestock': '🐾', 'Art & Collectibles': '🎨',
      'Other': '📦',
    };
    return emojis[category] || '📦';
  };

  const isOwner = session?.user?.id === listing?.user?.id;
  const isSold = listing?.status === 'SOLD';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-trini-red border-t-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-trini-red mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
          <p className="text-gray-600 mb-6">This listing may have been removed or doesn&apos;t exist.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-trini-red to-tropical-orange text-white font-semibold rounded-xl hover:scale-105 transition-transform">
            <ArrowLeft className="w-5 h-5" />Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-trini-red transition mb-6">
          <ArrowLeft className="w-5 h-5" />Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-lg p-4 relative">
              {listing.images && listing.images.length > 0 ? (
                <ImageGallery images={listing.images} alt={listing.title} />
              ) : (
                <div className={`h-64 rounded-xl bg-gradient-to-br ${getCategoryColor(listing.category)} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-9xl opacity-30">{getCategoryEmoji(listing.category)}</span>
                  </div>
                </div>
              )}
              {/* SOLD overlay */}
              {isSold && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-4xl font-extrabold tracking-widest bg-caribbean-ocean/80 px-6 py-3 rounded-2xl rotate-[-15deg] shadow-xl">SOLD</span>
                </div>
              )}
              <div className="absolute top-6 left-6 flex gap-2">
                {listing.featuredStatus === 'ACTIVE' && (
                  <span className="px-3 py-1.5 bg-trini-gold text-trini-black text-sm font-bold rounded-full flex items-center gap-1.5 shadow-md">
                    <Star className="w-4 h-4" />Featured
                  </span>
                )}
              </div>
              <div className="absolute top-6 right-6 flex gap-2">
                <span className={`px-3 py-1.5 ${getTypeBadge(listing.listingType)} text-sm font-bold rounded-full shadow-md`}>
                  {listing.listingType}
                </span>
                {!isOwner && session?.user?.id && !isSold && (
                  <button
                    onClick={toggleWishlist}
                    disabled={togglingWishlist}
                    className={`p-2 rounded-full shadow-md transition-colors ${isWishlisted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {togglingWishlist ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />}
                  </button>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
                <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getStatusBadge(listing.status)}`}>
                  {listing.status.replace('_', ' ')}
                </span>
              </div>
              {isSold && (
                <div className="mb-4 p-3 bg-caribbean-ocean/10 border border-caribbean-ocean/20 rounded-xl flex items-center gap-2 text-caribbean-ocean font-semibold">
                  <ShoppingBag className="w-5 h-5" />This item has been sold and is no longer available.
                </div>
              )}
              <p className="text-gray-600 text-lg leading-relaxed">{listing.description}</p>
              {listing.swapTerms && (
                <div className="mt-6 p-4 bg-tropical-purple/10 rounded-xl border border-tropical-purple/20">
                  <h3 className="font-semibold text-tropical-purple flex items-center gap-2 mb-2">
                    <RefreshCcw className="w-5 h-5" />Swap Terms
                  </h3>
                  <p className="text-gray-700">{listing.swapTerms}</p>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Item Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2"><Tag className="w-4 h-4 text-caribbean-teal" />{listing.category}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Condition</p>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getConditionBadge(listing.condition)}`}>{listing.condition.replace('_', ' ')}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-trini-red" />{listing.location}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Posted</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-tropical-orange" />{new Date(listing.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            {listing.price && (
              <div className="bg-gradient-to-br from-trini-red to-tropical-orange rounded-2xl shadow-xl p-6 text-white">
                <p className="text-white/80 text-sm mb-1">Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">${listing.price}</span>
                  <span className="text-xl">{listing.currency}</span>
                </div>
              </div>
            )}

            {/* Seller Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-caribbean-teal" />Seller Information
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-caribbean-teal to-caribbean-ocean flex items-center justify-center text-white font-bold text-lg">
                  {listing.user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    {listing.user.name}
                    {listing.user.verified && (
                      <span className="w-5 h-5 bg-caribbean-teal rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">Member</p>
                </div>
              </div>
              {!isOwner && (
                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Email:</span><span className="text-gray-800 break-all">{listing.user.email}</span></div>
                  <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Phone:</span><span className="text-gray-800">{listing.user.phone || 'Not provided'}</span></div>
                  <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">WhatsApp:</span><span className="text-gray-800">{listing.user.whatsapp || 'Not provided'}</span></div>
                </div>
              )}
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
                <h3 className="font-bold text-gray-900 mb-4">Actions</h3>

                {listing.status === 'PENDING_APPROVAL' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                    <AlertCircle className="w-4 h-4 inline mr-2" />Awaiting admin approval. Your listing will be visible once approved.
                  </div>
                )}

                {listing.status === 'PENDING_PAYMENT' && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800 mb-3">
                    <AlertCircle className="w-4 h-4 inline mr-2" />Payment of 100 TTD required to publish this listing.
                    {!paymentExpired && timeRemaining && <p className="text-sm text-gray-600 mt-2">Payment request expires in: {timeRemaining}</p>}
                    {paymentExpired && <p className="text-sm text-red-600 mt-2 font-semibold">This payment request has expired. Please create a new request.</p>}
                  </div>
                )}

                {listing.status === 'REJECTED' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 inline mr-2" />This listing was rejected by admin.
                  </div>
                )}

                {isSold && (
                  <div className="p-3 bg-caribbean-ocean/10 border border-caribbean-ocean/20 rounded-xl text-sm text-caribbean-ocean font-medium">
                    <ShoppingBag className="w-4 h-4 inline mr-2" />This listing has been marked as sold.
                  </div>
                )}

                {proofSubmitted && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    Proof submitted! Awaiting admin verification.
                  </div>
                )}

                {listing.status === 'PENDING_PAYMENT' && (
                  <button onClick={handlePayFee} disabled={paymentExpired} className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-transform ${paymentExpired ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-caribbean-green to-tropical-lime text-white hover:scale-105'}`}>
                    <CreditCard className="w-5 h-5" />{paymentExpired ? 'Payment Expired' : 'Submit Payment (100 TTD)'}
                  </button>
                )}

                {(listing.status === 'ACTIVE' || listing.status === 'EXPIRED') && listing.category === 'Free Items' && (
                  <div>
                    <button onClick={async () => { try { await apiClient(`/api/listings/${listing.id}/renew`, { method: 'POST' }); toast.success('Renewal request submitted for admin approval'); loadListing(); } catch (err: any) { toast.error(err.message || 'Failed to request renewal'); } }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-caribbean-green to-tropical-lime text-white font-semibold rounded-xl hover:scale-105 transition-transform">
                      <RefreshCcw className="w-5 h-5" />Renew Free
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">Renews this free listing for another 30 days after admin approval.</p>
                  </div>
                )}

                {(listing.status === 'ACTIVE' || listing.status === 'EXPIRED') && listing.category !== 'Free Items' && (
                  <div>
                    <button onClick={async () => { try { await apiClient(`/api/listings/${listing.id}/renew`, { method: 'POST' }); toast.success('Renewal initiated. Please submit payment.'); loadListing(); } catch (err: any) { toast.error(err.message || 'Failed to initiate renewal'); } }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-trini-gold to-tropical-orange text-white font-semibold rounded-xl hover:scale-105 transition-transform">
                      <RefreshCcw className="w-5 h-5" />Renew / Pay 100 TTD
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">Submit payment proof to activate or renew this listing for 90 days.</p>
                  </div>
                )}

                {(listing.status === 'DRAFT' || listing.status === 'PENDING_FEE') && (listing.listingType === 'SELL' || listing.listingType === 'BOTH') && (
                  <button onClick={handlePayFee} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-caribbean-green to-tropical-lime text-white font-semibold rounded-xl hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />Pay Posting Fee
                  </button>
                )}

                {!isSold && (
                  <button onClick={() => router.push(`/dashboard/listings/${listingId}/edit`)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-caribbean-teal/10 text-caribbean-teal font-semibold rounded-xl hover:bg-caribbean-teal/20 transition">
                    <Edit className="w-5 h-5" />Edit Listing
                  </button>
                )}

                <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-trini-red/10 text-trini-red font-semibold rounded-xl hover:bg-trini-red/20 transition">
                  <Trash2 className="w-5 h-5" />Delete Listing
                </button>

                {!isSold && (listing.status === 'ACTIVE' || listing.status === 'PENDING_PAYMENT' || listing.status === 'PENDING_APPROVAL') && (
                  <button onClick={handleMarkAsSold} disabled={markingAsSold} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-caribbean-ocean/10 text-caribbean-ocean font-semibold rounded-xl hover:bg-caribbean-ocean/20 transition disabled:opacity-50">
                    {markingAsSold ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
                    {markingAsSold ? 'Marking...' : 'Mark as Sold'}
                  </button>
                )}
              </div>
            )}

            {/* Contact Seller (not owner, not sold) */}
            {!isOwner && listing.status === 'ACTIVE' && !isSold && (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
                <button onClick={handleContactSeller} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-caribbean-teal to-ocean-blue text-white font-semibold rounded-xl hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />Contact Seller
                </button>
                {(listing.listingType === 'SWAP' || listing.listingType === 'BOTH') && (
                  <button onClick={handleProposeSwap} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-tropical-purple to-tropical-pink text-white font-semibold rounded-xl hover:scale-105 transition-transform">
                    <ArrowRightLeft className="w-5 h-5" />Propose Swap
                  </button>
                )}
              </div>
            )}

            {/* Sold banner for non-owners */}
            {!isOwner && isSold && (
              <div className="bg-caribbean-ocean/10 border border-caribbean-ocean/20 rounded-2xl p-6 text-center">
                <ShoppingBag className="w-10 h-10 text-caribbean-ocean mx-auto mb-2" />
                <p className="font-bold text-caribbean-ocean text-lg">Item Sold</p>
                <p className="text-gray-500 text-sm mt-1">This item is no longer available.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {paymentStep === 'select' && 'Choose Payment Method'}
                {paymentStep === 'details' && 'Payment Details'}
                {paymentStep === 'upload' && 'Upload Payment Proof'}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {paymentStep === 'select' && (
              <>
                <p className="text-gray-600 mb-6">Select your preferred payment method to activate your listing.</p>
                <div className="space-y-3">
                  <button onClick={() => handleSelectPaymentMethod('PAYPAL')} disabled={processingPayment} className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-lg">PP</span></div>
                    <div className="text-left"><p className="font-semibold text-gray-900">PayPal</p><p className="text-sm text-gray-500">Fast & secure online payment</p></div>
                    <ExternalLink className="w-5 h-5 text-gray-400 ml-auto" />
                  </button>
                  <button onClick={() => handleSelectPaymentMethod('ONLINE_BANK')} disabled={processingPayment} className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-caribbean-teal hover:bg-caribbean-teal/10 transition disabled:opacity-50">
                    <div className="w-12 h-12 bg-caribbean-teal rounded-xl flex items-center justify-center"><Building className="w-6 h-6 text-white" /></div>
                    <div className="text-left"><p className="font-semibold text-gray-900">Online Bank Transfer</p><p className="text-sm text-gray-500">Transfer via internet banking</p></div>
                  </button>
                  <button onClick={() => handleSelectPaymentMethod('BANK_DEPOSIT')} disabled={processingPayment} className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-trini-gold hover:bg-trini-gold/10 transition disabled:opacity-50">
                    <div className="w-12 h-12 bg-trini-gold rounded-xl flex items-center justify-center"><Landmark className="w-6 h-6 text-trini-black" /></div>
                    <div className="text-left"><p className="font-semibold text-gray-900">Bank Deposit</p><p className="text-sm text-gray-500">Visit branch & deposit cash</p></div>
                  </button>
                </div>
                {processingPayment && <div className="flex items-center justify-center gap-2 mt-4 text-gray-600"><Loader2 className="w-5 h-5 animate-spin" />Processing...</div>}
              </>
            )}

            {paymentStep === 'details' && paymentInfo && (
              <>
                <div className="bg-gradient-to-r from-caribbean-green to-tropical-lime rounded-xl p-4 mb-6 text-white">
                  <p className="text-white/80 text-sm">Amount Due</p>
                  <p className="text-3xl font-bold">${paymentInfo.amount} {paymentInfo.currency}</p>
                  {paymentInfo.usdAmount && <p className="text-white/80 text-sm">≈ ${paymentInfo.usdAmount} USD</p>}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Payment Reference</p><p className="font-mono font-bold text-lg text-gray-900">{paymentInfo.reference}</p></div>
                    <button onClick={() => copyToClipboard(paymentInfo.reference, 'Reference')} className="p-2 hover:bg-gray-200 rounded-lg transition"><Copy className="w-5 h-5 text-gray-600" /></button>
                  </div>
                </div>
                {paymentInfo.method === 'PAYPAL' ? (
                  <>
                    <p className="text-gray-600 mb-4">Click the button below to complete payment via PayPal.</p>
                    <a href={`https://www.paypal.com/cgi-bin/webscr?...`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition mb-4">
                      Pay with PayPal<ExternalLink className="w-5 h-5" />
                    </a>
                    <p className="text-sm text-gray-500 text-center">After payment, your listing will be activated automatically.</p>
                  </>
                ) : (
                  <>
                    {paymentInfo.bankDetails && (
                      <div className="space-y-3 mb-4">
                        {[
                          { label: 'Bank Name', value: paymentInfo.bankDetails.bankName },
                          { label: 'Account Name', value: paymentInfo.bankDetails.accountName },
                          { label: 'Account Number', value: paymentInfo.bankDetails.accountNumber },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div><p className="text-sm text-gray-500">{label}</p><p className="font-semibold text-gray-900">{value}</p></div>
                            <button onClick={() => copyToClipboard(value, label)} className="p-2 hover:bg-gray-200 rounded-lg transition"><Copy className="w-4 h-4 text-gray-600" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="bg-trini-gold/10 border border-trini-gold/20 rounded-xl p-4 mb-4">
                      <p className="text-sm text-gray-700">{paymentInfo.instructions}</p>
                    </div>
                    <p className="text-sm text-gray-600 text-center mb-3">After making the transfer/deposit, upload your receipt or proof of payment.</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      disabled={uploadingProof}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-caribbean-teal to-caribbean-ocean text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingProof ? <><Loader2 className="w-5 h-5 animate-spin" />Uploading...</> : <><Upload className="w-5 h-5" />Upload Payment Proof</>}
                    </button>
                  </>
                )}
                <button onClick={() => { setPaymentStep('select'); setPaymentInfo(null); setSelectedPaymentMethod(null); }} className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-900 transition text-sm">← Choose different payment method</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Contact Seller</h3>
              <button onClick={() => setShowMessageModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-gray-600 mb-4">Send a message to {listing?.user.name} about &quot;{listing?.title}&quot;</p>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi! I'm interested in this item..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-teal resize-none" rows={4} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowMessageModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleSendMessage} disabled={sendingMessage || !message.trim()} className="flex-1 px-4 py-3 bg-gradient-to-r from-caribbean-teal to-ocean-blue text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Propose a Swap</h3>
              <button onClick={() => setShowSwapModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-gray-600 mb-4">Select one of your listings to offer in exchange for &quot;{listing?.title}&quot;</p>
            {userListings.length === 0 ? (
              <div className="text-center py-8">
                <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">You don&apos;t have any active swap listings</p>
                <Link href="/dashboard/listings/create" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-tropical-purple to-tropical-pink text-white font-semibold rounded-xl hover:opacity-90 transition">Create a Listing</Link>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {userListings.map((item) => (
                    <label key={item.id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${selectedListing === item.id ? 'border-tropical-purple bg-tropical-purple/10' : 'border-gray-200 hover:border-tropical-purple/50'}`}>
                      <input type="radio" name="swapListing" value={item.id} checked={selectedListing === item.id} onChange={(e) => setSelectedListing(e.target.value)} className="sr-only" />
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.images[0] ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0"><p className="font-semibold text-gray-900 truncate">{item.title}</p><p className="text-sm text-gray-500">{item.listingType}</p></div>
                      {selectedListing === item.id && <Check className="w-6 h-6 text-tropical-purple flex-shrink-0" />}
                    </label>
                  ))}
                </div>
                <textarea value={swapMessage} onChange={(e) => setSwapMessage(e.target.value)} placeholder="Add a message (optional)..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tropical-purple resize-none" rows={3} />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowSwapModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition">Cancel</button>
                  <button onClick={handleSubmitSwap} disabled={sendingSwap || !selectedListing} className="flex-1 px-4 py-3 bg-gradient-to-r from-tropical-purple to-tropical-pink text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {sendingSwap ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}Send Offer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
