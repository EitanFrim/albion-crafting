import type { Recipe } from '../data/recipes';
import type { Transmutation } from '../data/transmutations';

export interface Settings {
  returnRateNoFocus: number;   // 36.7
  returnRateWithFocus: number; // 53.9
  nutritionPricePer100: number; // 395
  sellMarkdown: number;        // 5 (percent)
}

export const DEFAULT_SETTINGS: Settings = {
  returnRateNoFocus: 36.7,
  returnRateWithFocus: 53.9,
  nutritionPricePer100: 395,
  sellMarkdown: 5,
};

export interface RefineResult {
  recipe: Recipe;
  materialCost: number;
  nutritionCost: number;
  effectiveCostNoFocus: number;
  effectiveCostWithFocus: number;
  estimatedSellPrice: number;
  profitNoFocus: number;
  profitWithFocus: number;
  focusEfficiency: number;
  productPrice: number;
}

export function calculateRefine(
  recipe: Recipe,
  getBuyPrice: (itemId: string) => number,
  getSellPrice: (itemId: string) => number,
  settings: Settings
): RefineResult {
  let materialCost = 0;
  for (const input of recipe.inputs) {
    materialCost += input.quantity * getBuyPrice(input.itemId);
  }

  const nutritionCost = Math.round(
    settings.nutritionPricePer100 * recipe.nutrition / 100
  );

  const keepRateNoFocus = (100 - settings.returnRateNoFocus) / 100;
  const keepRateWithFocus = (100 - settings.returnRateWithFocus) / 100;

  const effectiveCostNoFocus = keepRateNoFocus * materialCost + nutritionCost;
  const effectiveCostWithFocus = keepRateWithFocus * materialCost + nutritionCost;

  const productPrice = getSellPrice(recipe.productId);
  const markdownMultiplier = (100 - settings.sellMarkdown) / 100;
  const estimatedSellPrice = productPrice * markdownMultiplier;

  const profitNoFocus = estimatedSellPrice - effectiveCostNoFocus;
  const profitWithFocus = estimatedSellPrice - effectiveCostWithFocus;

  const focusEfficiency = recipe.focusCost > 0
    ? Math.round(profitWithFocus / recipe.focusCost * 16)
    : 0;

  return {
    recipe,
    materialCost,
    nutritionCost,
    effectiveCostNoFocus,
    effectiveCostWithFocus,
    estimatedSellPrice,
    profitNoFocus,
    profitWithFocus,
    focusEfficiency,
    productPrice,
  };
}

export interface TransmuteResult {
  transmutation: Transmutation;
  sourcePrice: number;
  totalCost: number;
  productPrice: number;
  profitLoss: number;
}

export function calculateTransmutation(
  tx: Transmutation,
  getBuyPrice: (itemId: string) => number,
  getSellPrice: (itemId: string) => number
): TransmuteResult {
  const sourcePrice = getBuyPrice(tx.fromId);
  const totalCost = tx.transmuteCost + sourcePrice;
  const productPrice = getSellPrice(tx.toId);
  const profitLoss = totalCost - productPrice;

  return {
    transmutation: tx,
    sourcePrice,
    totalCost,
    productPrice,
    profitLoss,
  };
}

export function formatSilver(value: number): string {
  if (value === 0) return '-';
  return value.toLocaleString('en-US');
}
