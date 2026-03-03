import { describe, it, expect } from 'vitest';
import { RECIPES_BY_RESOURCE, ALL_RECIPES } from './recipes';
import { RESOURCES, RESOURCE_TYPES, rawId, refinedId } from './items';

describe('buildAllRecipes', () => {
  it('generates 25 recipes per resource (T4-T8 × enchant 0-4)', () => {
    for (const type of RESOURCE_TYPES) {
      const recipes = RECIPES_BY_RESOURCE[type];
      expect(recipes).toHaveLength(25);
    }
  });

  it('ALL_RECIPES is the wood set (backward compat)', () => {
    expect(ALL_RECIPES).toBe(RECIPES_BY_RESOURCE.wood);
  });

  it('each recipe has correct structure', () => {
    for (const type of RESOURCE_TYPES) {
      for (const recipe of RECIPES_BY_RESOURCE[type]) {
        expect(recipe.id).toBeTruthy();
        expect(recipe.tier).toBeGreaterThanOrEqual(4);
        expect(recipe.tier).toBeLessThanOrEqual(8);
        expect(recipe.enchant).toBeGreaterThanOrEqual(0);
        expect(recipe.enchant).toBeLessThanOrEqual(4);
        expect(recipe.productId).toBeTruthy();
        expect(recipe.productLabel).toBeTruthy();
        expect(recipe.inputs.length).toBeGreaterThanOrEqual(2);
        expect(recipe.nutrition).toBeGreaterThan(0);
        expect(recipe.focusCost).toBeGreaterThan(0);
      }
    }
  });

  it('recipe IDs are unique within each resource', () => {
    for (const type of RESOURCE_TYPES) {
      const ids = RECIPES_BY_RESOURCE[type].map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('recipe IDs are unique across all resources', () => {
    const allIds = RESOURCE_TYPES.flatMap(t => RECIPES_BY_RESOURCE[t].map(r => r.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

describe('recipe product IDs', () => {
  it('wood recipes produce planks', () => {
    for (const r of RECIPES_BY_RESOURCE.wood) {
      expect(r.productId).toBe(refinedId(RESOURCES.wood, r.tier, r.enchant));
    }
  });

  it('ore recipes produce metal bars', () => {
    for (const r of RECIPES_BY_RESOURCE.ore) {
      expect(r.productId).toBe(refinedId(RESOURCES.ore, r.tier, r.enchant));
    }
  });

  it('stone recipes produce stone blocks', () => {
    for (const r of RECIPES_BY_RESOURCE.stone) {
      expect(r.productId).toBe(refinedId(RESOURCES.stone, r.tier, r.enchant));
    }
  });
});

describe('recipe inputs', () => {
  it('first input is always the raw resource', () => {
    for (const type of RESOURCE_TYPES) {
      const config = RESOURCES[type];
      for (const recipe of RECIPES_BY_RESOURCE[type]) {
        expect(recipe.inputs[0].itemId).toBe(rawId(config, recipe.tier, recipe.enchant));
      }
    }
  });

  it('last input is always the lower tier refined item', () => {
    for (const type of RESOURCE_TYPES) {
      const config = RESOURCES[type];
      for (const recipe of RECIPES_BY_RESOURCE[type]) {
        const lastInput = recipe.inputs[recipe.inputs.length - 1];
        expect(lastInput.quantity).toBe(1);
        if (recipe.tier === 4) {
          expect(lastInput.itemId).toBe(config.t3RefinedId);
        } else {
          expect(lastInput.itemId).toBe(refinedId(config, recipe.tier - 1, recipe.enchant));
        }
      }
    }
  });

  it('raw resource quantities match expected counts by tier', () => {
    const expectedByTier: Record<number, number> = { 4: 2, 5: 3, 6: 4, 7: 5, 8: 5 };
    for (const type of RESOURCE_TYPES) {
      for (const recipe of RECIPES_BY_RESOURCE[type]) {
        // Hearts replace some raws at high enchant, but first input qty should match
        // unless hearts are involved
        if (recipe.inputs.length === 2) {
          // No hearts: raw count should match expected
          expect(recipe.inputs[0].quantity).toBe(expectedByTier[recipe.tier]);
        }
      }
    }
  });

  it('high tier/enchant recipes include hearts', () => {
    for (const type of RESOURCE_TYPES) {
      const config = RESOURCES[type];
      const t8e2 = RECIPES_BY_RESOURCE[type].find(r => r.tier === 8 && r.enchant === 2)!;
      const t8e3 = RECIPES_BY_RESOURCE[type].find(r => r.tier === 8 && r.enchant === 3)!;
      const t7e3 = RECIPES_BY_RESOURCE[type].find(r => r.tier === 7 && r.enchant === 3)!;

      // These should have 3 inputs (raw + heart + lower refined)
      expect(t8e2.inputs).toHaveLength(3);
      expect(t8e3.inputs).toHaveLength(3);
      expect(t7e3.inputs).toHaveLength(3);

      // Heart input should be the resource's heart
      expect(t8e2.inputs[1].itemId).toBe(config.heartId);
      expect(t8e3.inputs[1].itemId).toBe(config.heartId);
      expect(t7e3.inputs[1].itemId).toBe(config.heartId);
    }
  });
});

describe('focus costs', () => {
  it('all resources share the same focus costs for same tier/enchant', () => {
    for (let i = 0; i < 25; i++) {
      const woodRecipe = RECIPES_BY_RESOURCE.wood[i];
      for (const type of RESOURCE_TYPES) {
        const recipe = RECIPES_BY_RESOURCE[type][i];
        expect(recipe.focusCost).toBe(woodRecipe.focusCost);
        expect(recipe.tier).toBe(woodRecipe.tier);
        expect(recipe.enchant).toBe(woodRecipe.enchant);
      }
    }
  });

  it('focus cost increases with tier and enchant', () => {
    for (const type of RESOURCE_TYPES) {
      const recipes = RECIPES_BY_RESOURCE[type];
      const t4e0 = recipes.find(r => r.tier === 4 && r.enchant === 0)!;
      const t4e4 = recipes.find(r => r.tier === 4 && r.enchant === 4)!;
      const t8e0 = recipes.find(r => r.tier === 8 && r.enchant === 0)!;
      const t8e4 = recipes.find(r => r.tier === 8 && r.enchant === 4)!;

      expect(t4e0.focusCost).toBeLessThan(t4e4.focusCost);
      expect(t4e0.focusCost).toBeLessThan(t8e0.focusCost);
      expect(t8e4.focusCost).toBeGreaterThan(t8e0.focusCost);
    }
  });
});

describe('product labels', () => {
  it('wood products labeled as Plank', () => {
    expect(RECIPES_BY_RESOURCE.wood[0].productLabel).toContain('Plank');
  });

  it('stone products labeled as Block', () => {
    expect(RECIPES_BY_RESOURCE.stone[0].productLabel).toContain('Block');
  });

  it('ore products labeled as Bar', () => {
    expect(RECIPES_BY_RESOURCE.ore[0].productLabel).toContain('Bar');
  });

  it('hide products labeled as Leather', () => {
    expect(RECIPES_BY_RESOURCE.hide[0].productLabel).toContain('Leather');
  });

  it('fiber products labeled as Cloth', () => {
    expect(RECIPES_BY_RESOURCE.fiber[0].productLabel).toContain('Cloth');
  });
});
