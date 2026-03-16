// Database Seed Script
// Populates database with test data including admin, users, listings, payments, and swaps

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.swapDeal.deleteMany();
  await prisma.swapOffer.deleteMany();
  await prisma.feePayment.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      tier: 'BUSINESS',
      subscriptionStatus: 'ACTIVE',
      phone: '868-555-0001',
      location: 'Port of Spain',
      verified: true,
    },
  });

  // Create default test user
  console.log('👤 Creating default test user...');
  const testPassword = await hash('johndoe123', 12);
  const testUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: testPassword,
      name: 'John Doe',
      role: 'ADMIN',
      tier: 'PRO',
      subscriptionStatus: 'ACTIVE',
      phone: '868-555-0000',
      location: 'San Fernando',
      verified: true,
    },
  });

  // Create sample users with different tiers
  console.log('👥 Creating sample users...');
  const userPassword = await hash('password123', 12);

  const freeUser = await prisma.user.create({
    data: {
      email: 'free@user.com',
      password: userPassword,
      name: 'Marcus Williams',
      role: 'USER',
      tier: 'FREE',
      subscriptionStatus: 'NONE',
      phone: '868-555-1001',
      location: 'Chaguanas',
      sellListingsThisMonth: 1,
      monthlyResetAt: new Date(),
    },
  });

  const basicUser = await prisma.user.create({
    data: {
      email: 'basic@user.com',
      password: userPassword,
      name: 'Keisha Ramkissoon',
      role: 'USER',
      tier: 'BASIC',
      subscriptionStatus: 'ACTIVE',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      phone: '868-555-1002',
      location: 'Arima',
      sellListingsThisMonth: 2,
      monthlyResetAt: new Date(),
    },
  });

  const proUser = await prisma.user.create({
    data: {
      email: 'pro@user.com',
      password: userPassword,
      name: 'Anil Doodnath',
      role: 'USER',
      tier: 'PRO',
      subscriptionStatus: 'ACTIVE',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      phone: '868-555-1003',
      location: 'Diego Martin',
      verified: true,
      sellListingsThisMonth: 5,
      monthlyResetAt: new Date(),
    },
  });

  const businessUser = await prisma.user.create({
    data: {
      email: 'business@user.com',
      password: userPassword,
      name: 'TT Electronics Ltd',
      role: 'USER',
      tier: 'BUSINESS',
      subscriptionStatus: 'ACTIVE',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      phone: '868-555-1004',
      location: 'San Fernando',
      verified: true,
      sellListingsThisMonth: 10,
      monthlyResetAt: new Date(),
    },
  });

  // Additional users for variety
  const extraUser1 = await prisma.user.create({
    data: {
      email: 'trini_seller@gmail.com',
      password: userPassword,
      name: 'Shelly-Ann Baptiste',
      role: 'USER',
      tier: 'PRO',
      subscriptionStatus: 'ACTIVE',
      phone: '868-555-2001',
      location: 'Tobago',
      verified: true,
    },
  });

  const extraUser2 = await prisma.user.create({
    data: {
      email: 'island_trader@yahoo.com',
      password: userPassword,
      name: 'Ravi Moonilal',
      role: 'USER',
      tier: 'BASIC',
      subscriptionStatus: 'ACTIVE',
      phone: '868-555-2002',
      location: 'Point Fortin',
    },
  });

  // Create sample listings - LOTS MORE!
  console.log('📝 Creating sample listings...');

  // Electronics
  await prisma.listing.create({
    data: {
      userId: proUser.id,
      title: 'iPhone 14 Pro Max - Like New',
      description: 'Excellent condition iPhone 14 Pro Max, 256GB, Space Black. Includes original box, charger, and case. No scratches, battery health 98%. Perfect for anyone looking for a premium phone!',
      category: 'Electronics',
      condition: 'LIKE_NEW',
      location: 'Diego Martin',
      price: 6500,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: businessUser.id,
      title: 'Samsung 65" 4K Smart TV',
      description: 'Brand new Samsung 65-inch 4K UHD Smart TV. Crystal clear display, built-in apps, voice control. Still in original packaging with warranty. Perfect for movie nights!',
      category: 'Electronics',
      condition: 'NEW',
      location: 'San Fernando',
      price: 4800,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      featured: true,
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: freeUser.id,
      title: 'PS5 Console + 3 Games',
      description: 'PlayStation 5 console in great condition with 3 popular games: Spider-Man, God of War, and FIFA 24. Looking to swap for Xbox Series X or gaming laptop.',
      category: 'Electronics',
      condition: 'GOOD',
      location: 'Chaguanas',
      listingType: 'SWAP',
      swapTerms: 'Looking for Xbox Series X with games or a decent gaming laptop',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: extraUser1.id,
      title: 'MacBook Air M2 - 2024 Model',
      description: 'Stunning MacBook Air M2 in Midnight color. 8GB RAM, 256GB SSD. Used for only 2 months, still has AppleCare+. Includes original charger and box.',
      category: 'Electronics',
      condition: 'LIKE_NEW',
      location: 'Tobago',
      price: 7200,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      featured: true,
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: businessUser.id,
      title: 'JBL Bluetooth Speaker - PartyBox 310',
      description: 'Massive JBL PartyBox 310 portable speaker. Powerful sound with light show. Perfect for parties, fetes, and outdoor events. Like new condition.',
      category: 'Electronics',
      condition: 'LIKE_NEW',
      location: 'San Fernando',
      price: 3200,
      currency: 'TTD',
      listingType: 'BOTH',
      swapTerms: 'Will swap for DJ equipment or professional mixer',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: proUser.id,
      title: 'DJI Mini 3 Pro Drone',
      description: 'Professional drone with 4K camera, obstacle avoidance, and 34-min flight time. Includes extra batteries and carrying case. Perfect for aerial photography.',
      category: 'Electronics',
      condition: 'GOOD',
      location: 'Diego Martin',
      price: 5500,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  // Vehicles
  await prisma.listing.create({
    data: {
      userId: extraUser2.id,
      title: 'Honda Civic 2020 - Mint Condition',
      description: 'Honda Civic LX 2020, automatic transmission, only 25,000 km. Full service history, one owner. AC cold, everything works perfectly. Serious buyers only.',
      category: 'Vehicles',
      condition: 'LIKE_NEW',
      location: 'Point Fortin',
      price: 185000,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      featured: true,
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: basicUser.id,
      title: 'Mountain Bike - Trek 26"',
      description: 'Trek mountain bike, 26-inch wheels, 21-speed gear system. Well maintained, perfect for trails. Looking to swap for road bike or gym equipment.',
      category: 'Sports & Outdoors',
      condition: 'GOOD',
      location: 'Arima',
      listingType: 'SWAP',
      swapTerms: 'Interested in road bike, treadmill, or weight set',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: proUser.id,
      title: 'Yamaha R15 V4 Motorcycle',
      description: 'Yamaha R15 V4 sports bike, 2023 model. Low mileage, excellent condition. Modified exhaust for better sound. Perfect first bike for young riders.',
      category: 'Vehicles',
      condition: 'LIKE_NEW',
      location: 'Diego Martin',
      price: 55000,
      currency: 'TTD',
      listingType: 'BOTH',
      swapTerms: 'Open to swapping for car or larger motorcycle with cash difference',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  // Home & Garden
  await prisma.listing.create({
    data: {
      userId: proUser.id,
      title: 'Designer Leather Sofa Set',
      description: 'Beautiful 3-piece leather sofa set in excellent condition. Modern design, very comfortable. Selling due to relocation. Must see to appreciate!',
      category: 'Home & Garden',
      condition: 'LIKE_NEW',
      location: 'Diego Martin',
      price: 8500,
      currency: 'TTD',
      listingType: 'BOTH',
      swapTerms: 'Open to swapping for dining table set or home theater system',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: basicUser.id,
      title: 'Samsung French Door Refrigerator',
      description: 'Samsung French door refrigerator, 28 cu. ft. Ice maker, water dispenser. Stainless steel finish. Moving sale - must go this week!',
      category: 'Home & Garden',
      condition: 'GOOD',
      location: 'Arima',
      price: 6800,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: extraUser1.id,
      title: 'Outdoor Patio Furniture Set',
      description: '6-piece outdoor patio set with cushions. Weather-resistant wicker. Includes 2 chairs, loveseat, table, and 2 ottomans. Perfect for your gallery or yard.',
      category: 'Home & Garden',
      condition: 'NEW',
      location: 'Tobago',
      price: 4500,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: businessUser.id,
      title: 'LG Inverter AC Unit - 18000 BTU',
      description: 'Brand new LG inverter air conditioner, 18000 BTU. Energy efficient, quiet operation. Includes installation. 5-year warranty.',
      category: 'Home & Garden',
      condition: 'NEW',
      location: 'San Fernando',
      price: 5200,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  // Fashion
  await prisma.listing.create({
    data: {
      userId: freeUser.id,
      title: 'Nike Air Jordan 1 Retro - Size 10',
      description: 'Authentic Nike Air Jordan 1 Retro High OG. Chicago colorway, size 10 US. Worn once, like new. With original box and receipt. No trades.',
      category: 'Fashion',
      condition: 'LIKE_NEW',
      location: 'Chaguanas',
      price: 1200,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: extraUser1.id,
      title: 'Designer Handbag Collection - 5 Bags',
      description: 'Collection of 5 designer handbags. Includes Michael Kors, Coach, and Kate Spade. Various sizes and colors. Selling as a lot or individually.',
      category: 'Fashion',
      condition: 'GOOD',
      location: 'Tobago',
      price: 2800,
      currency: 'TTD',
      listingType: 'BOTH',
      swapTerms: 'Will swap for Apple Watch or jewelry',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: basicUser.id,
      title: 'Wedding Dress - Never Worn',
      description: 'Gorgeous A-line wedding dress, size 8. Ivory color with lace details. Tags still attached. Selling due to cancelled wedding. Half the original price!',
      category: 'Fashion',
      condition: 'NEW',
      location: 'Arima',
      price: 3500,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  // Sports & Outdoors
  await prisma.listing.create({
    data: {
      userId: proUser.id,
      title: 'Complete Home Gym Set',
      description: 'Full home gym setup: Olympic barbell, 300lbs plates, squat rack, bench, dumbbells (5-50lbs). Everything you need for serious training. No time wasters.',
      category: 'Sports & Outdoors',
      condition: 'GOOD',
      location: 'Diego Martin',
      price: 12000,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      featured: true,
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: extraUser2.id,
      title: 'Kayak - 2 Person with Paddles',
      description: 'Tandem kayak perfect for exploring our beautiful waters. Includes 2 paddles and life vests. Great for couples or parent/child adventures.',
      category: 'Sports & Outdoors',
      condition: 'GOOD',
      location: 'Point Fortin',
      price: 3800,
      currency: 'TTD',
      listingType: 'SWAP',
      swapTerms: 'Looking for fishing boat or surfboard with cash',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: freeUser.id,
      title: 'Golf Club Set - Callaway',
      description: 'Full Callaway golf set: driver, woods, irons, putter, and bag. Great for intermediate players. Well maintained. Ready to hit the course!',
      category: 'Sports & Outdoors',
      condition: 'GOOD',
      location: 'Chaguanas',
      price: 4200,
      currency: 'TTD',
      listingType: 'BOTH',
      swapTerms: 'Will swap for PS5 or gaming setup',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  // Kids & Baby
  await prisma.listing.create({
    data: {
      userId: basicUser.id,
      title: 'Baby Crib with Mattress - Graco',
      description: 'Graco convertible crib that grows with your child. Includes waterproof mattress. Excellent condition, from pet-free and smoke-free home.',
      category: 'Kids & Baby',
      condition: 'LIKE_NEW',
      location: 'Arima',
      price: 1800,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: extraUser1.id,
      title: 'Kids Bicycle - 16 inch with Training Wheels',
      description: 'Adorable kids bicycle in pink with training wheels. Perfect for ages 4-7. Includes helmet and knee pads. Hardly used!',
      category: 'Kids & Baby',
      condition: 'LIKE_NEW',
      location: 'Tobago',
      price: 650,
      currency: 'TTD',
      listingType: 'SWAP',
      swapTerms: 'Will swap for larger kids bike or scooter',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  // Services
  await prisma.listing.create({
    data: {
      userId: proUser.id,
      title: 'Professional Photography Services',
      description: 'Wedding, event, and portrait photography. 10 years experience. Package includes 4 hours shooting, editing, and digital delivery. Book now for carnival!',
      category: 'Services',
      condition: 'NEW',
      location: 'Diego Martin',
      price: 2500,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: businessUser.id,
      title: 'AC Repair & Installation Service',
      description: 'Professional AC servicing, repair, and installation. All brands. Same-day service available. Free diagnostic with repair. Licensed and insured.',
      category: 'Services',
      condition: 'NEW',
      location: 'San Fernando',
      price: 350,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  // Food & Beverages
  await prisma.listing.create({
    data: {
      userId: extraUser2.id,
      title: 'Homemade Pepper Sauce - 6 Pack',
      description: 'Authentic Trinidad pepper sauce made with scotch bonnets and local spices. 6 bottles, various heat levels. Perfect for gifting or personal use. Ships nationwide.',
      category: 'Food & Catering',
      condition: 'NEW',
      location: 'Point Fortin',
      price: 180,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: freeUser.id,
      title: 'Commercial Blender - Vitamix',
      description: 'Vitamix commercial blender, perfect for smoothie shop or serious home use. Variable speed, 2HP motor. Used in juice bar, well maintained.',
      category: 'Food & Catering',
      condition: 'GOOD',
      location: 'Chaguanas',
      price: 2200,
      currency: 'TTD',
      listingType: 'BOTH',
      swapTerms: 'Will swap for restaurant equipment',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  // Books & Media
  await prisma.listing.create({
    data: {
      userId: basicUser.id,
      title: 'University Textbooks - UWI Engineering',
      description: 'Collection of engineering textbooks from UWI. Includes calculus, physics, circuits, and thermodynamics. Good condition with some highlighting.',
      category: 'Books & Education',
      condition: 'GOOD',
      location: 'Arima',
      price: 800,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  await prisma.listing.create({
    data: {
      userId: proUser.id,
      title: 'Vinyl Record Collection - 50+ Albums',
      description: 'Collection of 50+ vinyl records. Includes classic rock, reggae, soca, and calypso. Many originals from the 70s and 80s. Perfect for collectors!',
      category: 'Books & Education',
      condition: 'GOOD',
      location: 'Diego Martin',
      price: 1500,
      currency: 'TTD',
      listingType: 'SWAP',
      swapTerms: 'Looking for vintage turntable or audio equipment',
      status: 'ACTIVE',
      images: [],
      activatedAt: new Date(),
    },
  });

  // Draft and Pending listings
  await prisma.listing.create({
    data: {
      userId: freeUser.id,
      title: 'iPad Air 2024',
      description: 'Brand new iPad Air, latest model. 256GB, WiFi + Cellular. Perfect for work and entertainment.',
      category: 'Electronics',
      condition: 'NEW',
      location: 'Chaguanas',
      price: 5200,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'PENDING_PAYMENT',
      images: [],
    },
  });

  await prisma.listing.create({
    data: {
      userId: basicUser.id,
      title: 'Vintage Record Player',
      description: 'Classic turntable in working condition. Great for vinyl enthusiasts.',
      category: 'Electronics',
      condition: 'GOOD',
      location: 'Arima',
      price: 1500,
      currency: 'TTD',
      listingType: 'SELL',
      status: 'DRAFT',
      images: [],
    },
  });

  // Create fee payments
  console.log('💳 Creating sample payments...');

  const allListings = await prisma.listing.findMany();
  const activeListings = allListings.filter(l => l.status === 'ACTIVE' && l.listingType !== 'SWAP');

  // Create payments for some active listings
  for (const listing of activeListings.slice(0, 5)) {
    await prisma.feePayment.create({
      data: {
        listingId: listing.id,
        userId: listing.userId,
        amount: 10.0,
        currency: 'TTD',
        method: Math.random() > 0.5 ? 'PAYPAL' : 'BANK_DEPOSIT',
        status: 'PAID',
        providerTransactionId: 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      },
    });
  }

  // Pending bank deposit
  const pendingListing = allListings.find(l => l.status === 'PENDING_PAYMENT');
  if (pendingListing) {
    await prisma.feePayment.create({
      data: {
        listingId: pendingListing.id,
        userId: pendingListing.userId,
        amount: 10.0,
        currency: 'TTD',
        method: 'BANK_DEPOSIT',
        status: 'PENDING',
        reference: 'BANK_REF_67890',
        proofUploadUrl: 'https://i.pinimg.com/736x/f3/e0/a2/f3e0a27bf3bbcbe3cb9212158d353536.jpg',
      },
    });
  }

  // Create swap offers
  console.log('🔄 Creating swap offers...');

  const swapListings = allListings.filter(l => l.status === 'ACTIVE' && (l.listingType === 'SWAP' || l.listingType === 'BOTH'));

  if (swapListings.length >= 2) {
    await prisma.swapOffer.create({
      data: {
        fromUserId: swapListings[0].userId,
        toUserId: swapListings[1].userId,
        offeredListingId: swapListings[0].id,
        requestedListingId: swapListings[1].id,
        status: 'OFFERED',
        message: 'Hi! I\'m interested in your item. Would you consider a swap? Let me know!',
      },
    });

    if (swapListings.length >= 4) {
      await prisma.swapOffer.create({
        data: {
          fromUserId: swapListings[2].userId,
          toUserId: swapListings[3].userId,
          offeredListingId: swapListings[2].id,
          requestedListingId: swapListings[3].id,
          status: 'OFFERED',
          message: 'This looks great! Open to swapping?',
        },
      });
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Admin user: admin@example.com / admin123`);
  console.log(`- Test user: john@doe.com / johndoe123 (ADMIN role)`);
  console.log(`- Sample users: free@user.com, basic@user.com, pro@user.com, business@user.com`);
  console.log(`- All sample users password: password123`);
  console.log(`- Created ${await prisma.listing.count()} listings`);
  console.log(`- Created ${await prisma.feePayment.count()} payments`);
  console.log(`- Created ${await prisma.swapOffer.count()} swap offers`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
