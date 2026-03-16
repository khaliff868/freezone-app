// Category Migration Script
// Migrates listings with invalid/legacy categories to "Other"

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Valid categories (exact order - do not modify)
const VALID_CATEGORIES = [
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

async function migrateCategories() {
  console.log('🔄 Starting category migration...');
  console.log('Valid categories:', VALID_CATEGORIES.join(', '));

  // Find all listings with invalid categories
  const allListings = await prisma.listing.findMany({
    select: { id: true, category: true, title: true },
  });

  const invalidListings = allListings.filter(
    (listing) => !VALID_CATEGORIES.includes(listing.category)
  );

  if (invalidListings.length === 0) {
    console.log('✅ No listings with invalid categories found.');
    return;
  }

  console.log(`\n📋 Found ${invalidListings.length} listing(s) with invalid categories:`);
  
  const categoryMigrations: Record<string, number> = {};
  
  for (const listing of invalidListings) {
    categoryMigrations[listing.category] = (categoryMigrations[listing.category] || 0) + 1;
    console.log(`  - "${listing.title}" (${listing.category} → Other)`);
  }

  console.log('\n📊 Migration summary:');
  for (const [oldCategory, count] of Object.entries(categoryMigrations)) {
    console.log(`  - "${oldCategory}" → "Other": ${count} listing(s)`);
  }

  // Update all invalid categories to "Other"
  const result = await prisma.listing.updateMany({
    where: {
      category: {
        notIn: VALID_CATEGORIES,
      },
    },
    data: {
      category: 'Other',
    },
  });

  console.log(`\n✅ Successfully migrated ${result.count} listing(s) to "Other" category.`);
}

migrateCategories()
  .then(() => {
    console.log('\n🎉 Category migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
