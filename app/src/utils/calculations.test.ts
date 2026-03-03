import { describe, it, expect } from 'vitest';
import { calculateRefine, calculateTransmutation, formatSilver, DEFAULT_SETTINGS, findBestTransmuteForInput, calculateRefineWithTransmute } from './calculations';
import type { Recipe } from '../data/recipes';
import type { Transmutation } from '../data/transmutations';

// Mock recipe: T4 Plank
const mockRecipe: Recipe = {
  id: 'refine-wood-4-0',
  tier: 4,
  enchant: 0,
  productId: 'T4_PLANKS',
  productLabel: '4.0 Plank',
  inputs: [
    { itemId: 'T4_WOOD', quantity: 2, label: '4.0 Log' },
    { itemId: 'T3_PLANKS', quantity: 1, label: 'T3 Plank' },
  ],
  nutrition: 1.8,
  focusCost: 54,
};

// Mock transmutation
const mockTransmutation: Transmutation = {
  id: 'tx-wood-7.0-8.0',
  fromId: 'T7_WOOD',
  toId: 'T8_WOOD',
  fromLabel: '7.0 Log',
  toLabel: '8.0 Log',
  transmuteCost: 5780,
};

describe('calculateRefine', () => {
  const prices: Record<string, number> = {
    T4_WOOD: 100,
    T3_PLANKS: 200,
    T4_PLANKS: 500,
  };
  const getBuyPrice = (id: string) => prices[id] ?? 0;
  const getSellPrice = (id: string) => prices[id] ?? 0;

  it('calculates material cost correctly', () => {
    const result = calculateRefine(mockRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS);
    // 2 × 100 + 1 × 200 = 400
    expect(result.materialCost).toBe(400);
  });

  it('calculates nutrition cost correctly', () => {
    const result = calculateRefine(mockRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS);
    // 395 × 1.8 / 100 = 7.11, rounded = 7
    expect(result.nutritionCost).toBe(7);
  });

  it('calculates effective cost with return rate', () => {
    const result = calculateRefine(mockRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS);
    // keepRateNoFocus = (100 - 36.7) / 100 = 0.633
    // effectiveCostNoFocus = 0.633 × 400 + 7 = 253.2 + 7 = 260.2
    expect(result.effectiveCostNoFocus).toBeCloseTo(260.2, 1);
  });

  it('calculates estimated sell price with markdown', () => {
    const result = calculateRefine(mockRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS);
    // 500 × (100 - 5) / 100 = 500 × 0.95 = 475
    expect(result.estimatedSellPrice).toBe(475);
  });

  it('calculates profit correctly', () => {
    const result = calculateRefine(mockRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS);
    // profitNoFocus = 475 - 260.2 = 214.8
    expect(result.profitNoFocus).toBeCloseTo(214.8, 1);
  });

  it('focus profit is higher than no-focus profit', () => {
    const result = calculateRefine(mockRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS);
    expect(result.profitWithFocus).toBeGreaterThan(result.profitNoFocus);
  });

  it('returns productPrice from getSellPrice', () => {
    const result = calculateRefine(mockRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS);
    expect(result.productPrice).toBe(500);
  });

  it('handles zero prices', () => {
    const zeroPrices = (_id: string) => 0;
    const result = calculateRefine(mockRecipe, zeroPrices, zeroPrices, DEFAULT_SETTINGS);
    expect(result.materialCost).toBe(0);
    expect(result.estimatedSellPrice).toBe(0);
  });

  it('calculates focus efficiency', () => {
    const result = calculateRefine(mockRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS);
    // focusEfficiency = round(profitWithFocus / 54 × 16)
    expect(typeof result.focusEfficiency).toBe('number');
    expect(result.focusEfficiency).toBeGreaterThan(0);
  });

  it('custom settings affect results', () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      returnRateNoFocus: 50,
      sellMarkdown: 10,
    };
    const result = calculateRefine(mockRecipe, getBuyPrice, getSellPrice, customSettings);
    // keepRateNoFocus = 0.5, estimatedSell = 500 × 0.90 = 450
    expect(result.effectiveCostNoFocus).toBeCloseTo(0.5 * 400 + 7, 1);
    expect(result.estimatedSellPrice).toBe(450);
  });
});

describe('calculateTransmutation', () => {
  const prices: Record<string, number> = {
    T7_WOOD: 2000,
    T8_WOOD: 10000,
  };
  const getBuyPrice = (id: string) => prices[id] ?? 0;
  const getSellPrice = (id: string) => prices[id] ?? 0;

  it('calculates source price correctly', () => {
    const result = calculateTransmutation(mockTransmutation, getBuyPrice, getSellPrice);
    expect(result.sourcePrice).toBe(2000);
  });

  it('calculates total cost as transmuteCost + sourcePrice', () => {
    const result = calculateTransmutation(mockTransmutation, getBuyPrice, getSellPrice);
    expect(result.totalCost).toBe(5780 + 2000);
  });

  it('calculates product price correctly', () => {
    const result = calculateTransmutation(mockTransmutation, getBuyPrice, getSellPrice);
    expect(result.productPrice).toBe(10000);
  });

  it('calculates profit/loss as totalCost - productPrice', () => {
    const result = calculateTransmutation(mockTransmutation, getBuyPrice, getSellPrice);
    // 7780 - 10000 = -2220 (negative = profitable)
    expect(result.profitLoss).toBe(-2220);
  });

  it('handles zero source price', () => {
    const result = calculateTransmutation(mockTransmutation, () => 0, getSellPrice);
    expect(result.sourcePrice).toBe(0);
    expect(result.totalCost).toBe(5780);
  });
});

describe('formatSilver', () => {
  it('returns dash for zero', () => {
    expect(formatSilver(0)).toBe('-');
  });

  it('formats positive numbers with commas', () => {
    expect(formatSilver(1000)).toBe('1,000');
    expect(formatSilver(1234567)).toBe('1,234,567');
  });

  it('formats negative numbers', () => {
    expect(formatSilver(-500)).toBe('-500');
    expect(formatSilver(-1000)).toBe('-1,000');
  });

  it('formats small numbers without commas', () => {
    expect(formatSilver(42)).toBe('42');
    expect(formatSilver(999)).toBe('999');
  });
});

/* ─── Transmute-before-refine tests ─── */

// Mock: recipe for T6.2 Plank requiring 4× T6_WOOD@2 + 1× T5_PLANKS@2
const transmuteRecipe: Recipe = {
  id: 'refine-wood-6-2',
  tier: 6,
  enchant: 2,
  productId: 'T6_PLANKS@2',
  productLabel: '6.2 Plank',
  inputs: [
    { itemId: 'T6_WOOD@2', quantity: 4, label: '6.2 Log' },
    { itemId: 'T5_PLANKS@2', quantity: 1, label: '5.2 Plank' },
  ],
  nutrition: 7.2,
  focusCost: 216,
};

// Two transmutations that produce T6_WOOD@2
const transmutations: Transmutation[] = [
  {
    id: 'tx-wood-5.2-6.2',
    fromId: 'T5_WOOD@2',
    toId: 'T6_WOOD@2',
    fromLabel: '5.2 Log',
    toLabel: '6.2 Log',
    transmuteCost: 5780,
  },
  {
    id: 'tx-wood-6.1-6.2',
    fromId: 'T6_WOOD@1',
    toId: 'T6_WOOD@2',
    fromLabel: '6.1 Log',
    toLabel: '6.2 Log',
    transmuteCost: 6936,
  },
  // Unrelated transmutation
  {
    id: 'tx-wood-7.0-8.0',
    fromId: 'T7_WOOD',
    toId: 'T8_WOOD',
    fromLabel: '7.0 Log',
    toLabel: '8.0 Log',
    transmuteCost: 5780,
  },
];

describe('findBestTransmuteForInput', () => {
  it('finds the cheapest transmute path that beats direct buy', () => {
    // T6_WOOD@2 costs 10000, T5_WOOD@2 costs 2000, T6_WOOD@1 costs 1500
    // Path 1: 2000 + 5780 = 7780 (saves 2220/unit)
    // Path 2: 1500 + 6936 = 8436 (saves 1564/unit)
    // Path 1 is cheaper
    const prices: Record<string, number> = {
      'T6_WOOD@2': 10000,
      'T5_WOOD@2': 2000,
      'T6_WOOD@1': 1500,
    };
    const getBuyPrice = (id: string) => prices[id] ?? 0;

    const result = findBestTransmuteForInput('T6_WOOD@2', transmutations, getBuyPrice);
    expect(result).not.toBeNull();
    expect(result!.transmutation.id).toBe('tx-wood-5.2-6.2');
    expect(result!.costPerUnit).toBe(7780);
    expect(result!.savingsPerUnit).toBe(2220);
  });

  it('returns null when no transmute path is cheaper', () => {
    // T6_WOOD@2 costs 100 (very cheap), transmute paths are more expensive
    const prices: Record<string, number> = {
      'T6_WOOD@2': 100,
      'T5_WOOD@2': 2000,
      'T6_WOOD@1': 1500,
    };
    const getBuyPrice = (id: string) => prices[id] ?? 0;

    const result = findBestTransmuteForInput('T6_WOOD@2', transmutations, getBuyPrice);
    expect(result).toBeNull();
  });

  it('returns null when no transmutations target the item', () => {
    const getBuyPrice = () => 1000;
    const result = findBestTransmuteForInput('T4_WOOD', transmutations, getBuyPrice);
    expect(result).toBeNull();
  });

  it('skips sources with zero price', () => {
    const prices: Record<string, number> = {
      'T6_WOOD@2': 10000,
      'T5_WOOD@2': 0,    // no data
      'T6_WOOD@1': 1500,
    };
    const getBuyPrice = (id: string) => prices[id] ?? 0;

    const result = findBestTransmuteForInput('T6_WOOD@2', transmutations, getBuyPrice);
    expect(result).not.toBeNull();
    expect(result!.transmutation.id).toBe('tx-wood-6.1-6.2');
  });
});

describe('calculateRefineWithTransmute', () => {
  it('returns null transmuteAlt when no cheaper path exists', () => {
    const prices: Record<string, number> = {
      'T6_WOOD@2': 100,
      'T5_PLANKS@2': 200,
      'T6_PLANKS@2': 1000,
      'T5_WOOD@2': 5000,
      'T6_WOOD@1': 5000,
    };
    const getBuyPrice = (id: string) => prices[id] ?? 0;
    const getSellPrice = (id: string) => prices[id] ?? 0;

    const result = calculateRefineWithTransmute(transmuteRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS, transmutations);
    expect(result.transmuteAlt).toBeNull();
    expect(result.materialCost).toBe(4 * 100 + 1 * 200); // 600
  });

  it('returns valid transmuteAlt when transmuting is cheaper', () => {
    const prices: Record<string, number> = {
      'T6_WOOD@2': 10000,
      'T5_PLANKS@2': 500,
      'T6_PLANKS@2': 50000,
      'T5_WOOD@2': 2000,
      'T6_WOOD@1': 1500,
    };
    const getBuyPrice = (id: string) => prices[id] ?? 0;
    const getSellPrice = (id: string) => prices[id] ?? 0;

    const result = calculateRefineWithTransmute(transmuteRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS, transmutations);
    expect(result.transmuteAlt).not.toBeNull();
    expect(result.transmuteAlt!.quantity).toBe(4);
    // Transmute path: 2000 + 5780 = 7780/unit, direct: 10000/unit, savings: 2220/unit
    expect(result.transmuteAlt!.alternative.savingsPerUnit).toBe(2220);
    expect(result.transmuteAlt!.totalSavings).toBe(2220 * 4);
  });

  it('adjusted material cost is lower when transmuting', () => {
    const prices: Record<string, number> = {
      'T6_WOOD@2': 10000,
      'T5_PLANKS@2': 500,
      'T6_PLANKS@2': 50000,
      'T5_WOOD@2': 2000,
      'T6_WOOD@1': 1500,
    };
    const getBuyPrice = (id: string) => prices[id] ?? 0;
    const getSellPrice = (id: string) => prices[id] ?? 0;

    const result = calculateRefineWithTransmute(transmuteRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS, transmutations);
    // Original: 4*10000 + 1*500 = 40500
    // Adjusted: 4*7780 + 1*500 = 31620
    expect(result.materialCost).toBe(40500);
    expect(result.transmuteAlt!.adjustedMaterialCost).toBe(31620);
    expect(result.transmuteAlt!.adjustedMaterialCost).toBeLessThan(result.materialCost);
  });

  it('adjusted profits are higher when transmuting', () => {
    const prices: Record<string, number> = {
      'T6_WOOD@2': 10000,
      'T5_PLANKS@2': 500,
      'T6_PLANKS@2': 50000,
      'T5_WOOD@2': 2000,
      'T6_WOOD@1': 1500,
    };
    const getBuyPrice = (id: string) => prices[id] ?? 0;
    const getSellPrice = (id: string) => prices[id] ?? 0;

    const result = calculateRefineWithTransmute(transmuteRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS, transmutations);
    expect(result.transmuteAlt!.adjustedProfitNoFocus).toBeGreaterThan(result.profitNoFocus);
    expect(result.transmuteAlt!.adjustedProfitWithFocus).toBeGreaterThan(result.profitWithFocus);
  });

  it('base result values match calculateRefine', () => {
    const prices: Record<string, number> = {
      'T6_WOOD@2': 10000,
      'T5_PLANKS@2': 500,
      'T6_PLANKS@2': 50000,
      'T5_WOOD@2': 2000,
      'T6_WOOD@1': 1500,
    };
    const getBuyPrice = (id: string) => prices[id] ?? 0;
    const getSellPrice = (id: string) => prices[id] ?? 0;

    const base = calculateRefine(transmuteRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS);
    const withTx = calculateRefineWithTransmute(transmuteRecipe, getBuyPrice, getSellPrice, DEFAULT_SETTINGS, transmutations);

    expect(withTx.materialCost).toBe(base.materialCost);
    expect(withTx.profitNoFocus).toBe(base.profitNoFocus);
    expect(withTx.profitWithFocus).toBe(base.profitWithFocus);
    expect(withTx.focusEfficiency).toBe(base.focusEfficiency);
  });
});
