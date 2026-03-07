import { SERVERS, CITIES, type ServerKey, type City } from '../data/items';

interface HeaderProps {
  server: ServerKey;
  setServer: (s: ServerKey) => void;
  buyCities: Set<City>;
  toggleBuyCity: (c: City) => void;
  sellCities: Set<City>;
  toggleSellCity: (c: City) => void;
  maxAgeHours: number;
  setMaxAgeHours: (h: number) => void;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  onRefresh: () => void;
  overrideCount: number;
  onClearOverrides: () => void;
}

const inputClass = "border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2";

export default function Header({
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
  onRefresh,
  overrideCount,
  onClearOverrides,
}: HeaderProps) {
  return (
    <header className="border-b px-8 py-5" style={{
      backgroundColor: 'var(--color-surface-2)',
      borderColor: 'var(--color-border)',
    }}>
      <div className="max-w-[1600px] mx-auto">
        {/* Top row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Albion Refiner
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Wood refining profit calculator
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Server */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Server
              </label>
              <select
                value={server}
                onChange={(e) => setServer(e.target.value as ServerKey)}
                className={inputClass + " cursor-pointer appearance-none pr-8"}
                style={{
                  backgroundColor: 'var(--color-surface-3)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {Object.entries(SERVERS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Max age */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Max Age
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={maxAgeHours}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= 0) setMaxAgeHours(v);
                }}
                className={inputClass + " w-16 text-right"}
                style={{
                  backgroundColor: 'var(--color-surface-3)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>hrs</span>
            </div>

            {/* Divider */}
            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-1.5 rounded-md text-sm font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: '#18181b',
              }}
            >
              {loading ? 'Loading...' : 'Refresh Prices'}
            </button>

            {overrideCount > 0 && (
              <button
                onClick={onClearOverrides}
                className="border px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-override) 40%, transparent)',
                  color: 'var(--color-override)',
                }}
              >
                {overrideCount} Override{overrideCount > 1 ? 's' : ''} - Clear
              </button>
            )}
          </div>
        </div>

        {/* Second row: buy/sell cities */}
        <div className="mt-4 flex flex-wrap items-center gap-6">
          {/* Buy cities */}
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
              Buy From
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => toggleBuyCity(city)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    buyCities.has(city)
                      ? 'ring-1 ring-emerald-500/30'
                      : 'hover:opacity-80'
                  }`}
                  style={buyCities.has(city) ? {
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#34d399',
                  } : {
                    backgroundColor: 'var(--color-surface-3)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {city.replace('Fort Sterling', 'Ft. Sterling')}
                </button>
              ))}
            </div>
          </div>

          {/* Sell cities */}
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
              Sell In
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => toggleSellCity(city)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    sellCities.has(city)
                      ? 'ring-1 ring-emerald-500/30'
                      : 'hover:opacity-80'
                  }`}
                  style={sellCities.has(city) ? {
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#34d399',
                  } : {
                    backgroundColor: 'var(--color-surface-3)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {city.replace('Fort Sterling', 'Ft. Sterling')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status line */}
        <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {lastFetched && (
            <span>Last updated: {lastFetched.toLocaleTimeString()}</span>
          )}
          {error && <span style={{ color: 'var(--color-loss)' }}>Error: {error}</span>}
        </div>
      </div>
    </header>
  );
}
