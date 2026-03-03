// Item ID mappings for Albion Online resources

export const SERVERS = {
  west: { label: 'Americas (West)', url: 'https://west.albion-online-data.com' },
  europe: { label: 'Europe', url: 'https://europe.albion-online-data.com' },
  east: { label: 'Asia (East)', url: 'https://east.albion-online-data.com' },
} as const;

export type ServerKey = keyof typeof SERVERS;

export const CITIES = [
  'Bridgewatch',
  'Caerleon',
  'Fort Sterling',
  'Lymhurst',
  'Martlock',
  'Thetford',
  'Brecilien',
] as const;

export type City = (typeof CITIES)[number];

// ─── Resource Type System ───

export type ResourceType = 'wood' | 'stone' | 'ore' | 'hide' | 'fiber';

export interface ResourceConfig {
  type: ResourceType;
  label: string;           // "Wood", "Stone", etc.
  rawIdBase: string;       // "WOOD", "ROCK", etc.
  refinedIdBase: string;   // "PLANKS", "STONEBLOCK", etc.
  rawLabel: string;        // "Log", "Rock", etc.
  refinedLabel: string;    // "Plank", "Block", etc.
  heartId: string;         // faction token item ID
  heartLabel: string;      // "Tree Heart", etc.
  t3RefinedId: string;     // T3 base item ID
  tierNames: Record<number, string>;
}

export const RESOURCES: Record<ResourceType, ResourceConfig> = {
  wood: {
    type: 'wood',
    label: 'Wood',
    rawIdBase: 'WOOD',
    refinedIdBase: 'PLANKS',
    rawLabel: 'Log',
    refinedLabel: 'Plank',
    heartId: 'T1_FACTION_FOREST_TOKEN_1',
    heartLabel: 'Tree Heart',
    t3RefinedId: 'T3_PLANKS',
    tierNames: { 3: 'Timber', 4: 'Pine', 5: 'Birch', 6: 'Yew', 7: 'Arcane', 8: 'Mystic' },
  },
  stone: {
    type: 'stone',
    label: 'Stone',
    rawIdBase: 'ROCK',
    refinedIdBase: 'STONEBLOCK',
    rawLabel: 'Stone',
    refinedLabel: 'Block',
    heartId: 'T1_FACTION_HIGHLAND_TOKEN_1',
    heartLabel: 'Rock Heart',
    t3RefinedId: 'T3_STONEBLOCK',
    tierNames: { 3: 'Limestone', 4: 'Sandstone', 5: 'Travertine', 6: 'Granite', 7: 'Slate', 8: 'Basalt' },
  },
  ore: {
    type: 'ore',
    label: 'Ore',
    rawIdBase: 'ORE',
    refinedIdBase: 'METALBAR',
    rawLabel: 'Ore',
    refinedLabel: 'Bar',
    heartId: 'T1_FACTION_MOUNTAIN_TOKEN_1',
    heartLabel: 'Ore Heart',
    t3RefinedId: 'T3_METALBAR',
    tierNames: { 3: 'Copper', 4: 'Tin', 5: 'Iron', 6: 'Titanium', 7: 'Runite', 8: 'Meteorite' },
  },
  hide: {
    type: 'hide',
    label: 'Hide',
    rawIdBase: 'HIDE',
    refinedIdBase: 'LEATHER',
    rawLabel: 'Hide',
    refinedLabel: 'Leather',
    heartId: 'T1_FACTION_STEPPE_TOKEN_1',
    heartLabel: 'Beastheart',
    t3RefinedId: 'T3_LEATHER',
    tierNames: { 3: 'Scraps', 4: 'Rugged', 5: 'Thin', 6: 'Medium', 7: 'Heavy', 8: 'Robust' },
  },
  fiber: {
    type: 'fiber',
    label: 'Fiber',
    rawIdBase: 'FIBER',
    refinedIdBase: 'CLOTH',
    rawLabel: 'Fiber',
    refinedLabel: 'Cloth',
    heartId: 'T1_FACTION_SWAMP_TOKEN_1',
    heartLabel: 'Fiber Heart',
    t3RefinedId: 'T3_CLOTH',
    tierNames: { 3: 'Cotton', 4: 'Flax', 5: 'Hemp', 6: 'Skyflower', 7: 'Redleaf', 8: 'Sunflax' },
  },
};

export const RESOURCE_TYPES: ResourceType[] = ['wood', 'stone', 'ore', 'hide', 'fiber'];

// ─── Generic ID Helpers ───

export function rawId(config: ResourceConfig, tier: number, enchant: number): string {
  if (enchant === 0) return `T${tier}_${config.rawIdBase}`;
  return `T${tier}_${config.rawIdBase}@${enchant}`;
}

export function refinedId(config: ResourceConfig, tier: number, enchant: number): string {
  if (enchant === 0) return `T${tier}_${config.refinedIdBase}`;
  return `T${tier}_${config.refinedIdBase}@${enchant}`;
}

// ─── Legacy Wood Helpers (backward compat) ───

export function woodId(tier: number, enchant: number): string {
  return rawId(RESOURCES.wood, tier, enchant);
}

export function plankId(tier: number, enchant: number): string {
  return refinedId(RESOURCES.wood, tier, enchant);
}

export const TREE_HEART_ID = 'T1_FACTION_FOREST_TOKEN_1';

// ─── Display Names ───

export function displayName(tier: number, enchant: number, type: 'wood' | 'plank'): string {
  const name = RESOURCES.wood.tierNames[tier] || `T${tier}`;
  const enchStr = enchant > 0 ? `.${enchant}` : '';
  return `${tier}${enchStr} ${name} ${type === 'wood' ? 'Log' : 'Plank'}`;
}

// ─── Collect All Item IDs for API ───

export function getAllItemIds(): string[] {
  const ids: string[] = [];

  for (const config of Object.values(RESOURCES)) {
    // T3 refined base (catalyst for T4 recipes)
    ids.push(config.t3RefinedId);

    // Raw + refined for T4-T8, enchant 0-4
    for (let tier = 4; tier <= 8; tier++) {
      for (let enchant = 0; enchant <= 4; enchant++) {
        ids.push(rawId(config, tier, enchant));
        ids.push(refinedId(config, tier, enchant));
      }
    }

    // Heart token
    ids.push(config.heartId);
  }

  return [...new Set(ids)];
}
