import { describe, it, expect } from 'vitest';
import {
  rawId, refinedId, woodId, plankId,
  RESOURCES, RESOURCE_TYPES, getAllItemIds,
  type ResourceType, type ResourceConfig,
} from './items';

describe('Resource configurations', () => {
  it('has all 5 resource types defined', () => {
    expect(RESOURCE_TYPES).toEqual(['wood', 'stone', 'ore', 'hide', 'fiber']);
    expect(Object.keys(RESOURCES)).toHaveLength(5);
  });

  it('each resource has required fields', () => {
    for (const type of RESOURCE_TYPES) {
      const config = RESOURCES[type];
      expect(config.type).toBe(type);
      expect(config.label).toBeTruthy();
      expect(config.rawIdBase).toBeTruthy();
      expect(config.refinedIdBase).toBeTruthy();
      expect(config.rawLabel).toBeTruthy();
      expect(config.refinedLabel).toBeTruthy();
      expect(config.heartId).toMatch(/^T1_FACTION_/);
      expect(config.heartLabel).toBeTruthy();
      expect(config.t3RefinedId).toMatch(/^T3_/);
    }
  });

  it('each resource has unique item ID bases', () => {
    const rawBases = RESOURCE_TYPES.map(t => RESOURCES[t].rawIdBase);
    const refinedBases = RESOURCE_TYPES.map(t => RESOURCES[t].refinedIdBase);
    expect(new Set(rawBases).size).toBe(5);
    expect(new Set(refinedBases).size).toBe(5);
  });

  it('each resource has unique heart tokens', () => {
    const hearts = RESOURCE_TYPES.map(t => RESOURCES[t].heartId);
    expect(new Set(hearts).size).toBe(5);
  });
});

describe('rawId / refinedId', () => {
  it('generates correct wood IDs', () => {
    expect(rawId(RESOURCES.wood, 4, 0)).toBe('T4_WOOD');
    expect(rawId(RESOURCES.wood, 6, 3)).toBe('T6_WOOD@3');
    expect(refinedId(RESOURCES.wood, 4, 0)).toBe('T4_PLANKS');
    expect(refinedId(RESOURCES.wood, 8, 4)).toBe('T8_PLANKS@4');
  });

  it('generates correct stone IDs', () => {
    expect(rawId(RESOURCES.stone, 5, 0)).toBe('T5_ROCK');
    expect(rawId(RESOURCES.stone, 7, 2)).toBe('T7_ROCK@2');
    expect(refinedId(RESOURCES.stone, 6, 0)).toBe('T6_STONEBLOCK');
    expect(refinedId(RESOURCES.stone, 6, 1)).toBe('T6_STONEBLOCK@1');
  });

  it('generates correct ore IDs', () => {
    expect(rawId(RESOURCES.ore, 4, 0)).toBe('T4_ORE');
    expect(refinedId(RESOURCES.ore, 8, 0)).toBe('T8_METALBAR');
    expect(refinedId(RESOURCES.ore, 8, 4)).toBe('T8_METALBAR@4');
  });

  it('generates correct hide IDs', () => {
    expect(rawId(RESOURCES.hide, 5, 1)).toBe('T5_HIDE@1');
    expect(refinedId(RESOURCES.hide, 7, 0)).toBe('T7_LEATHER');
  });

  it('generates correct fiber IDs', () => {
    expect(rawId(RESOURCES.fiber, 4, 0)).toBe('T4_FIBER');
    expect(refinedId(RESOURCES.fiber, 4, 0)).toBe('T4_CLOTH');
    expect(refinedId(RESOURCES.fiber, 6, 2)).toBe('T6_CLOTH@2');
  });

  it('enchant 0 has no @ suffix', () => {
    for (const type of RESOURCE_TYPES) {
      const config = RESOURCES[type];
      expect(rawId(config, 4, 0)).not.toContain('@');
      expect(refinedId(config, 4, 0)).not.toContain('@');
    }
  });

  it('enchant > 0 has @N suffix', () => {
    for (const type of RESOURCE_TYPES) {
      const config = RESOURCES[type];
      for (let e = 1; e <= 4; e++) {
        expect(rawId(config, 4, e)).toContain(`@${e}`);
        expect(refinedId(config, 4, e)).toContain(`@${e}`);
      }
    }
  });
});

describe('woodId / plankId backward compat', () => {
  it('woodId matches rawId for wood', () => {
    expect(woodId(4, 0)).toBe(rawId(RESOURCES.wood, 4, 0));
    expect(woodId(7, 3)).toBe(rawId(RESOURCES.wood, 7, 3));
  });

  it('plankId matches refinedId for wood', () => {
    expect(plankId(5, 0)).toBe(refinedId(RESOURCES.wood, 5, 0));
    expect(plankId(8, 4)).toBe(refinedId(RESOURCES.wood, 8, 4));
  });
});

describe('getAllItemIds', () => {
  const ids = getAllItemIds();

  it('returns a non-empty array', () => {
    expect(ids.length).toBeGreaterThan(0);
  });

  it('has no duplicates', () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes items for all resource types', () => {
    expect(ids).toContain('T4_WOOD');
    expect(ids).toContain('T4_PLANKS');
    expect(ids).toContain('T4_ROCK');
    expect(ids).toContain('T4_STONEBLOCK');
    expect(ids).toContain('T4_ORE');
    expect(ids).toContain('T4_METALBAR');
    expect(ids).toContain('T4_HIDE');
    expect(ids).toContain('T4_LEATHER');
    expect(ids).toContain('T4_FIBER');
    expect(ids).toContain('T4_CLOTH');
  });

  it('includes all T3 base items', () => {
    expect(ids).toContain('T3_PLANKS');
    expect(ids).toContain('T3_STONEBLOCK');
    expect(ids).toContain('T3_METALBAR');
    expect(ids).toContain('T3_LEATHER');
    expect(ids).toContain('T3_CLOTH');
  });

  it('includes all heart tokens', () => {
    for (const type of RESOURCE_TYPES) {
      expect(ids).toContain(RESOURCES[type].heartId);
    }
  });

  it('includes enchanted items', () => {
    expect(ids).toContain('T6_WOOD@3');
    expect(ids).toContain('T8_METALBAR@4');
    expect(ids).toContain('T5_HIDE@1');
  });

  // 5 resources × (1 T3 + 25 raw + 25 refined) + 5 hearts = 260
  // some hearts may equal T3 ids... let's just check minimum
  it('has the expected count of unique IDs', () => {
    // 5 resources × (1 T3 + 25 raw T4-T8 × 5 enchants + 25 refined) + 5 hearts
    // = 5 × (1 + 25 + 25) + 5 = 5 × 51 + 5 = 260
    expect(ids.length).toBe(260);
  });
});
