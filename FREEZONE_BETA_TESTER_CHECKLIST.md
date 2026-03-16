# 🧪 Freezone Beta Tester Checklist

**Version:** 1.0  
**App:** Freezone Swap or Sell  
**Test Environment:** https://15ba14ce91.preview.abacusai.app  
**Date:** March 10, 2026

---

## 📋 Testing Instructions

- [ ] Test each item systematically
- [ ] Report bugs with screenshots
- [ ] Note any UI/UX issues
- [ ] Test on different devices (desktop, tablet, mobile)
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)

---

## 1️⃣ User Registration & Authentication

### Sign Up
- [ ] Navigate to Sign Up page
- [ ] Create new account with valid email
- [ ] Verify required field validation (name, email, password)
- [ ] Check password strength requirements
- [ ] Confirm successful registration message
- [ ] Verify email format validation

### Sign In
- [ ] Sign in with valid credentials
- [ ] Test "Remember Me" functionality
- [ ] Try signing in with incorrect password (should fail gracefully)
- [ ] Try signing in with non-existent email (should fail gracefully)
- [ ] Verify redirect to dashboard after successful login

### Password Reset
- [ ] Click "Forgot Password" link
- [ ] Enter registered email
- [ ] Check if reset email is sent (if email configured)
- [ ] Reset password successfully

### Sign Out
- [ ] Sign out from dashboard
- [ ] Verify redirect to home page
- [ ] Confirm session is cleared (cannot access dashboard without login)

---

## 2️⃣ User Dashboard

### Dashboard Overview
- [ ] View dashboard homepage after login
- [ ] Check "My Listings" section displays correctly
- [ ] Verify listing count is accurate
- [ ] Check "My Statistics" display (if applicable)
- [ ] View recent activity (if applicable)

### Profile Management
- [ ] Navigate to Profile/Account Settings
- [ ] Update profile information (name, bio, location)
- [ ] Upload/change profile picture
- [ ] Save changes successfully
- [ ] Verify changes persist after page refresh

---

## 3️⃣ Create New Listing

### Basic Listing Creation - Sell Only
- [ ] Click "Create New Listing" or "New Listing" button
- [ ] Select category: **Electronics**
- [ ] Select listing type: **Sell Only**
- [ ] Enter title (e.g., "iPhone 13 Pro Max")
- [ ] Enter description (minimum 20 characters)
- [ ] Enter price (e.g., 4500 TTD)
- [ ] Select condition (New, Like New, Good, Fair, Poor)
- [ ] Enter location (e.g., "Port of Spain")
- [ ] Upload at least 1 image
- [ ] Submit listing
- [ ] Verify success message
- [ ] Check listing appears in "My Listings"

### Swap Only Listing
- [ ] Create new listing
- [ ] Select category: **Vehicles**
- [ ] Select listing type: **Swap Only**
- [ ] Enter all required fields
- [ ] Enter swap terms/preferences (what you want in exchange)
- [ ] Verify price field is optional or disabled for swap-only
- [ ] Submit listing
- [ ] Verify listing shows "Swap Only" badge/label

### Sell or Swap Listing
- [ ] Create new listing
- [ ] Select category: **Furniture**
- [ ] Select listing type: **Sell or Swap**
- [ ] Enter price
- [ ] Enter swap terms
- [ ] Submit listing
- [ ] Verify listing shows both price and swap option

### Free Item Listing
- [ ] Create new listing
- [ ] Select category: **Free Items**
- [ ] Verify listing type auto-changes to **Free Item**
- [ ] Verify price field shows "Free - $0" and is disabled
- [ ] Verify helper text displays: "This item is free. No payment is required."
- [ ] Verify info displays: "Price: 0 TTD • Expires after 30 days • Admin approval required"
- [ ] Try to change category away from Free Items
- [ ] Verify listing type options restore to: Sell Only, Swap Only, Sell or Swap
- [ ] Change back to Free Items category
- [ ] Verify Free Item behavior returns
- [ ] Submit free listing
- [ ] Verify listing shows **FREE** badge (not $0)
- [ ] Verify status is "Pending Approval"

### Category Testing
- [ ] Test creating listings in each category:
  - [ ] Electronics
  - [ ] Vehicles
  - [ ] Auto Parts & Accessories
  - [ ] Real Estate
  - [ ] Construction Materials
  - [ ] Home & Garden
  - [ ] Furniture
  - [ ] Appliances
  - [ ] Fashion
  - [ ] Sports & Outdoors
  - [ ] Books & Education
  - [ ] Kids & Baby
  - [ ] Services
  - [ ] Food & Catering
  - [ ] Business & Industrial
  - [ ] Events & Tickets
  - [ ] Pets & Livestock
  - [ ] Art & Collectibles
  - [ ] Other
  - [ ] Free Items

### Image Upload Testing
- [ ] Upload single image
- [ ] Upload multiple images (test maximum limit)
- [ ] Try uploading invalid file type (should fail)
- [ ] Try uploading very large file (should show error or compress)
- [ ] Verify image preview displays correctly
- [ ] Test removing uploaded images before submission

### Form Validation
- [ ] Try submitting without title (should fail)
- [ ] Try submitting without description (should fail)
- [ ] Try submitting without category (should fail)
- [ ] Try submitting without listing type (should fail)
- [ ] Try submitting without price for "Sell Only" (should fail)
- [ ] Try submitting without image (check if required)
- [ ] Verify inline error messages display clearly

---

## 4️⃣ Edit Listing

### Edit Functionality
- [ ] Go to "My Listings" dashboard
- [ ] Click "Edit" button on any listing
- [ ] Verify all existing data loads into form:
  - [ ] Title
  - [ ] Description
  - [ ] Price
  - [ ] Category
  - [ ] Listing Type
  - [ ] Condition
  - [ ] Location
  - [ ] Images
  - [ ] Swap terms (if applicable)

### Edit Different Fields
- [ ] Edit title only, save, verify change
- [ ] Edit description only, save, verify change
- [ ] Edit price only, save, verify change
- [ ] Edit category, save, verify change
- [ ] Edit listing type, save, verify change
- [ ] Edit condition, save, verify change
- [ ] Edit location, save, verify change

### Image Editing
- [ ] Keep existing images without changes
- [ ] Remove one existing image, save
- [ ] Add new image to existing images, save
- [ ] Replace all images, save
- [ ] Reorder images using arrow buttons (if available), save
- [ ] Verify image changes persist after save

### Status Preservation
- [ ] Edit a listing with status "Active", verify it remains "Active" after save
- [ ] Edit a listing with status "Pending Approval", verify it remains "Pending Approval"
- [ ] Edit a listing with status "Draft", verify it remains "Draft"
- [ ] Edit a featured listing, verify featured status preserved

### Edit Free Item Listing
- [ ] Edit a Free Item listing
- [ ] Verify price remains 0 and disabled
- [ ] Try changing category away from Free Items (should trigger warning or prevent)
- [ ] Save without changes
- [ ] Verify listing remains free with correct status

### Save & Validation
- [ ] Save valid changes successfully
- [ ] Verify success message: "Listing updated successfully"
- [ ] Verify no duplicate listing created (check My Listings)
- [ ] Try saving with blank title (should fail)
- [ ] Try saving with blank description (should fail)
- [ ] Verify listing ID remains the same before/after edit

---

## 5️⃣ Browse & Search Listings

### Browse All Listings
- [ ] Navigate to "Browse" or "All Listings" page
- [ ] Verify listings display in grid/list format
- [ ] Check listing cards show: image, title, price, category, condition
- [ ] Verify FREE badge displays for free items (not $0)
- [ ] Verify "Swap Only" badge displays correctly
- [ ] Verify "Sell or Swap" badge displays correctly

### Category Filtering
- [ ] Filter by each category
- [ ] Verify only listings from selected category display
- [ ] Clear filter and verify all listings return

### Search Functionality
- [ ] Search by keyword (e.g., "iPhone")
- [ ] Verify relevant results display
- [ ] Search with no results, verify "No listings found" message
- [ ] Test search with special characters

### Sorting
- [ ] Sort by "Newest First"
- [ ] Sort by "Price: Low to High"
- [ ] Sort by "Price: High to Low"
- [ ] Sort by "Most Popular" (if available)

### Listing Cards
- [ ] Click on listing card
- [ ] Verify opens detailed listing view
- [ ] Check "Back" or breadcrumb navigation works

---

## 6️⃣ Listing Detail Page

### View Listing Details
- [ ] Open any active listing
- [ ] Verify all information displays correctly:
  - [ ] Title
  - [ ] Price (or FREE badge)
  - [ ] Description
  - [ ] Category
  - [ ] Condition
  - [ ] Location
  - [ ] Seller name
  - [ ] Posted date
  - [ ] Images (in gallery/carousel)
  - [ ] Swap terms (if applicable)

### Image Gallery
- [ ] Click through image gallery/carousel
- [ ] Zoom or enlarge images (if available)
- [ ] Verify all uploaded images display

### Contact Seller
- [ ] Click "Contact Seller" or "Message Seller" button
- [ ] Verify contact form or messaging interface appears
- [ ] Send test message
- [ ] Verify message sent successfully

### For Own Listings
- [ ] View your own listing
- [ ] Verify "Edit Listing" button displays
- [ ] Verify "Delete Listing" button displays
- [ ] Click "Edit Listing" → opens edit form
- [ ] Return to listing detail page

---

## 7️⃣ Swap Offers

### Create Swap Offer
- [ ] Find a "Swap Only" or "Sell or Swap" listing
- [ ] Click "Make Swap Offer" button
- [ ] Enter swap offer details
- [ ] Submit offer
- [ ] Verify success message

### View Received Swap Offers
- [ ] Navigate to "My Swap Offers" or "Offers Received"
- [ ] View all offers received on your listings
- [ ] Accept a swap offer
- [ ] Reject a swap offer
- [ ] Verify status updates correctly

### View Sent Swap Offers
- [ ] Navigate to "My Swap Offers" or "Offers Sent"
- [ ] View all offers you've sent
- [ ] Cancel a pending offer
- [ ] View accepted/rejected status

---

## 8️⃣ Payment & Monetization

### Listing Fees
- [ ] Create a new listing in a category that requires payment
- [ ] Proceed to payment page
- [ ] Verify payment amount displays correctly (e.g., 5 TTD posting fee)
- [ ] View payment methods (PayPal, Credit Card if configured)

### PayPal Payment (Sandbox)
- [ ] Select PayPal payment method
- [ ] Complete PayPal checkout in sandbox mode
- [ ] Verify redirect back to app after payment
- [ ] Verify listing status changes to "Active" or "Pending Approval"
- [ ] Check payment record in database/dashboard

### Free Listings (No Payment)
- [ ] Create a Free Item listing
- [ ] Verify NO payment step appears
- [ ] Verify listing goes to "Pending Approval" status
- [ ] Verify no payment record created

### Featured Listings
- [ ] Upgrade a listing to "Featured" (if option available)
- [ ] Complete payment for featured upgrade
- [ ] Verify listing displays as Featured on home page
- [ ] Verify Featured badge shows on listing card

---

## 9️⃣ Listing Management

### My Listings Dashboard
- [ ] View all your listings in "My Listings"
- [ ] Verify status for each listing (Active, Pending, Draft, Expired, Rejected)
- [ ] Check listing cards show correct info

### Listing Actions
- [ ] **Edit** - Click Edit, verify opens edit form
- [ ] **Delete** - Delete a listing, confirm deletion, verify removed from dashboard
- [ ] **View** - Click View, verify opens listing detail page
- [ ] **Renew** - Renew an expired listing (if applicable)
- [ ] **Feature** - Upgrade to featured (if available)

### Renew Listing
- [ ] Find an expired listing
- [ ] Click "Renew" button
- [ ] For paid listings: complete payment
- [ ] For Free Items: verify "Renew Free" button
- [ ] Verify listing expiry date extends by 30 days
- [ ] Verify listing status changes to "Pending Approval" or "Active"

### Delete Listing
- [ ] Click "Delete" on a listing
- [ ] Confirm deletion in popup/modal
- [ ] Verify listing removed from "My Listings"
- [ ] Verify listing no longer appears in Browse page

---

## 🔟 Admin Features

### Admin Login
- [ ] Sign in as admin user (email: `admin@example.com`, password: `admin123`)
- [ ] Verify admin dashboard access
- [ ] Verify admin navigation menu displays

### Manage Listings (Admin)
- [ ] View all listings (from all users)
- [ ] Filter by status (Active, Pending Approval, Rejected, Expired)
- [ ] Approve a pending listing
- [ ] Reject a pending listing with reason
- [ ] Delete any user's listing
- [ ] Edit any user's listing
- [ ] Feature a listing from admin panel

### Manage Users (Admin)
- [ ] View all registered users
- [ ] View user details (listings count, join date, etc.)
- [ ] Suspend/ban a user (if available)
- [ ] Delete a user account (if available)
- [ ] Promote user to admin (if available)

### Manage Categories (Admin)
- [ ] View all categories
- [ ] Add new category (if available)
- [ ] Edit category name/description (if available)
- [ ] Delete/disable category (if available)

### Reports & Analytics (Admin)
- [ ] View total listings count
- [ ] View total users count
- [ ] View total payments/revenue
- [ ] View listings by category breakdown
- [ ] View listings by status breakdown

---

## 1️⃣1️⃣ Mobile Responsiveness

### Mobile View (< 768px)
- [ ] Test on mobile device or browser dev tools
- [ ] Verify navigation menu collapses to hamburger icon
- [ ] Test homepage layout on mobile
- [ ] Test browse page grid adjusts to mobile (single column or 2 columns)
- [ ] Test create listing form on mobile (all fields accessible)
- [ ] Test edit listing form on mobile
- [ ] Test image upload on mobile
- [ ] Test dashboard on mobile
- [ ] Test listing detail page on mobile
- [ ] Verify all buttons are tappable (not too small)

### Tablet View (768px - 1024px)
- [ ] Test on tablet or browser dev tools
- [ ] Verify 2-3 column grid for listings
- [ ] Test navigation displays correctly
- [ ] Test forms fit properly

---

## 1️⃣2️⃣ Performance & Loading

### Page Load Times
- [ ] Homepage loads in < 3 seconds
- [ ] Browse page loads in < 3 seconds
- [ ] Dashboard loads in < 3 seconds
- [ ] Listing detail page loads in < 2 seconds

### Image Loading
- [ ] Images load progressively (lazy loading)
- [ ] Large images are compressed/optimized
- [ ] Image placeholders display while loading

### Search & Filter Performance
- [ ] Search results display quickly (< 1 second)
- [ ] Filtering by category is instant
- [ ] No lag when switching filters

---

## 1️⃣3️⃣ Security & Permissions

### Unauthorized Access
- [ ] Try accessing `/dashboard` without login (should redirect to login)
- [ ] Try accessing `/dashboard/listings/create` without login (should redirect)
- [ ] Try accessing another user's listing edit page (should deny access)

### Listing Ownership
- [ ] Sign in as User A
- [ ] Create a listing
- [ ] Note the listing ID
- [ ] Sign out and sign in as User B
- [ ] Try to edit User A's listing by URL manipulation
- [ ] Verify access denied

### Admin-Only Routes
- [ ] Sign in as regular user
- [ ] Try accessing `/admin` or admin routes (should deny access)
- [ ] Sign in as admin
- [ ] Verify admin routes accessible

---

## 1️⃣4️⃣ Edge Cases & Error Handling

### Network Errors
- [ ] Simulate offline mode (disconnect network)
- [ ] Try submitting a form
- [ ] Verify error message displays gracefully

### Invalid Data
- [ ] Enter price as negative number (should fail)
- [ ] Enter price with letters (should fail)
- [ ] Enter extremely long title (10,000 characters)
- [ ] Enter special characters in all fields
- [ ] Upload 100MB image file
- [ ] Upload .exe file as image

### Session Expiry
- [ ] Stay logged in for extended period (test session timeout if configured)
- [ ] Try performing action after session expires
- [ ] Verify redirect to login with appropriate message

---

## 1️⃣5️⃣ UI/UX Issues to Report

### Visual Bugs
- [ ] Check for text overflow
- [ ] Check for broken images
- [ ] Check for misaligned elements
- [ ] Check color contrast (accessibility)
- [ ] Check button hover states
- [ ] Check form focus states

### Usability Issues
- [ ] Are buttons clearly labeled?
- [ ] Is navigation intuitive?
- [ ] Are error messages helpful?
- [ ] Are success messages clear?
- [ ] Is the flow from create → pay → publish smooth?

---

## 1️⃣6️⃣ Browser Compatibility

### Chrome
- [ ] Test all features in Chrome
- [ ] Note any issues

### Firefox
- [ ] Test all features in Firefox
- [ ] Note any issues

### Safari
- [ ] Test all features in Safari
- [ ] Note any issues

### Edge
- [ ] Test all features in Edge
- [ ] Note any issues

---

## 📝 Bug Reporting Template

When you find a bug, please report it using this format:

```
**Bug Title:** [Short description]

**Priority:** High / Medium / Low

**Steps to Reproduce:**
1. Go to...
2. Click...
3. Enter...
4. See error

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[Attach screenshots]

**Device/Browser:**
- Device: [e.g., iPhone 13, Desktop]
- Browser: [e.g., Chrome 121]
- OS: [e.g., iOS 17, Windows 11]

**Additional Notes:**
[Any other relevant information]
```

---

## ✅ Testing Completion

- [ ] All critical features tested
- [ ] All bugs documented and reported
- [ ] Screenshots collected for major issues
- [ ] Feedback summary prepared

---

## 📧 Contact & Support

**Report bugs to:** [Your bug tracking system or email]  
**Questions:** [Support channel]  
**Testing deadline:** [Date if applicable]

---

**Thank you for beta testing Freezone Swap or Sell! 🎉**

Your feedback helps us build a better marketplace for Trinidad & Tobago.
