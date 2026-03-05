import type { Recipe } from '../data/recipes';
import type { Transmutation } from '../data/transmutations';

export interface Settings {
  returnRateNoFocus: number;   // 36.7
  returnRateWithFocus: number; // 53.9
  nutritionPricePer100: number; // 395
  sellMarkdown: number;        // 5 (percent)
  enableTransmute: boolean;    // calculate cheaper-via-transmute
}

export const DEFAULT_SETTINGS: Settings = {
  returnRateNoFocus: 36.7,
  returnRateWithFocus: 53.9,
  nutritionPricePer100: 395,
  sellMarkdown: 5,
  enableTransmute: true,
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

/* ─── Transmute-before-refine optimization ─── */

export interface TransmuteAlternative {
  transmutation: Transmutation;
  sourceBuyPrice: number;   // buy price of the source (fromId)
  costPerUnit: number;       // sourceBuyPrice + transmuteCost
  directBuyPrice: number;    // buy price of the target input directly
  savingsPerUnit: number;    // directBuyPrice - costPerUnit (positive = saves money)
}

/**
 * For a given raw-resource input, find the cheapest transmutation path
 * that produces it for less than buying it directly.
 * Returns null if no cheaper path exists.
 */
export function findBestTransmuteForInput(
  targetItemId: string,
  transmutations: Transmutation[],
  getBuyPrice: (id: string) => number,
): TransmuteAlternative | null {
  const directBuyPrice = getBuyPrice(targetItemId);

  let best: TransmuteAlternative | null = null;

  for (const tx of transmutations) {
    if (tx.toId !== targetItemId) continue;

    const sourceBuyPrice = getBuyPrice(tx.fromId);
    if (sourceBuyPrice === 0) continue; // no price data for source

    const costPerUnit = sourceBuyPrice + tx.transmuteCost;
    const savingsPerUnit = directBuyPrice - costPerUnit;

    if (savingsPerUnit > 0 && (best === null || costPerUnit < best.costPerUnit)) {
      best = { transmutation: tx, sourceBuyPrice, costPerUnit, directBuyPrice, savingsPerUnit };
    }
  }

  return best;
}

export interface TransmuteAltResult {
  alternative: TransmuteAlternative;
  quantity: number;
  totalSavings: number;
  adjustedMaterialCost: number;
  adjustedProfitNoFocus: number;
  adjustedProfitWithFocus: number;
}

export interface RefineResultWithTransmute extends RefineResult {
  transmuteAlt: TransmuteAltResult | null;
}

/**
 * Calculate refine result AND check whether transmuting the raw-resource input
 * (recipe.inputs[0]) would be cheaper. Returns extended result with transmute data.
 */
export function calculateRefineWithTransmute(
  recipe: Recipe,
  getBuyPrice: (id: string) => number,
  getSellPrice: (id: string) => number,
  settings: Settings,
  transmutations: Transmutation[],
): RefineResultWithTransmute {
  const base = calculateRefine(recipe, getBuyPrice, getSellPrice, settings);

  // Only the first input is a raw resource eligible for transmutation
  const rawInput = recipe.inputs[0];
  const alt = findBestTransmuteForInput(rawInput.itemId, transmutations, getBuyPrice);

  if (!alt) {
    return { ...base, transmuteAlt: null };
  }

  const quantity = rawInput.quantity;
  const totalSavings = alt.savingsPerUnit * quantity;

  // Adjusted material cost: replace raw input cost with transmute cost
  const adjustedMaterialCost = base.materialCost - (alt.directBuyPrice * quantity) + (alt.costPerUnit * quantity);

  const keepRateNoFocus = (100 - settings.returnRateNoFocus) / 100;
  const keepRateWithFocus = (100 - settings.returnRateWithFocus) / 100;

  const adjustedEffectiveCostNoFocus = keepRateNoFocus * adjustedMaterialCost + base.nutritionCost;
  const adjustedEffectiveCostWithFocus = keepRateWithFocus * adjustedMaterialCost + base.nutritionCost;

  const adjustedProfitNoFocus = base.estimatedSellPrice - adjustedEffectiveCostNoFocus;
  const adjustedProfitWithFocus = base.estimatedSellPrice - adjustedEffectiveCostWithFocus;

  return {
    ...base,
    transmuteAlt: {
      alternative: alt,
      quantity,
      totalSavings,
      adjustedMaterialCost,
      adjustedProfitNoFocus,
      adjustedProfitWithFocus,
    },
  };
}

export function formatSilver(value: number): string {
  if (value === 0) return '-';
  return value.toLocaleString('en-US');
}
