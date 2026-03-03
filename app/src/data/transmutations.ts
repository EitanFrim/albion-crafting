import { rawId, type ResourceConfig, type ResourceType, RESOURCES } from './items';

export interface Transmutation {
  id: string;
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  transmuteCost: number; // gold cost of the transmutation itself
}

// All 28 transmutation path definitions with costs (same for all resource types)
// Format: [fromTier, fromEnchant, toTier, toEnchant, cost]
const TRANSMUTATION_PATHS: [number, number, number, number, number][] = [
  // Tier 4
  [4, 3, 4, 4, 27744],
  // Tier 5
  [4, 3, 5, 3, 7225],
  [5, 2, 5, 3, 9687],
  [4, 4, 5, 4, 28900],
  [5, 3, 5, 4, 36992],
  // Tier 6
  [5, 2, 6, 2, 5780],
  [6, 1, 6, 2, 6936],
  [5, 3, 6, 3, 19074],
  [6, 2, 6, 3, 22889],
  [5, 4, 6, 4, 76296],
  [6, 3, 6, 4, 91555],
  // Tier 7
  [6, 1, 7, 1, 5780],
  [7, 0, 7, 1, 5549],
  [6, 2, 7, 2, 18207],
  [7, 1, 7, 2, 17479],
  [6, 3, 7, 3, 60083],
  [7, 2, 7, 3, 57680],
  [6, 4, 7, 4, 240332],
  [7, 3, 7, 4, 230719],
  // Tier 8
  [7, 0, 8, 0, 5780],
  [7, 1, 8, 1, 17340],
  [8, 0, 8, 1, 16646],
  [7, 2, 8, 2, 54621],
  [8, 1, 8, 2, 52436],
  [7, 3, 8, 3, 180249],
  [8, 2, 8, 3, 173039],
  [7, 4, 8, 4, 901246],
  [8, 3, 8, 4, 865197],
];

function makeLabel(tier: number, enchant: number, config: ResourceConfig): string {
  return `${tier}.${enchant} ${config.rawLabel}`;
}

export function buildAllTransmutations(config: ResourceConfig): Transmutation[] {
  return TRANSMUTATION_PATHS.map(([fromTier, fromEnchant, toTier, toEnchant, cost]) => ({
    id: `tx-${config.type}-${fromTier}.${fromEnchant}-${toTier}.${toEnchant}`,
    fromId: rawId(config, fromTier, fromEnchant),
    toId: rawId(config, toTier, toEnchant),
    fromLabel: makeLabel(fromTier, fromEnchant, config),
    toLabel: makeLabel(toTier, toEnchant, config),
    transmuteCost: cost,
  }));
}

// Pre-built transmutation sets for each resource type
export const TRANSMUTATIONS_BY_RESOURCE: Record<ResourceType, Transmutation[]> = {
  wood: buildAllTransmutations(RESOURCES.wood),
  stone: buildAllTransmutations(RESOURCES.stone),
  ore: buildAllTransmutations(RESOURCES.ore),
  hide: buildAllTransmutations(RESOURCES.hide),
  fiber: buildAllTransmutations(RESOURCES.fiber),
};

// Backward compat
export const ALL_TRANSMUTATIONS = TRANSMUTATIONS_BY_RESOURCE.wood;
