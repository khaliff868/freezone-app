'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Upload, X, Loader2, ImagePlus, Package,
  DollarSign, MapPin, FileText, Tag, ArrowRightLeft, Gift, Star, ShoppingBag, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Swaps', 'Free Items', 'Beauty & Personal Care', 'Electronics', 'Vehicles',
  'Auto Parts & Accessories', 'House/Land', 'Construction Materials',
  'Home & Garden', 'Furniture', 'Appliances', 'Fashion', 'Sports & Outdoors',
  'Books & Education', 'Kids & Baby', 'Services', 'Food & Catering',
  'Business & Industrial', 'Events & Tickets', 'Pets & Livestock',
  'Art & Collectibles', 'Other',
];

const HOUSE_LAND_SUBCATEGORIES = ['House', 'Land'];
const HOUSE_TRANSACTION_TYPES = ['For Sale', 'For Rent'];

const VEHICLE_HIERARCHY: Record<string, string[]> = {
  Cars: [
    'Audi', 'BMW', 'Chevrolet', 'Dodge', 'Ford', 'Honda', 'Hyundai', 'Isuzu',
    'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mini',
    'Mitsubishi', 'Nissan', 'Other', 'Peugeot', 'Porsche', 'Subaru', 'Suzuki',
    'Toyota', 'Volkswagen', 'Volvo',
  ],
  SUVs: [
    'Audi', 'BMW', 'Chevrolet', 'Ford', 'Honda', 'Hyundai', 'Isuzu', 'Jeep',
    'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mitsubishi',
    'Nissan', 'Other', 'Subaru', 'Suzuki', 'Toyota', 'Volkswagen',
  ],
  Vans: [
    'Ford', 'Hyundai', 'Isuzu', 'Kia', 'Mercedes-Benz', 'Mitsubishi',
    'Nissan', 'Other', 'Peugeot', 'Suzuki', 'Toyota', 'Volkswagen',
  ],
  Trucks: [
    'Chevrolet', 'Dodge', 'Ford', 'Isuzu', 'Jeep', 'Mazda', 'Mercedes-Benz',
    'Mitsubishi', 'Nissan', 'Other', 'Toyota', 'Volkswagen',
  ],
};
const VEHICLE_TYPES = Object.keys(VEHICLE_HIERARCHY);

const PREMIUM_CATEGORIES = ['House/Land', 'Business & Industrial', 'Vehicles'];

function isPremiumCategory(category: string): boolean {
  return PREMIUM_CATEGORIES.some(
    p => category === p || category.startsWith(`${p} - `) || category.startsWith(`${p} -`)
  );
}

function getRegularPrice(category: string): number {
  return isPremiumCategory(category) ? 100 : 25;
}

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
  { value: 'FREE', label: 'Give Away Free', icon: Gift, description: 'Give item away for free' },
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
type ListingPlan = 'FEATURED' | 'REGULAR';

type FormErrors = {
  title?: string;
  description?: string;
  category?: string;
  houseLandSubcategory?: string;
  houseTransactionType?: string;
  vehicleType?: string;
  vehicleMake?: string;
  condition?: string;
  location?: string;
  price?: string;
  swapTerms?: string;
  plan?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />{message}
    </p>
  );
}

export default function CreateListingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    title: '', description: '', category: '', condition: '',
    listingType: 'SELL', price: '', currency: 'TTD', location: '', swapTerms: '',
  });

  const [houseLandSubcategory, setHouseLandSubcategory] = useState('');
  const [houseTransactionType, setHouseTransactionType] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<ListingPlan | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const isHouseLand = formData.category === 'House/Land';
  const isVehicles = formData.category === 'Vehicles';
  const isFreeItems = formData.category === 'Free Items';
  const isFreeType = formData.listingType === 'FREE';
  const showPlanSelector = !isFreeItems && !isFreeType;
  const availableMakes = vehicleType ? VEHICLE_HIERARCHY[vehicleType] || [] : [];
  const regularPrice = getRegularPrice(formData.category);

  const getFinalCategory = () => {
    if (isHouseLand) {
      if (houseLandSubcategory === 'House' && houseTransactionType) return `House/Land - House ${houseTransactionType}`;
      if (houseLandSubcategory === 'Land') return 'House/Land - Land';
      return 'House/Land';
    }
    if (isVehicles) {
      if (vehicleType && vehicleMake) return `Vehicles - ${vehicleType} - ${vehicleMake}`;
      if (vehicleType) return `Vehicles - ${vehicleType}`;
      return 'Vehicles';
    }
    return formData.category;
  };

  useEffect(() => {
    if (!isHouseLand) { setHouseLandSubcategory(''); setHouseTransactionType(''); }
    if (!isVehicles) { setVehicleType(''); setVehicleMake(''); }
  }, [formData.category, isHouseLand, isVehicles]);

  useEffect(() => {
    if (houseLandSubcategory !== 'House') setHouseTransactionType('');
  }, [houseLandSubcategory]);

  useEffect(() => { setVehicleMake(''); }, [vehicleType]);

  useEffect(() => {
    if (isFreeItems || isFreeType) setSelectedPlan(null);
  }, [isFreeItems, isFreeType]);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    const categoryParam = searchParams.get('category');
    if (typeParam || categoryParam) {
      setFormData(prev => ({
        ...prev,
        ...(typeParam && ['SELL', 'SWAP', 'BOTH', 'FREE'].includes(typeParam) ? { listingType: typeParam } : {}),
        ...(categoryParam && CATEGORIES.includes(categoryParam) ? { category: categoryParam } : {}),
      }));
    }
  }, [searchParams]);

  // Clear field error when user fixes it
  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (status === 'unauthenticated') { router.push('/auth/login'); return null; }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) { toast.error(`Maximum ${MAX_IMAGES} images allowed`); return; }
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);
    try {
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not an image`); continue; }
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
        const data = new FormData();
        data.append('file', file);
        const res = await fetch('/api/upload/presigned', { method: 'POST', body: data });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Upload failed'); }
        const { publicUrl } = await res.json();
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

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 50) {
      newErrors.title = 'Title cannot exceed 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (isHouseLand) {
      if (!houseLandSubcategory) newErrors.houseLandSubcategory = 'Please select House or Land';
      else if (houseLandSubcategory === 'House' && !houseTransactionType) {
        newErrors.houseTransactionType = 'Please select For Sale or For Rent';
      }
    }

    if (isVehicles) {
      if (!vehicleType) newErrors.vehicleType = 'Please select a vehicle type';
      else if (!vehicleMake) newErrors.vehicleMake = 'Please select a vehicle make';
    }

    if (!formData.condition) {
      newErrors.condition = 'Please select a condition';
    }

    if (!formData.location) {
      newErrors.location = 'Please select a location';
    }

    if ((formData.listingType === 'SELL' || formData.listingType === 'BOTH') && !formData.price) {
      newErrors.price = 'Price is required';
    }

    if ((formData.listingType === 'SWAP' || formData.listingType === 'BOTH') && formData.swapTerms.trim().length > 0) {
      if (formData.swapTerms.trim().length < 3) newErrors.swapTerms = 'Swap terms must be at least 3 characters';
      else if (formData.swapTerms.trim().length > 500) newErrors.swapTerms = 'Swap terms cannot exceed 500 characters';
    }

    if (showPlanSelector && !selectedPlan) {
      newErrors.plan = 'Please select a listing plan';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0];
      const el = document.getElementById(firstErrorField) || document.querySelector(`[data-field="${firstErrorField}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error('Please fill in all required fields');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        category: getFinalCategory(),
        price: formData.listingType === 'FREE' ? null : (formData.price ? parseFloat(formData.price) : null),
        swapTerms: formData.swapTerms.trim() || null,
        images,
        plan: selectedPlan,
      };
      const res = await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Failed to create listing'); }
      const data = await res.json();
      toast.success('Listing created! Pay the listing fee to publish.');
      router.push(`/dashboard/listings/${data.listing.id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-6">
          <ArrowLeft className="w-4 h-4" />Back to Dashboard
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="w-6 h-6" />Create New Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Images */}
              <div>
                <Label className="flex items-center gap-2 mb-2"><ImagePlus className="w-4 h-4" />Photos (up to {MAX_IMAGES})</Label>
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      <Image src={img} alt={`Image ${index + 1}`} fill className="object-cover" />
                      {index === 0 && <span className="absolute top-1 left-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Main</span>}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button type="button" onClick={() => removeImage(index)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><X className="w-4 h-4" /></button>
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
                <p className="text-xs text-muted-foreground mt-2">First image will be the main listing photo.</p>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title" className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4" />Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="What are you selling, swapping or giving free?"
                  value={formData.title}
                  onChange={(e) => { setFormData(prev => ({ ...prev, title: e.target.value })); clearError('title'); }}
                  minLength={3}
                  maxLength={50}
                  className={cn(errors.title && 'border-red-500 focus-visible:ring-red-500')}
                />
                <div className="flex items-center justify-between mt-1">
                  <FieldError message={errors.title} />
                  <p className="text-xs text-muted-foreground ml-auto">{formData.title.length}/50</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4" />Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail..."
                  value={formData.description}
                  onChange={(e) => { setFormData(prev => ({ ...prev, description: e.target.value })); clearError('description'); }}
                  rows={4}
                  maxLength={500}
                  className={cn(errors.description && 'border-red-500 focus-visible:ring-red-500')}
                />
                <div className="flex items-center justify-between mt-1">
                  <FieldError message={errors.description} />
                  <p className="text-xs text-muted-foreground ml-auto">{formData.description.length}/500</p>
                </div>
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div data-field="category">
                  <Label className="flex items-center gap-2 mb-2"><Tag className="w-4 h-4" />Category <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => { setFormData(prev => ({ ...prev, category: value })); clearError('category'); }}
                  >
                    <SelectTrigger className={cn(errors.category && 'border-red-500 ring-1 ring-red-500')}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>{CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                  </Select>
                  <FieldError message={errors.category} />
                </div>
                <div data-field="condition">
                  <Label className="flex items-center gap-2 mb-2"><Package className="w-4 h-4" />Condition <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => { setFormData(prev => ({ ...prev, condition: value })); clearError('condition'); }}
                  >
                    <SelectTrigger className={cn(errors.condition && 'border-red-500 ring-1 ring-red-500')}>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>{CONDITIONS.map((cond) => <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FieldError message={errors.condition} />
                </div>
              </div>

              {/* House/Land */}
              {isHouseLand && (
                <div className="space-y-4 p-4 bg-trini-gold/10 border border-trini-gold/20 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">🏠 House/Land Details</p>
                  <div data-field="houseLandSubcategory">
                    <Label className="text-sm mb-2 block">Property Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={houseLandSubcategory}
                      onValueChange={(v) => { setHouseLandSubcategory(v); clearError('houseLandSubcategory'); }}
                    >
                      <SelectTrigger className={cn(errors.houseLandSubcategory && 'border-red-500 ring-1 ring-red-500')}>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>{HOUSE_LAND_SUBCATEGORIES.map((sub) => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}</SelectContent>
                    </Select>
                    <FieldError message={errors.houseLandSubcategory} />
                  </div>
                  {houseLandSubcategory === 'House' && (
                    <div data-field="houseTransactionType">
                      <Label className="text-sm mb-2 block">Transaction Type <span className="text-red-500">*</span></Label>
                      <Select
                        value={houseTransactionType}
                        onValueChange={(v) => { setHouseTransactionType(v); clearError('houseTransactionType'); }}
                      >
                        <SelectTrigger className={cn(errors.houseTransactionType && 'border-red-500 ring-1 ring-red-500')}>
                          <SelectValue placeholder="For Sale or For Rent?" />
                        </SelectTrigger>
                        <SelectContent>{HOUSE_TRANSACTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <FieldError message={errors.houseTransactionType} />
                    </div>
                  )}
                  {getFinalCategory() !== 'House/Land' && (
                    <p className="text-xs text-gray-500">Will be saved as: <span className="font-semibold text-gray-700">{getFinalCategory()}</span></p>
                  )}
                </div>
              )}

              {/* Vehicles */}
              {isVehicles && (
                <div className="space-y-4 p-4 bg-trini-red/5 border border-trini-red/20 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">🚗 Vehicle Details</p>
                  <div data-field="vehicleType">
                    <Label className="text-sm mb-2 block">Vehicle Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={vehicleType}
                      onValueChange={(v) => { setVehicleType(v); clearError('vehicleType'); }}
                    >
                      <SelectTrigger className={cn(errors.vehicleType && 'border-red-500 ring-1 ring-red-500')}>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>{VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <FieldError message={errors.vehicleType} />
                  </div>
                  {vehicleType && (
                    <div data-field="vehicleMake">
                      <Label className="text-sm mb-2 block">Make / Brand <span className="text-red-500">*</span></Label>
                      <Select
                        value={vehicleMake}
                        onValueChange={(v) => { setVehicleMake(v); clearError('vehicleMake'); }}
                      >
                        <SelectTrigger className={cn(errors.vehicleMake && 'border-red-500 ring-1 ring-red-500')}>
                          <SelectValue placeholder="Select make" />
                        </SelectTrigger>
                        <SelectContent>{availableMakes.map((make) => <SelectItem key={make} value={make}>{make}</SelectItem>)}</SelectContent>
                      </Select>
                      <FieldError message={errors.vehicleMake} />
                    </div>
                  )}
                  {vehicleType && vehicleMake && (
                    <p className="text-xs text-gray-500">Will be saved as: <span className="font-semibold text-gray-700">Vehicles › {vehicleType} › {vehicleMake}</span></p>
                  )}
                </div>
              )}

              {/* Location */}
              <div data-field="location">
                <Label className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4" />Location <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => { setFormData(prev => ({ ...prev, location: value })); clearError('location'); }}
                >
                  <SelectTrigger className={cn(errors.location && 'border-red-500 ring-1 ring-red-500')}>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>{LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
                </Select>
                <FieldError message={errors.location} />
              </div>

              {/* Listing Type */}
              <div>
                <Label className="flex items-center gap-2 mb-2"><ArrowRightLeft className="w-4 h-4" />Listing Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {LISTING_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => {
                        let newTitle = prev.title;
                        if (type.value === 'FREE' && !prev.title.startsWith('FREE - ')) newTitle = 'FREE - ' + prev.title;
                        if (type.value !== 'FREE' && prev.title.startsWith('FREE - ')) newTitle = prev.title.replace('FREE - ', '');
                        return { ...prev, listingType: type.value, title: newTitle, ...(type.value === 'FREE' || type.value === 'SWAP' ? { price: '' } : {}) };
                      })}
                      className={cn('p-3 rounded-lg border-2 transition-all text-left', formData.listingType === type.value ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30')}
                    >
                      <type.icon className={cn('w-5 h-5 mb-1', formData.listingType === type.value ? 'text-primary' : type.value === 'FREE' ? 'text-green-600' : 'text-muted-foreground')} />
                      <div className={cn('font-medium text-sm', type.value === 'FREE' ? 'text-green-600' : '')}>{type.label}</div>
                      <div className={cn('text-xs', type.value === 'FREE' ? 'text-green-500' : 'text-muted-foreground')}>{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              {(formData.listingType === 'SELL' || formData.listingType === 'BOTH') && (
                <div>
                  <Label htmlFor="price" className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" />
                    {isHouseLand && houseTransactionType === 'For Rent' ? 'Monthly Rent (TTD)' : 'Price (TTD)'}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => { setFormData(prev => ({ ...prev, price: e.target.value })); clearError('price'); }}
                    className={cn(errors.price && 'border-red-500 focus-visible:ring-red-500')}
                  />
                  <FieldError message={errors.price} />
                </div>
              )}

              {/* Swap Terms */}
              {(formData.listingType === 'SWAP' || formData.listingType === 'BOTH') && (
                <div>
                  <Label htmlFor="swapTerms" className="flex items-center gap-2 mb-2"><ArrowRightLeft className="w-4 h-4" />What would you swap for?</Label>
                  <Textarea
                    id="swapTerms"
                    placeholder="Describe what items you'd accept in trade..."
                    value={formData.swapTerms}
                    onChange={(e) => { setFormData(prev => ({ ...prev, swapTerms: e.target.value })); clearError('swapTerms'); }}
                    rows={2}
                    minLength={3}
                    maxLength={500}
                    className={cn(errors.swapTerms && 'border-red-500 focus-visible:ring-red-500')}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <FieldError message={errors.swapTerms} />
                    <p className="text-xs text-muted-foreground ml-auto">{formData.swapTerms.length}/500</p>
                  </div>
                </div>
              )}

              {/* Plan Selector */}
              {showPlanSelector && (
                <div data-field="plan">
                  <Label className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4" />Listing Plan <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Featured */}
                    <button
                      type="button"
                      onClick={() => { setSelectedPlan('FEATURED'); clearError('plan'); }}
                      className={cn(
                        'text-left p-4 rounded-xl border-2 transition-all',
                        selectedPlan === 'FEATURED' ? 'border-trini-gold bg-trini-gold/5' : errors.plan ? 'border-red-400' : 'border-muted hover:border-trini-gold/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className={cn('w-4 h-4', selectedPlan === 'FEATURED' ? 'text-trini-gold fill-trini-gold' : 'text-muted-foreground')} />
                          <span className="font-semibold text-sm">Featured</span>
                          <span className="text-xs px-1.5 py-0.5 bg-trini-gold text-trini-black font-bold rounded-full">POPULAR</span>
                        </div>
                        <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0', selectedPlan === 'FEATURED' ? 'border-trini-gold bg-trini-gold' : 'border-muted-foreground')}>
                          {selectedPlan === 'FEATURED' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-trini-gold">$300 <span className="text-sm font-normal text-muted-foreground">TTD</span></p>
                      <p className="text-xs text-muted-foreground mt-1">30 days • Priority placement • Featured badge</p>
                    </button>

                    {/* Regular */}
                    <button
                      type="button"
                      onClick={() => { setSelectedPlan('REGULAR'); clearError('plan'); }}
                      className={cn(
                        'text-left p-4 rounded-xl border-2 transition-all',
                        selectedPlan === 'REGULAR' ? 'border-caribbean-teal bg-caribbean-teal/5' : errors.plan ? 'border-red-400' : 'border-muted hover:border-caribbean-teal/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className={cn('w-4 h-4', selectedPlan === 'REGULAR' ? 'text-caribbean-teal' : 'text-muted-foreground')} />
                          <span className="font-semibold text-sm">Regular</span>
                        </div>
                        <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0', selectedPlan === 'REGULAR' ? 'border-caribbean-teal bg-caribbean-teal' : 'border-muted-foreground')}>
                          {selectedPlan === 'REGULAR' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-caribbean-teal">${regularPrice} <span className="text-sm font-normal text-muted-foreground">TTD</span></p>
                      <p className="text-xs text-muted-foreground mt-1">90 days • Standard listing • Browse & search</p>
                      {isPremiumCategory(formData.category) && (
                        <p className="text-xs text-muted-foreground/70 mt-1">* Higher rate for {formData.category.split(' - ')[0]}</p>
                      )}
                    </button>
                  </div>
                  <FieldError message={errors.plan} />
                  {selectedPlan && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      ✓ {selectedPlan === 'FEATURED' ? 'Featured plan — $300 TTD / 30 days' : `Regular plan — $${regularPrice} TTD / 90 days`}
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} disabled={submitting} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : 'Create Listing'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
