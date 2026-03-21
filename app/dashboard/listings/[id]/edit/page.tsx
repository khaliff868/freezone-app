'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  ImagePlus,
  Package,
  DollarSign,
  MapPin,
  FileText,
  Tag,
  ArrowRightLeft,
  GripVertical,
  Gift,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Swaps',
  'Free Items',
  'Beauty & Personal Care',
  'Electronics',
  'Vehicles',
  'Auto Parts & Accessories',
  'Real Estate',
  'Construction Materials',
  'Home & Garden',
  'Furniture',
  'Appliances',
  'Fashion',
  'Sports & Outdoors',
  'Books & Education',
  'Kids & Baby',
  'Services',
  'Food & Catering',
  'Business & Industrial',
  'Events & Tickets',
  'Pets & Livestock',
  'Art & Collectibles',
  'Other',
];

const CONDITIONS = [
  { value: 'NEW', label: 'New', description: 'Brand new, never used' },
  { value: 'LIKE_NEW', label: 'Like New', description: 'Barely used, excellent condition' },
  { value: 'GOOD', label: 'Good', description: 'Minor wear, fully functional' },
  { value: 'FAIR', label: 'Fair', description: 'Visible wear, works properly' },
  { value: 'POOR', label: 'Poor', description: 'Heavy wear, may need repairs' },
];

const LISTING_TYPES = [
  { value: 'SELL', label: 'Sell Only', icon: DollarSign, description: 'Accept money only' },
  { value: 'SWAP', label: 'Swap Only', icon: ArrowRightLeft, description: 'Trade for other items' },
  { value: 'BOTH', label: 'Sell or Swap', icon: Package, description: 'Open to both options' },
  { value: 'FREE', label: 'Free Item', icon: Gift, description: 'Give away for free' },
];

const LOCATIONS = [
  'Port of Spain', 'San Fernando', 'Arima', 'Chaguanas', 'Point Fortin',
  'Sangre Grande', 'Princes Town', 'Mayaro', 'Couva', 'Tunapuna', 'Siparia',
  'Rio Claro', 'Penal', 'Diego Martin', 'La Brea', 'Moruga', 'Arouca', 'Curepe',
  'St. Augustine', 'Valsayn', 'El Socorro', 'Barataria', 'San Juan', 'Petit Valley',
  'Carapichaima', 'Freeport', 'Claxton Bay', 'California', 'Gasparillo', 'Fyzabad',
  'Debe', 'Barrackpore', 'Piparo', 'Tabaquite', 'Biche', 'Matura', 'Blanchisseuse',
  'Maracas Bay', 'Santa Cruz', 'La Romaine', 'Woodbrook', 'Belmont', 'Glencoe',
  'Longdenville', 'Felicity', 'Enterprise', 'Preysal', 'Rousillac', 'Erin', 'Cedros',
  'Icacos', 'Scarborough', 'Charlotteville', 'Roxborough', 'Crown Point', 'Buccoo',
  'Bon Accord', 'Black Rock', 'Plymouth', 'Castara', 'Speyside', 'Parlatuvier',
  'Golden Lane', 'Lambeau', 'Mason Hall', 'Bethel', 'Canaan', 'Other',
];

const MAX_IMAGES = 8;

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
  featuredUntil: string | null;
  boosted: boolean;
  boostedUntil: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
  activatedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    tier: string;
  };
};

export default function EditListingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const listingId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    listingType: 'SELL',
    price: '',
    currency: 'TTD',
    location: '',
    swapTerms: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (listingId && session?.user) {
      loadListing();
    }
  }, [listingId, session]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/listings/${listingId}`);
      if (!res.ok) throw new Error('Failed to load listing');
      const data = await res.json();
      const listingData = data.listing as Listing;

      if (listingData.user.id !== session?.user?.id && (session?.user as any)?.role !== 'ADMIN') {
        toast.error('You do not have permission to edit this listing');
        router.push('/dashboard');
        return;
      }

      setListing(listingData);
      setFormData({
        title: listingData.title || '',
        description: listingData.description || '',
        category: listingData.category || '',
        condition: listingData.condition || '',
        listingType: listingData.listingType || 'SELL',
        price: listingData.price?.toString() || '',
        currency: listingData.currency || 'TTD',
        location: listingData.location || '',
        swapTerms: listingData.swapTerms || '',
      });
      setImages(listingData.images || []);
    } catch (error) {
      console.error('Error loading listing:', error);
      toast.error('Failed to load listing');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.category === 'Free Items' && formData.listingType !== 'FREE') {
      setFormData(prev => ({ ...prev, listingType: 'FREE', price: '0' }));
    }
    if (formData.listingType === 'FREE' && formData.category !== 'Free Items') {
      setFormData(prev => ({ ...prev, category: 'Free Items', price: '0' }));
    }
    if (formData.listingType === 'FREE' && formData.price !== '0') {
      setFormData(prev => ({ ...prev, price: '0' }));
    }
  }, [formData.category, formData.listingType]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Listing not found</p>
          <Link href="/dashboard" className="text-primary hover:underline mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not an image`); continue; }
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }

        const presignedRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
        });

        if (!presignedRes.ok) throw new Error('Failed to get upload URL');

        const { uploadUrl, cloud_storage_path } = await presignedRes.json();
        const uploadHeaders: HeadersInit = { 'Content-Type': file.type };
        if (uploadUrl.includes('content-disposition')) uploadHeaders['Content-Disposition'] = 'attachment';

        const uploadRes = await fetch(uploadUrl, { method: 'PUT', headers: uploadHeaders, body: file });
        if (!uploadRes.ok) throw new Error('Failed to upload image');

        const publicUrl = `https://i.ytimg.com/vi/OCAHPLWG4kI/maxresdefault.jpg`;
        setImages(prev => [...prev, publicUrl]);
      }
      toast.success('Image(s) uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === images.length - 1)) return;
    const newImages = [...images];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) { toast.error('Please enter a title'); return; }
    if (formData.title.trim().length < 3) { toast.error('Title must be between 3 and 50 characters'); return; }
    if (formData.title.trim().length > 50) { toast.error('Title must be between 3 and 50 characters'); return; }
    if (!formData.description.trim()) { toast.error('Please enter a description'); return; }
    if (!formData.category) { toast.error('Please select a category'); return; }
    if (!formData.condition) { toast.error('Please select a condition'); return; }
    if (!formData.location) { toast.error('Please select a location'); return; }
    if ((formData.listingType === 'SELL' || formData.listingType === 'BOTH') && !formData.price) {
      toast.error('Please enter a price'); return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, any> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        listingType: formData.listingType,
        location: formData.location,
        currency: formData.currency,
        images,
      };

      if (formData.listingType === 'SELL' || formData.listingType === 'BOTH') {
        payload.price = parseFloat(formData.price) || null;
      } else {
        payload.price = null;
      }

      if (formData.listingType === 'SWAP' || formData.listingType === 'BOTH') {
        payload.swapTerms = formData.swapTerms.trim() || null;
      } else {
        payload.swapTerms = null;
      }

      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update listing');
      }

      toast.success('Listing updated successfully');
      router.push(`/dashboard/listings/${listingId}`);
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href={`/dashboard/listings/${listingId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-6">
          <ArrowLeft className="w-4 h-4" />Back to Listing
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6" />Edit Listing
            </CardTitle>
            {listing.status && (
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium">{listing.status.replace('_', ' ')}</span>
                {' • '}Editing will not change the listing status.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Images */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <ImagePlus className="w-4 h-4" />Photos (up to {MAX_IMAGES})
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      <Image src={img} alt={`Image ${index + 1}`} fill className="object-cover" />
                      {index === 0 && (
                        <span className="absolute top-1 left-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Main</span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {index > 0 && (
                          <button type="button" onClick={() => moveImage(index, 'up')} className="p-1 bg-white/80 text-gray-800 rounded hover:bg-white" title="Move left">←</button>
                        )}
                        <button type="button" onClick={() => removeImage(index)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600">
                          <X className="w-4 h-4" />
                        </button>
                        {index < images.length - 1 && (
                          <button type="button" onClick={() => moveImage(index, 'down')} className="p-1 bg-white/80 text-gray-800 rounded hover:bg-white" title="Move right">→</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary">
                      {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Upload className="w-6 h-6" /><span className="text-xs">Add</span></>}
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">First image will be the main listing photo. Use arrows to reorder.</p>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />Title
                </Label>
                <Input
                  id="title"
                  placeholder="What are you selling, swapping or giving free?"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  minLength={3}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/50 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4" />Category
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4" />Condition
                  </Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((cond) => <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />Location
                </Label>
                <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Listing Type */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className="w-4 h-4" />Listing Type
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {LISTING_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, listingType: type.value }))}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-left',
                        formData.listingType === type.value ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
                      )}
                    >
                      <type.icon className={cn('w-5 h-5 mb-1', formData.listingType === type.value ? 'text-primary' : 'text-muted-foreground')} />
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              {(formData.listingType === 'SELL' || formData.listingType === 'BOTH') && (
                <div>
                  <Label htmlFor="price" className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" />Price (TTD)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              )}

              {/* Free Item notice */}
              {formData.listingType === 'FREE' && (
                <div className="p-4 bg-caribbean-green/10 border border-caribbean-green/30 rounded-xl">
                  <div className="flex items-center gap-2 text-caribbean-green font-semibold mb-1">
                    <Gift className="w-5 h-5" />Free Item
                  </div>
                  <p className="text-sm text-gray-600">This item is free. No payment is required.</p>
                  <p className="text-xs text-gray-500 mt-1">Price: <span className="font-semibold">0 TTD</span> • Expires after 30 days • Admin approval required</p>
                </div>
              )}

              {/* Swap Terms */}
              {(formData.listingType === 'SWAP' || formData.listingType === 'BOTH') && (
                <div>
                  <Label htmlFor="swapTerms" className="flex items-center gap-2 mb-2">
                    <ArrowRightLeft className="w-4 h-4" />What would you swap for?
                  </Label>
                  <Textarea
                    id="swapTerms"
                    placeholder="Describe what items you'd accept in trade..."
                    value={formData.swapTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, swapTerms: e.target.value }))}
                    rows={2}
                  />
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/listings/${listingId}`)} disabled={submitting} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
