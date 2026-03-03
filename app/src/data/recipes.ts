import { rawId, refinedId, type ResourceConfig, type ResourceType, RESOURCES } from './items';

export interface RecipeInput {
  itemId: string;
  quantity: number;
  label: string;
}

export interface Recipe {
  id: string;
  tier: number;
  enchant: number;
  productId: string;
  productLabel: string;
  inputs: RecipeInput[];
  nutrition: number;
  focusCost: number;
}

// Focus costs per [tier-4][enchant] — same for all resource types
const FOCUS_COSTS: number[][] = [
  // T4:  .0   .1   .2    .3    .4
  [54, 94, 164, 287, 503],
  // T5
  [94, 164, 287, 503, 880],
  // T6
  [164, 287, 503, 880, 1539],
  // T7
  [287, 503, 880, 1539, 2694],
  // T8
  [503, 880, 1539, 2694, 4714],
];

// Base nutrition for T4.0 = 1.8, doubles per tier and per enchant
function getNutrition(tier: number, enchant: number): number {
  const base = 1.8;
  const tierMult = Math.pow(2, tier - 4);
  const enchantMult = Math.pow(2, enchant);
  return base * tierMult * enchantMult;
}

// Raw resource required per refine — same for all resource types
function getRawCount(tier: number, enchant: number): { raws: number; hearts: number } {
  // Special cases: high tier + high enchant require hearts
  if (tier === 8 && (enchant === 2 || enchant === 3)) return { raws: 4, hearts: 1 };
  if (tier === 7 && enchant === 3) return { raws: 4, hearts: 1 };

  // Standard counts by tier
  const rawsByTier: Record<number, number> = { 4: 2, 5: 3, 6: 4, 7: 5, 8: 5 };
  return { raws: rawsByTier[tier], hearts: 0 };
}

// Lower refined item needed: same enchant, one tier lower. T4 uses T3 (always enchant 0)
function getLowerRefinedId(config: ResourceConfig, tier: number, enchant: number): string {
  if (tier === 4) return config.t3RefinedId;
  return refinedId(config, tier - 1, enchant);
}

function getLowerRefinedLabel(config: ResourceConfig, tier: number, enchant: number): string {
  if (tier === 4) return `T3 ${config.refinedLabel}`;
  const enchStr = enchant > 0 ? `.${enchant}` : '';
  return `${tier - 1}${enchStr} ${config.refinedLabel}`;
}

export function buildAllRecipes(config: ResourceConfig): Recipe[] {
  const recipes: Recipe[] = [];

  for (let tier = 4; tier <= 8; tier++) {
    for (let enchant = 0; enchant <= 4; enchant++) {
      const { raws, hearts } = getRawCount(tier, enchant);
      const enchStr = enchant > 0 ? `.${enchant}` : '.0';

      const inputs: RecipeInput[] = [
        {
          itemId: rawId(config, tier, enchant),
          quantity: raws,
          label: `${tier}${enchant > 0 ? `.${enchant}` : '.0'} ${config.rawLabel}`,
        },
      ];

      if (hearts > 0) {
        inputs.push({
          itemId: config.heartId,
          quantity: hearts,
          label: config.heartLabel,
        });
      }

      inputs.push({
        itemId: getLowerRefinedId(config, tier, enchant),
        quantity: 1,
        label: getLowerRefinedLabel(config, tier, enchant),
      });

      recipes.push({
        id: `refine-${config.type}-${tier}-${enchant}`,
        tier,
        enchant,
        productId: refinedId(config, tier, enchant),
        productLabel: `${tier}${enchStr} ${config.refinedLabel}`,
        inputs,
        nutrition: getNutrition(tier, enchant),
        focusCost: FOCUS_COSTS[tier - 4][enchant],
      });
    }
  }

  return recipes;
}

// Pre-built recipe sets for each resource type
export const RECIPES_BY_RESOURCE: Record<ResourceType, Recipe[]> = {
  wood: buildAllRecipes(RESOURCES.wood),
  stone: buildAllRecipes(RESOURCES.stone),
  ore: buildAllRecipes(RESOURCES.ore),
  hide: buildAllRecipes(RESOURCES.hide),
  fiber: buildAllRecipes(RESOURCES.fiber),
};

// Backward compat
export const ALL_RECIPES = RECIPES_BY_RESOURCE.wood;
