// Tier Utilities - Simplified (No tier restrictions)
// All users now have equal privileges. Only role-based access (USER vs ADMIN) is used.

import { POSTING_FEE_AMOUNT } from './constants';

/**
 * Calculate posting fee - same for all users (no tier discounts)
 */
export function calculatePostingFee(): number {
  return POSTING_FEE_AMOUNT;
}

/**
 * Check if user has reached their monthly sell limit
 * Always returns false - no limits for any user
 */
export function hasReachedSellLimit(): boolean {
  return false;
}

/**
 * Get remaining sell listings for the month
 * Always returns 'unlimited' - no limits for any user
 */
export function getRemainingSellListings(): 'unlimited' {
  return 'unlimited';
}

/**
 * Check if user can create a sell/both listing
 * Always returns allowed - no tier restrictions
 */
export function canCreateSellListing(): { allowed: boolean; reason?: string } {
  return { allowed: true };
}

/**
 * Check if it's time to reset monthly counters
 */
export function shouldResetMonthlyCounters(lastResetAt: Date | null): boolean {
  if (!lastResetAt) return true;
  
  const now = new Date();
  const lastReset = new Date(lastResetAt);
  
  // Check if we're in a different month
  return (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  );
}
