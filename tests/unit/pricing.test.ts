/**
 * Unit tests for pricing calculation logic
 * Tests: lib/pricing.ts
 */

import { describe, it, expect } from 'vitest';
import { calculateCourtFee, generateSlug, type PricingCalculationInput } from '@/lib/pricing';
import type { PricingRuleDoc } from '@/lib/models';
import { ObjectId } from 'mongodb';

describe('Pricing Engine', () => {
  describe('calculateCourtFee', () => {
    it('should return base rate when no rules match', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [];

      const result = calculateCourtFee(input, rules);

      expect(result.baseCourtFee).toBe(200000);
      expect(result.finalCourtFee).toBe(200000);
      expect(result.appliedRules).toHaveLength(0);
      expect(result.breakdown).toContain('Base rate: 200,000₫ (no rules applied)');
    });

    it('should apply multiplier rule correctly', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',  // Saturday
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Weekend Premium',
          ruleType: 'time_based',
          daysOfWeek: [6, 7], // Saturday & Sunday
          rateType: 'multiplier',
          rateValue: 1.5,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.baseCourtFee).toBe(200000);
      expect(result.finalCourtFee).toBe(300000); // 200k × 1.5
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].ruleName).toBe('Weekend Premium');
      expect(result.appliedRules[0].rateValue).toBe(1.5);
    });

    it('should apply fixed rate rule correctly', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Special Event Flat Rate',
          ruleType: 'special_event',
          rateType: 'fixed',
          rateValue: 350000,
          priority: 100,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.baseCourtFee).toBe(200000);
      expect(result.finalCourtFee).toBe(350000); // Fixed at 350k
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].rateType).toBe('fixed');
    });

    it('should apply highest priority rule when multiple rules match', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',  // Saturday
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Weekend Premium',
          ruleType: 'time_based',
          daysOfWeek: [6, 7],
          rateType: 'multiplier',
          rateValue: 1.5,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          ruleName: 'Peak Hours',
          ruleType: 'time_based',
          timeStart: '18:00',
          timeEnd: '21:00',
          rateType: 'multiplier',
          rateValue: 1.3,
          priority: 100, // Higher priority
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(260000); // 200k × 1.3 (higher priority wins)
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].ruleName).toBe('Peak Hours');
      expect(result.appliedRules[0].priority).toBe(100);
    });

    it('should filter by date range', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-07-15',
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Summer Special',
          ruleType: 'seasonal',
          dateStart: '2026-06-01',
          dateEnd: '2026-08-31',
          rateType: 'multiplier',
          rateValue: 1.2,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(240000); // 200k × 1.2
      expect(result.appliedRules[0].ruleName).toBe('Summer Special');
    });

    it('should exclude rules outside date range', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-09-15', // After summer
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Summer Special',
          ruleType: 'seasonal',
          dateStart: '2026-06-01',
          dateEnd: '2026-08-31',
          rateType: 'multiplier',
          rateValue: 1.2,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(200000); // No rule applied
      expect(result.appliedRules).toHaveLength(0);
    });

    it('should filter by day of week correctly', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-26', // Friday
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Weekend Premium',
          ruleType: 'time_based',
          daysOfWeek: [6, 7], // Saturday & Sunday only
          rateType: 'multiplier',
          rateValue: 1.5,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(200000); // Friday doesn't match
      expect(result.appliedRules).toHaveLength(0);
    });

    it('should filter by time range correctly', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        timeStart: '17:00', // Before peak hours
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Peak Hours',
          ruleType: 'time_based',
          timeStart: '18:00',
          timeEnd: '21:00',
          rateType: 'multiplier',
          rateValue: 1.3,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(200000); // Before peak hours
      expect(result.appliedRules).toHaveLength(0);
    });

    it('should match time range at boundary (start inclusive)', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        timeStart: '18:00', // Exactly at start time
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Peak Hours',
          ruleType: 'time_based',
          timeStart: '18:00',
          timeEnd: '21:00',
          rateType: 'multiplier',
          rateValue: 1.3,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(260000); // 200k × 1.3
      expect(result.appliedRules).toHaveLength(1);
    });

    it('should exclude time range at boundary (end exclusive)', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        timeStart: '21:00', // Exactly at end time (exclusive)
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Peak Hours',
          ruleType: 'time_based',
          timeStart: '18:00',
          timeEnd: '21:00',
          rateType: 'multiplier',
          rateValue: 1.3,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(200000); // After peak hours
      expect(result.appliedRules).toHaveLength(0);
    });

    it('should filter by venue ID', () => {
      const venueId = new ObjectId();

      const input: PricingCalculationInput = {
        venueId: venueId.toString(),
        sessionDate: '2026-06-28',
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Venue-Specific Rule',
          ruleType: 'time_based',
          venueId,
          rateType: 'multiplier',
          rateValue: 1.4,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(280000); // 200k × 1.4
      expect(result.appliedRules).toHaveLength(1);
    });

    it('should exclude rules for different venues', () => {
      const venueId1 = new ObjectId();
      const venueId2 = new ObjectId();

      const input: PricingCalculationInput = {
        venueId: venueId1.toString(),
        sessionDate: '2026-06-28',
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Different Venue Rule',
          ruleType: 'time_based',
          venueId: venueId2, // Different venue
          rateType: 'multiplier',
          rateValue: 1.4,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(200000); // No rule applied
      expect(result.appliedRules).toHaveLength(0);
    });

    it('should ignore inactive rules', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Inactive Rule',
          ruleType: 'time_based',
          rateType: 'multiplier',
          rateValue: 2.0,
          priority: 100,
          active: false, // Inactive
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(200000); // No rule applied
      expect(result.appliedRules).toHaveLength(0);
    });

    it('should handle complex multi-condition rule', () => {
      const venueId = new ObjectId();

      const input: PricingCalculationInput = {
        venueId: venueId.toString(),
        sessionDate: '2026-07-12', // Saturday in summer
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Summer Weekend Peak',
          ruleType: 'time_based',
          venueId,
          daysOfWeek: [6, 7], // Weekend
          timeStart: '18:00',
          timeEnd: '21:00',
          dateStart: '2026-06-01',
          dateEnd: '2026-08-31',
          rateType: 'multiplier',
          rateValue: 1.8,
          priority: 100,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(360000); // 200k × 1.8
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].ruleName).toBe('Summer Weekend Peak');
    });

    it('should handle special event with icon and metadata', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        timeStart: '19:00',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Lunar New Year',
          ruleType: 'special_event',
          eventName: 'Tết Nguyên Đán 2026',
          eventIcon: '🎉',
          rateType: 'multiplier',
          rateValue: 2.0,
          priority: 200,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(result.finalCourtFee).toBe(400000); // 200k × 2.0
      expect(result.appliedRules[0].ruleName).toBe('Lunar New Year');
      expect(result.appliedRules[0].ruleType).toBe('special_event');
    });
  });

  describe('Performance', () => {
    it('should handle 100 rules in under 50ms', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        timeStart: '19:00',
        baseRate: 200000,
      };

      // Generate 100 rules with varying priorities
      const rules: PricingRuleDoc[] = Array.from({ length: 100 }, (_, i) => ({
        _id: new ObjectId(),
        ruleName: `Rule ${i}`,
        ruleType: 'time_based' as const,
        daysOfWeek: i % 2 === 0 ? [6, 7] : undefined,
        timeStart: i % 3 === 0 ? '18:00' : undefined,
        timeEnd: i % 3 === 0 ? '21:00' : undefined,
        rateType: 'multiplier' as const,
        rateValue: 1.1 + (i * 0.01),
        priority: i + 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const startTime = performance.now();
      const result = calculateCourtFee(input, rules);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Should complete in under 50ms
      expect(result.finalCourtFee).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing timeStart gracefully', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        // No timeStart provided
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Time-Based Rule',
          ruleType: 'time_based',
          timeStart: '18:00',
          timeEnd: '21:00',
          rateType: 'multiplier',
          rateValue: 1.3,
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      // Should not match time-based rule without timeStart
      expect(result.finalCourtFee).toBe(200000);
      expect(result.appliedRules).toHaveLength(0);
    });

    it('should handle default base rate', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        // No baseRate provided (should default to 200000)
      };

      const rules: PricingRuleDoc[] = [];

      const result = calculateCourtFee(input, rules);

      expect(result.baseCourtFee).toBe(200000); // Default
      expect(result.finalCourtFee).toBe(200000);
    });

    it('should round final fee to integer', () => {
      const input: PricingCalculationInput = {
        sessionDate: '2026-06-28',
        baseRate: 200000,
      };

      const rules: PricingRuleDoc[] = [
        {
          _id: new ObjectId(),
          ruleName: 'Odd Multiplier',
          ruleType: 'time_based',
          rateType: 'multiplier',
          rateValue: 1.33, // Would result in 266000 (exact: 266000)
          priority: 50,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateCourtFee(input, rules);

      expect(Number.isInteger(result.finalCourtFee)).toBe(true);
      expect(result.finalCourtFee).toBe(266000);
    });
  });

  describe('generateSlug', () => {
    it('should convert to lowercase and replace spaces with hyphens', () => {
      expect(generateSlug('Sunrise Sports Complex')).toBe('sunrise-sports-complex');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Green Valley (Main)')).toBe('green-valley-main');
    });

    it('should collapse multiple hyphens', () => {
      expect(generateSlug('Hall  -  Premium')).toBe('hall-premium');
    });

    it('should trim whitespace', () => {
      expect(generateSlug('  Stadium One  ')).toBe('stadium-one');
    });

    it('should handle Vietnamese characters', () => {
      expect(generateSlug('Sân Cầu Lông ABC')).toBe('sân-cầu-lông-abc');
    });
  });
});
