/**
 * Developer Tools for Testing
 *
 * Provides utilities for testing different membership tiers
 * and accessing unlimited API features during development
 */

import { setUserMembership, getUserMembership } from './featureFlags';
import type { MembershipTier } from '@/types';

/**
 * Developer/Admin users with unlimited access
 * Add your email here to get full access during development
 */
export const DEVELOPER_EMAILS = [
  'anjacarrillo@example.com',
  'anja@iconicpathways.com',
  'dev@example.com',
  'admin@example.com',
];

/**
 * Check if user is a developer
 */
export function isDeveloper(userId?: string): boolean {
  if (!userId) return false;
  return DEVELOPER_EMAILS.includes(userId);
}

/**
 * Get developer tier (unlimited everything)
 */
export function getDeveloperTier(userId?: string): MembershipTier {
  if (isDeveloper(userId)) return 'test';
  return getUserMembership(userId);
}

/**
 * Tier Testing Utility
 * Allows switching between tiers for testing
 */
class TierTester {
  private currentTestTier: MembershipTier | null = null;

  /**
   * Set test tier (overrides actual tier)
   */
  setTestTier(tier: MembershipTier) {
    this.currentTestTier = tier;
    localStorage.setItem('dev_test_tier', tier);
    console.log(`🧪 Test tier set to: ${tier}`);
    console.log('Refresh the page to see changes');
  }

  /**
   * Get current test tier
   */
  getTestTier(): MembershipTier | null {
    if (this.currentTestTier) return this.currentTestTier;

    const stored = localStorage.getItem('dev_test_tier');
    if (stored && ['free', 'basic', 'advanced', 'expert', 'test'].includes(stored)) {
      this.currentTestTier = stored as MembershipTier;
      return this.currentTestTier;
    }

    return null;
  }

  /**
   * Clear test tier (use real tier)
   */
  clearTestTier() {
    this.currentTestTier = null;
    localStorage.removeItem('dev_test_tier');
    console.log('✅ Test tier cleared, using real tier');
    console.log('Refresh the page to see changes');
  }

  /**
   * Show current tier info
   */
  showTierInfo(userId: string) {
    const realTier = getUserMembership(userId);
    const testTier = this.getTestTier();
    const activeTier = testTier || realTier;

    console.group('🎭 Tier Information');
    console.log('User ID:', userId);
    console.log('Real Tier:', realTier);
    console.log('Test Tier:', testTier || 'None');
    console.log('Active Tier:', activeTier);
    console.log('Is Developer:', isDeveloper(userId));
    console.groupEnd();
  }

  /**
   * Test all tiers (shows what each tier sees)
   */
  testAllTiers() {
    const tiers: MembershipTier[] = ['free', 'basic', 'advanced', 'expert', 'test'];

    console.group('🧪 All Tier Capabilities');

    tiers.forEach(tier => {
      console.group(`${this.getTierEmoji(tier)} ${tier.toUpperCase()}`);
      console.log('To test:', `tierTester.setTestTier('${tier}')`);
      console.groupEnd();
    });

    console.groupEnd();
    console.log('\n💡 Usage:');
    console.log('tierTester.setTestTier("free")    - Test as free user');
    console.log('tierTester.setTestTier("basic")   - Test as basic user');
    console.log('tierTester.setTestTier("test")    - Test as developer');
    console.log('tierTester.clearTestTier()        - Use real tier');
    console.log('tierTester.showTierInfo("your-email") - Show tier info');
  }

  private getTierEmoji(tier: MembershipTier): string {
    const emojis = {
      free: '🆓',
      basic: '🥉',
      advanced: '🥈',
      expert: '🥇',
      test: '🧪',
    };
    return emojis[tier];
  }
}

// Export singleton
export const tierTester = new TierTester();

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).tierTester = tierTester;
  (window as any).isDeveloper = isDeveloper;

  console.log('🛠️ Developer Tools loaded!');
  console.log('Available commands:');
  console.log('  tierTester.testAllTiers()         - See all tier options');
  console.log('  tierTester.setTestTier("free")    - Test as free user');
  console.log('  tierTester.setTestTier("test")    - Test as developer');
  console.log('  tierTester.clearTestTier()        - Clear test tier');
  console.log('  tierTester.showTierInfo("email")  - Show tier info');
}
