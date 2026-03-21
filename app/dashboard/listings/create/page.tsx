'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Upload, X, Loader2, ImagePlus, Package,
  DollarSign, MapPin, FileText, Tag, ArrowRightLeft, Gift,
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
  'Auto Parts & Accessories', 'House & Land', 'Construction Materials',
  'Home & Garden', 'Furniture', 'Appliances', 'Fashion', 'Sports & Outdoors',
  'Books & Education', 'Kids & Baby', 'Services', 'Food & Catering',
  'Business & Industrial', 'Events & Tickets', 'Pets & Livestock',
  'Art & Collectibles', 'Other',
];

const HOUSE_LAND_SUBCATEGORIES = ['House', 'Land'];
const HOUSE_TRANSACTION_TYPES = ['For Sale', 'For Rent'];

const VEHICLE_MAKES = [
  'Audi', 'BMW', 'Chevrolet', 'Dodge', 'Ford', 'Honda', 'Hyundai', 'Isuzu',
  'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mini',
  'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'Subaru', 'Suzuki', 'Toyota',
  'Volkswagen', 'Volvo', 'Other',
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

export default function CreateListingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // House & Land sub-selections
  const [houseLandSubcategory, setHouseLandSubcategory] = useState('');
  const [houseTransactionType, setHouseTransactionType] = useState('');
  // Vehicles sub-selection
  const [vehicleMake, setVehicleMake] = useState('');

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isHouseLand = formData.category === 'House & Land';
  const isVehicles = formData.category === 'Vehicles';

  // Build the final category string that gets saved
  const getFinalCategory = () => {
    if (isHouseLand) {
      if (houseLandSubcategory === 'House' && houseTransactionType) {
        return `House & Land - House ${houseTransactionType}`;
      }
      if (houseLandSubcategory === 'Land') return 'House & Land - Land';
      return 'House & Land';
    }
    if (isVehicles && vehicleMake) {
      return `Vehicles - ${vehicleMake}`;
    }
    return formData.category;
  };

  // Reset sub-selections when category changes
  useEffect(() => {
    if (!isHouseLand) {
      setHouseLandSubcategory('');
      setHouseTransactionType('');
    }
    if (!isVehicles) {
      setVehicleMake('');
    }
  }, [formData.category, isHouseLand, isVehicles]);

  // Reset house transaction type when subcategory changes
  useEffect(() => {
    if (houseLandSubcategory !== 'House') {
      setHouseTransactionType('');
    }
  }, [houseLandSubcategory]);

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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
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

        const data = new FormData();
        data.append('file', file);

        const res = await fetch('/api/upload/presigned', { method: 'POST', body: data });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload failed');
        }
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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) { toast.error('Please enter a title'); return; }
    if (!formData.description.trim()) { toast.error('Please enter a description'); return; }
    if (!formData.category) { toast.error('Please select a category'); return; }

    // Validate House & Land sub-selections
    if (isHouseLand) {
      if (!houseLandSubcategory) { toast.error('Please select House or Land'); return; }
      if (houseLandSubcategory === 'House' && !houseTransactionType) {
        toast.error('Please select For Sale or For Rent'); return;
      }
    }

    // Validate Vehicles make
    if (isVehicles && !vehicleMake) {
      toast.error('Please select a vehicle make'); return;
    }

    if (!formData.condition) { toast.error('Please select a condition'); return; }
    if (!formData.location) { toast.error('Please select a location'); return; }
    if ((formData.listingType === 'SELL' || formData.listingType === 'BOTH') && !formData.price) {
      toast.error('Please enter a price'); return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        category: getFinalCategory(),
        price: formData.listingType === 'FREE' ? null : (formData.price ? parseFloat(formData.price) : null),
        images,
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create listing');
      }

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
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6" />Create New Listing
            </CardTitle>
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
                        <button type="button" onClick={() => removeImage(index)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600">
                          <X className="w-4 h-4" />
                        </button>
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
                <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />Title
                </Label>
                <Input
                  id="title"
                  placeholder={formData.listingType === 'FREE' ? 'FREE - What item are you giving away?' : 'What are you selling/swapping?'}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={100}
                />
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
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4" />Condition
                  </Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((cond) => (
                        <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* House & Land Sub-dropdowns */}
              {isHouseLand && (
                <div className="space-y-4 p-4 bg-trini-gold/10 border border-trini-gold/20 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    🏠 House & Land Details
                  </p>

                  {/* House or Land */}
                  <div>
                    <Label className="text-sm mb-2 block">Property Type</Label>
                    <Select value={houseLandSubcategory} onValueChange={setHouseLandSubcategory}>
                      <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
                      <SelectContent>
                        {HOUSE_LAND_SUBCATEGORIES.map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* For Sale or For Rent — only shown when House is selected */}
                  {houseLandSubcategory === 'House' && (
                    <div>
                      <Label className="text-sm mb-2 block">Transaction Type</Label>
                      <Select value={houseTransactionType} onValueChange={setHouseTransactionType}>
                        <SelectTrigger><SelectValue placeholder="For Sale or For Rent?" /></SelectTrigger>
                        <SelectContent>
                          {HOUSE_TRANSACTION_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Summary label */}
                  {getFinalCategory() !== 'House & Land' && (
                    <p className="text-xs text-gray-500">
                      Will be saved as: <span className="font-semibold text-gray-700">{getFinalCategory()}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Vehicles make dropdown */}
              {isVehicles && (
                <div className="space-y-4 p-4 bg-trini-red/5 border border-trini-red/20 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    🚗 Vehicle Details
                  </p>
                  <div>
                    <Label className="text-sm mb-2 block">Make / Brand</Label>
                    <Select value={vehicleMake} onValueChange={setVehicleMake}>
                      <SelectTrigger><SelectValue placeholder="Select vehicle make" /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_MAKES.map((make) => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {vehicleMake && (
                    <p className="text-xs text-gray-500">
                      Will be saved as: <span className="font-semibold text-gray-700">Vehicles - {vehicleMake}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Location */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />Location
                </Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Listing Type */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className="w-4 h-4" />Listing Type
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {LISTING_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => {
                        let newTitle = prev.title;
                        if (type.value === 'FREE' && !prev.title.startsWith('FREE - ')) newTitle = 'FREE - ' + prev.title;
                        if (type.value !== 'FREE' && prev.title.startsWith('FREE - ')) newTitle = prev.title.replace('FREE - ', '');
                        return {
                          ...prev,
                          listingType: type.value,
                          title: newTitle,
                          ...(type.value === 'FREE' || type.value === 'SWAP' ? { price: '' } : {}),
                        };
                      })}
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
                    <DollarSign className="w-4 h-4" />
                    {isHouseLand && houseTransactionType === 'For Rent' ? 'Monthly Rent (TTD)' : 'Price (TTD)'}
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
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} disabled={submitting} className="flex-1">
                  Cancel
                </Button>
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
