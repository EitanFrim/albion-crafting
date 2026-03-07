import { useState, useCallback, useEffect } from 'react';
import { fetchPrices, getCheapestPrice, getCityPrice, type PriceMap } from '../api/albionData';
import { getAllItemIds, type ServerKey, type City, CITIES } from '../data/items';

const OVERRIDES_KEY = 'albion-refiner-price-overrides';
const PRICE_CONFIG_KEY = 'albion-refiner-price-config';

function loadOverrides(): Record<string, number> {
  try {
    const stored = localStorage.getItem(OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, number>) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

interface PriceConfig {
  buyCities: string[];
  sellCities: string[];
  maxAgeHours: number;
}

const DEFAULT_CONFIG: PriceConfig = {
  buyCities: CITIES.filter(c => c !== 'Caerleon' && c !== 'Brecilien'),
  sellCities: [...CITIES],
  maxAgeHours: 2,
};

function loadConfig(): PriceConfig {
  try {
    const stored = localStorage.getItem(PRICE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG;
}

function saveConfig(config: PriceConfig) {
  localStorage.setItem(PRICE_CONFIG_KEY, JSON.stringify(config));
}

export interface PriceInfo {
  price: number;
  city: string;
  date: string;
  isOverride: boolean;
}

export function usePrices() {
  const [priceMap, setPriceMap] = useState<PriceMap>({});
  const [overrides, setOverrides] = useState<Record<string, number>>(loadOverrides);
  const [server, setServer] = useState<ServerKey>('europe');
  const [buyCities, setBuyCities] = useState<Set<City>>(() => new Set(loadConfig().buyCities as City[]));
  const [sellCities, setSellCities] = useState<Set<City>>(() => new Set(loadConfig().sellCities as City[]));
  const [maxAgeHours, setMaxAgeHours] = useState(loadConfig().maxAgeHours);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Persist config changes
  useEffect(() => {
    saveConfig({ buyCities: [...buyCities], sellCities: [...sellCities], maxAgeHours });
  }, [buyCities, sellCities, maxAgeHours]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const itemIds = getAllItemIds();
      const cities = [...CITIES] as City[];
      const data = await fetchPrices(itemIds, server, cities);
      setPriceMap(data);
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, [server]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Buy price: cheapest across selected buy cities
  const getBuyPrice = useCallback(
    (itemId: string): number => {
      if (overrides[itemId] !== undefined) return overrides[itemId];
      const result = getCheapestPrice(priceMap, itemId, buyCities, maxAgeHours);
      return result?.price ?? 0;
    },
    [priceMap, overrides, buyCities, maxAgeHours]
  );

  const getBuyPriceInfo = useCallback(
    (itemId: string): PriceInfo => {
      if (overrides[itemId] !== undefined) {
        return { price: overrides[itemId], city: 'Manual', date: '', isOverride: true };
      }
      const result = getCheapestPrice(priceMap, itemId, buyCities, maxAgeHours);
      if (result) return { ...result, isOverride: false };
      return { price: 0, city: 'N/A', date: '', isOverride: false };
    },
    [priceMap, overrides, buyCities, maxAgeHours]
  );

  // Sell price: cheapest across selected sell cities
  const getSellPrice = useCallback(
    (itemId: string): number => {
      if (overrides[itemId] !== undefined) return overrides[itemId];
      const result = getCheapestPrice(priceMap, itemId, sellCities, maxAgeHours);
      return result?.price ?? 0;
    },
    [priceMap, overrides, sellCities, maxAgeHours]
  );

  const getSellPriceInfo = useCallback(
    (itemId: string): PriceInfo => {
      if (overrides[itemId] !== undefined) {
        return { price: overrides[itemId], city: 'Manual', date: '', isOverride: true };
      }
      const result = getCheapestPrice(priceMap, itemId, sellCities, maxAgeHours);
      if (result) return { ...result, isOverride: false };
      return { price: 0, city: 'N/A', date: '', isOverride: false };
    },
    [priceMap, overrides, sellCities, maxAgeHours]
  );

  const toggleBuyCity = useCallback((city: City) => {
    setBuyCities((prev) => {
      const next = new Set(prev);
      if (next.has(city)) {
        if (next.size > 1) next.delete(city);
      } else {
        next.add(city);
      }
      return next;
    });
  }, []);

  const toggleSellCity = useCallback((city: City) => {
    setSellCities((prev) => {
      const next = new Set(prev);
      if (next.has(city)) {
        if (next.size > 1) next.delete(city);
      } else {
        next.add(city);
      }
      return next;
    });
  }, []);

  const setOverride = useCallback((itemId: string, price: number) => {
    setOverrides((prev) => {
      const next = { ...prev, [itemId]: price };
      saveOverrides(next);
      return next;
    });
  }, []);

  const clearOverride = useCallback((itemId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[itemId];
      saveOverrides(next);
      return next;
    });
  }, []);

  const clearAllOverrides = useCallback(() => {
    setOverrides({});
    saveOverrides({});
  }, []);

  return {
    priceMap,
    getBuyPrice,
    getBuyPriceInfo,
    getSellPrice,
    getSellPriceInfo,
    setOverride,
    clearOverride,
    clearAllOverrides,
    server,
    setServer,
    buyCities,
    toggleBuyCity,
    sellCities,
    toggleSellCity,
    maxAgeHours,
    setMaxAgeHours,
    loading,
    error,
    lastFetched,
    refresh,
    overrides,
  };
}
