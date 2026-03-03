import { describe, it, expect } from 'vitest';
import { calculateRefine, calculateTransmutation, formatSilver, DEFAULT_SETTINGS } from './calculations';
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
