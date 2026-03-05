import { SERVERS, type ServerKey, type City } from '../data/items';

export interface PriceEntry {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

// Prices keyed by itemId -> city -> PriceEntry
export type PriceMap = Record<string, Record<string, PriceEntry>>;

export async function fetchPrices(
  itemIds: string[],
  server: ServerKey,
  cities: City[]
): Promise<PriceMap> {
  const baseUrl = SERVERS[server].url;
  const itemParam = itemIds.join(',');
  const locationParam = cities.join(',');

  const url = `${baseUrl}/api/v2/stats/prices/${itemParam}.json?locations=${encodeURIComponent(locationParam)}&qualities=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data: PriceEntry[] = await response.json();

  const priceMap: PriceMap = {};
  for (const entry of data) {
    if (!priceMap[entry.item_id]) {
      priceMap[entry.item_id] = {};
    }
    priceMap[entry.item_id][entry.city] = entry;
  }

  return priceMap;
}

// Check if a price date is stale (older than maxAgeHours)
// API dates are UTC — ensure they're parsed as UTC even without a Z suffix
export function isStale(dateStr: string, maxAgeHours: number): boolean {
  if (!dateStr || maxAgeHours <= 0) return false;
  // Append Z if the string has no timezone indicator (Z or ±HH:MM offset)
  const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(dateStr);
  const utcStr = hasTimezone ? dateStr : dateStr + 'Z';
  const date = new Date(utcStr);
  if (isNaN(date.getTime())) return true;
  const ageMs = Date.now() - date.getTime();
  return ageMs > maxAgeHours * 60 * 60 * 1000;
}

export interface PriceResult {
  price: number;
  city: string;
  date: string;
}

// Get cheapest sell_price_min for an item across specific cities, filtering stale data
export function getCheapestPrice(
  priceMap: PriceMap,
  itemId: string,
  cities: Iterable<string>,
  maxAgeHours: number
): PriceResult | null {
  const cityPrices = priceMap[itemId];
  if (!cityPrices) return null;

  let best: PriceResult | null = null;

  for (const city of cities) {
    const entry = cityPrices[city];
    if (!entry || entry.sell_price_min === 0) continue;
    if (maxAgeHours > 0 && isStale(entry.sell_price_min_date, maxAgeHours)) continue;
    if (!best || entry.sell_price_min < best.price) {
      best = { price: entry.sell_price_min, city, date: entry.sell_price_min_date };
    }
  }

  return best;
}

// Get price for a specific item in a specific city, filtering stale data
export function getCityPrice(
  priceMap: PriceMap,
  itemId: string,
  city: string,
  maxAgeHours: number
): PriceResult | null {
  const entry = priceMap[itemId]?.[city];
  if (!entry || entry.sell_price_min === 0) return null;
  if (maxAgeHours > 0 && isStale(entry.sell_price_min_date, maxAgeHours)) return null;
  return { price: entry.sell_price_min, city, date: entry.sell_price_min_date };
}
