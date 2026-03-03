import { describe, it, expect } from 'vitest';
import { TRANSMUTATIONS_BY_RESOURCE, ALL_TRANSMUTATIONS } from './transmutations';
import { RESOURCE_TYPES } from './items';

describe('buildAllTransmutations', () => {
  it('generates 28 transmutation paths per resource', () => {
    for (const type of RESOURCE_TYPES) {
      expect(TRANSMUTATIONS_BY_RESOURCE[type]).toHaveLength(28);
    }
  });

  it('ALL_TRANSMUTATIONS is the wood set (backward compat)', () => {
    expect(ALL_TRANSMUTATIONS).toBe(TRANSMUTATIONS_BY_RESOURCE.wood);
  });

  it('each transmutation has required fields', () => {
    for (const type of RESOURCE_TYPES) {
      for (const tx of TRANSMUTATIONS_BY_RESOURCE[type]) {
        expect(tx.id).toBeTruthy();
        expect(tx.fromId).toBeTruthy();
        expect(tx.toId).toBeTruthy();
        expect(tx.fromLabel).toBeTruthy();
        expect(tx.toLabel).toBeTruthy();
        expect(tx.transmuteCost).toBeGreaterThan(0);
      }
    }
  });

  it('transmutation IDs are unique within each resource', () => {
    for (const type of RESOURCE_TYPES) {
      const ids = TRANSMUTATIONS_BY_RESOURCE[type].map(tx => tx.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('transmutation IDs are unique across all resources', () => {
    const allIds = RESOURCE_TYPES.flatMap(t => TRANSMUTATIONS_BY_RESOURCE[t].map(tx => tx.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

describe('transmutation costs', () => {
  it('all resources share the same costs for each path', () => {
    for (let i = 0; i < 28; i++) {
      const woodCost = TRANSMUTATIONS_BY_RESOURCE.wood[i].transmuteCost;
      for (const type of RESOURCE_TYPES) {
        expect(TRANSMUTATIONS_BY_RESOURCE[type][i].transmuteCost).toBe(woodCost);
      }
    }
  });
});

describe('transmutation item IDs', () => {
  it('wood transmutations use WOOD IDs', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.wood) {
      expect(tx.fromId).toMatch(/^T\d_WOOD/);
      expect(tx.toId).toMatch(/^T\d_WOOD/);
    }
  });

  it('stone transmutations use ROCK IDs', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.stone) {
      expect(tx.fromId).toMatch(/^T\d_ROCK/);
      expect(tx.toId).toMatch(/^T\d_ROCK/);
    }
  });

  it('ore transmutations use ORE IDs', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.ore) {
      expect(tx.fromId).toMatch(/^T\d_ORE/);
      expect(tx.toId).toMatch(/^T\d_ORE/);
    }
  });

  it('hide transmutations use HIDE IDs', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.hide) {
      expect(tx.fromId).toMatch(/^T\d_HIDE/);
      expect(tx.toId).toMatch(/^T\d_HIDE/);
    }
  });

  it('fiber transmutations use FIBER IDs', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.fiber) {
      expect(tx.fromId).toMatch(/^T\d_FIBER/);
      expect(tx.toId).toMatch(/^T\d_FIBER/);
    }
  });
});

describe('transmutation labels', () => {
  it('wood labels say Log', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.wood) {
      expect(tx.fromLabel).toContain('Log');
      expect(tx.toLabel).toContain('Log');
    }
  });

  it('stone labels say Stone', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.stone) {
      expect(tx.fromLabel).toContain('Stone');
      expect(tx.toLabel).toContain('Stone');
    }
  });

  it('ore labels say Ore', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.ore) {
      expect(tx.fromLabel).toContain('Ore');
      expect(tx.toLabel).toContain('Ore');
    }
  });

  it('hide labels say Hide', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.hide) {
      expect(tx.fromLabel).toContain('Hide');
      expect(tx.toLabel).toContain('Hide');
    }
  });

  it('fiber labels say Fiber', () => {
    for (const tx of TRANSMUTATIONS_BY_RESOURCE.fiber) {
      expect(tx.fromLabel).toContain('Fiber');
      expect(tx.toLabel).toContain('Fiber');
    }
  });
});
