// Platform Configuration Constants

export const APP_NAME = 'Freezone Swap or Sell';
export const APP_DESCRIPTION = 'Trinidad & Tobago Marketplace for Swapping and Selling';

// Currency
export const DEFAULT_CURRENCY = process.env.POSTING_FEE_CURRENCY || 'TTD';

// Posting Fee Configuration
export const POSTING_FEE_AMOUNT = parseFloat(process.env.POSTING_FEE_AMOUNT || '10');
export const POSTING_FEE_CURRENCY = process.env.POSTING_FEE_CURRENCY || 'TTD';

// Monetization Configuration
export const LISTING_FEE_AMOUNT = 100; // TTD - Fee for paid listings after trial
export const BANNER_AD_FEE_AMOUNT = 1000; // TTD - Fee for banner ads

// Expiry Configuration (in days)
export const FREE_ITEMS_EXPIRY_DAYS = 30; // Free Items expire after 30 days
export const PAID_LISTING_EXPIRY_DAYS = 90; // Paid listings expire after 90 days
export const BANNER_AD_EXPIRY_DAYS = 90; // Banner ads run for 90 days

// Trial Configuration
export const TRIAL_DURATION_DAYS = 7; // 7-day free trial for new users

// Category that requires only approval (no payment)
export const FREE_CATEGORY = 'Free Items';

// Note: Tier system has been removed. All users have equal privileges.
// Only role-based access (USER vs ADMIN) is now used.

// Categories (exact order - do not modify)
export const CATEGORIES = [
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
] as const;

// Trinidad & Tobago Locations
export const LOCATIONS = [
  'Port of Spain',
  'San Fernando',
  'Arima',
  'Chaguanas',
  'Point Fortin',
  'Sangre Grande',
  'Princes Town',
  'Mayaro',
  'Couva',
  'Tunapuna',
  'Siparia',
  'Rio Claro',
  'Penal',
  'Diego Martin',
  'La Brea',
  'Moruga',
  'Arouca',
  'Curepe',
  'St. Augustine',
  'Valsayn',
  'El Socorro',
  'Barataria',
  'San Juan',
  'Petit Valley',
  'Carapichaima',
  'Freeport',
  'Claxton Bay',
  'California',
  'Gasparillo',
  'Fyzabad',
  'Debe',
  'Barrackpore',
  'Piparo',
  'Tabaquite',
  'Biche',
  'Matura',
  'Blanchisseuse',
  'Maracas Bay',
  'Santa Cruz',
  'La Romaine',
  'Woodbrook',
  'Belmont',
  'Glencoe',
  'Longdenville',
  'Felicity',
  'Enterprise',
  'Preysal',
  'Rousillac',
  'Erin',
  'Cedros',
  'Icacos',
  'Scarborough',
  'Charlotteville',
  'Roxborough',
  'Crown Point',
  'Buccoo',
  'Bon Accord',
  'Black Rock',
  'Plymouth',
  'Castara',
  'Speyside',
  'Parlatuvier',
  'Golden Lane',
  'Lambeau',
  'Mason Hall',
  'Bethel',
  'Canaan',
  'Other',
] as const;

// Free first regular listing
export const FREE_LISTING_EXPIRY_DAYS = 7;

// Paid regular listing duration & pricing
export const REGULAR_LISTING_EXPIRY_DAYS = 180;
export const REGULAR_LISTING_PRICE = 100;
export const REGULAR_LISTING_RENEWAL_PRICE = 100;
export const REGULAR_LISTING_RENEWAL_DAYS = 180;

// Featured Listing Configuration
export const FEATURED_LISTING_PRICE = 300;
export const FEATURED_LISTING_DURATION_DAYS = 7;
export const FEATURED_LISTING_RENEWAL_PRICE = 300;
export const FEATURED_LISTING_RENEWAL_DAYS = 7;
export const FEATURED_LISTING_MAX_POOL = 12;
export const FEATURED_LISTING_VISIBLE_COUNT = 6;
export const FEATURED_LISTING_ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms

// File Upload Limits
export const MAX_IMAGES_PER_LISTING = 8;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// PayPal Configuration
export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
export const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';

// Determine PayPal API base URL based on environment
export const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
