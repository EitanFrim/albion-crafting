import { useState, useMemo, useRef, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { type Recipe } from '../data/recipes';
import { type Transmutation } from '../data/transmutations';
import { calculateRefineWithTransmute, formatSilver, type Settings, type RefineResultWithTransmute, type TransmuteAltResult } from '../utils/calculations';
import PriceCell from './PriceCell';
import ItemIcon from './ItemIcon';

type SortKey = 'tier' | 'profitNoFocus' | 'profitWithFocus' | 'focusEfficiency';

interface RefiningTableProps {
  recipes: Recipe[];
  transmutations: Transmutation[];
  getBuyPrice: (itemId: string) => number;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  getSellPrice: (itemId: string) => number;
  getSellPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  settings: Settings;
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
}

const TIERS = [4, 5, 6, 7, 8] as const;
const ENCHANTS = [0, 1, 2, 3, 4] as const;

const profitColor = (val: number) =>
  val > 0 ? 'var(--color-profit)' : val < 0 ? 'var(--color-loss)' : 'var(--color-text-muted)';

export default function RefiningTable({
  recipes,
  transmutations,
  getBuyPrice,
  getBuyPriceInfo,
  getSellPrice,
  getSellPriceInfo,
  settings,
  onOverride,
  onClearOverride,
}: RefiningTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tier');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterTiers, setFilterTiers] = useState<Set<number>>(new Set(TIERS));
  const [filterEnchants, setFilterEnchants] = useState<Set<number>>(new Set(ENCHANTS));

  const results = useMemo(() => {
    return recipes.map((recipe) => calculateRefineWithTransmute(recipe, getBuyPrice, getSellPrice, settings, transmutations));
  }, [recipes, getBuyPrice, getSellPrice, settings, transmutations]);

  const filtered = useMemo(() => {
    return results.filter(
      (r) => filterTiers.has(r.recipe.tier) && filterEnchants.has(r.recipe.enchant)
    );
  }, [results, filterTiers, filterEnchants]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'tier':
          va = a.recipe.tier * 10 + a.recipe.enchant;
          vb = b.recipe.tier * 10 + b.recipe.enchant;
          break;
        case 'profitNoFocus':
          va = a.profitNoFocus;
          vb = b.profitNoFocus;
          break;
        case 'profitWithFocus':
          va = a.profitWithFocus;
          vb = b.profitWithFocus;
          break;
        case 'focusEfficiency':
          va = a.focusEfficiency;
          vb = b.focusEfficiency;
          break;
      }
      return sortAsc ? va - vb : vb - va;
    });
    return arr;
  }, [filtered, sortKey, sortAsc]);

  const bestProfit = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.max(...filtered.map((r) => r.profitWithFocus));
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIcon = (key: SortKey): ReactNode => {
    if (sortKey !== key) return null;
    return (
      <span className="ml-1" style={{ color: 'var(--color-accent)' }}>
        {sortAsc ? '↑' : '↓'}
      </span>
    );
  };

  const toggleFilter = (set: Set<number>, value: number, setter: (s: Set<number>) => void) => {
    const next = new Set(set);
    if (next.has(value)) {
      if (next.size > 1) next.delete(value);
    } else {
      next.add(value);
    }
    setter(next);
  };

  const thClass = "px-4 py-3 text-xs font-medium uppercase tracking-wider select-none";
  const thSortable = thClass + " cursor-pointer transition-colors";

  return (
    <div className="border rounded-xl overflow-hidden shadow-lg" style={{
      backgroundColor: 'var(--color-surface-2)',
      borderColor: 'var(--color-border)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
    }}>
      {/* Filter header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Refining Profits
          </h2>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {sorted.length} recipes
          </span>
        </div>

        <div className="flex flex-wrap gap-6">
          {/* Tier filter */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Tier
            </span>
            <div className="inline-flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--color-surface-0)' }}>
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleFilter(filterTiers, t, setFilterTiers)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterTiers.has(t) ? 'ring-1' : 'hover:opacity-80'
                  }`}
                  style={filterTiers.has(t) ? {
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    color: 'var(--color-accent)',
                    boxShadow: 'inset 0 0 0 1px rgba(245, 158, 11, 0.25)',
                  } : {
                    color: 'var(--color-text-muted)',
                  }}
                >
                  T{t}
                </button>
              ))}
            </div>
          </div>

          {/* Enchant filter */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Enchant
            </span>
            <div className="inline-flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--color-surface-0)' }}>
              {ENCHANTS.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleFilter(filterEnchants, e, setFilterEnchants)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterEnchants.has(e) ? 'ring-1' : 'hover:opacity-80'
                  }`}
                  style={filterEnchants.has(e) ? {
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    color: 'var(--color-accent)',
                    boxShadow: 'inset 0 0 0 1px rgba(245, 158, 11, 0.25)',
                  } : {
                    color: 'var(--color-text-muted)',
                  }}
                >
                  .{e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
              <th className={thSortable + " text-left"} onClick={() => toggleSort('tier')}>
                Product{sortIcon('tier')}
              </th>
              <th className={thClass + " text-right"}>Material Cost</th>
              <th className={thClass + " text-right"}>Nutrition</th>
              <th className={thClass + " text-right"}>Product Price</th>
              <th className={thClass + " text-right"}>Sell Price (-{settings.sellMarkdown}%)</th>
              <th className={thSortable + " text-right"} onClick={() => toggleSort('profitNoFocus')}>
                Profit (No Focus){sortIcon('profitNoFocus')}
              </th>
              <th className={thSortable + " text-right"} onClick={() => toggleSort('profitWithFocus')}>
                Profit (Focus){sortIcon('profitWithFocus')}
              </th>
              <th className={thSortable + " text-right"} onClick={() => toggleSort('focusEfficiency')}>
                Focus Eff.{sortIcon('focusEfficiency')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  No recipes match the selected filters.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <RefiningRow
                  key={r.recipe.id}
                  result={r}
                  isBest={r.profitWithFocus === bestProfit && bestProfit > 0}
                  getBuyPriceInfo={getBuyPriceInfo}
                  getSellPriceInfo={getSellPriceInfo}
                  onOverride={onOverride}
                  onClearOverride={onClearOverride}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Ingredient Tooltip ─── */

function MaterialCostTooltip({
  result,
  getBuyPriceInfo,
  onOverride,
  onClearOverride,
}: {
  result: RefineResultWithTransmute;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Position the popover relative to the trigger
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Default: below trigger, right-aligned
    let top = rect.bottom + 6;
    let left = rect.right;

    // If popover would overflow bottom of viewport, show above instead
    const popoverHeight = popoverRef.current?.offsetHeight ?? 300;
    if (top + popoverHeight > window.innerHeight && rect.top - popoverHeight - 6 > 0) {
      top = rect.top - popoverHeight - 6;
    }

    setPos({ top, left });
  }, [open]);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  const { recipe } = result;

  // Check if any ingredient is missing price data
  const hasMissingInput = recipe.inputs.some(
    (inp) => getBuyPriceInfo(inp.itemId).price === 0
  );

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Trigger: material cost value */}
      <span className="inline-flex flex-col items-end">
        <span
          className="tabular-nums cursor-default flex items-center gap-1 transition-colors"
          style={{ color: result.transmuteAlt ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = result.transmuteAlt ? 'var(--color-accent)' : 'var(--color-text-secondary)';
          }}
        >
          {result.transmuteAlt && (
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          )}
          {formatSilver(Math.round(result.materialCost))}
          <svg
            className="w-3.5 h-3.5 flex-shrink-0 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        </span>
        {hasMissingInput && (
          <span className="text-[10px] italic" style={{ color: 'var(--color-loss)' }}>
            Incomplete
          </span>
        )}
      </span>

      {/* Portal popover — renders outside overflow:hidden ancestors */}
      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 border rounded-lg shadow-xl p-3 min-w-[280px]"
          style={{
            top: pos?.top ?? 0,
            left: (pos?.left ?? 0),
            transform: 'translateX(-100%)',
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.3)',
            visibility: pos ? 'visible' : 'hidden',
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Material Breakdown
          </div>

          <div className="flex flex-col gap-2">
            {recipe.inputs.map((inp, i) => {
              const info = getBuyPriceInfo(inp.itemId);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5"
                  style={{ backgroundColor: 'var(--color-surface-2)' }}
                >
                  <ItemIcon itemId={inp.itemId} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {inp.label}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {info.city !== 'N/A' ? info.city : 'No data'}
                    </div>
                  </div>
                  <div className="text-[10px] whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {inp.quantity}x
                  </div>
                  <div className="text-right">
                    <PriceCell
                      itemId={inp.itemId}
                      price={info.price}
                      city={info.city}
                      isOverride={info.isOverride}
                      onOverride={onOverride}
                      onClearOverride={onClearOverride}
                      hideCity
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total line */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Total
            </span>
            <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {formatSilver(Math.round(result.materialCost))}
            </span>
          </div>

          {/* Transmute alternative section */}
          {result.transmuteAlt && (
            <TransmuteAltSection
              transmuteAlt={result.transmuteAlt}
              getBuyPriceInfo={getBuyPriceInfo}
            />
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─── Transmute Alternative Section (inside tooltip) ─── */

function TransmuteAltSection({
  transmuteAlt,
  getBuyPriceInfo,
}: {
  transmuteAlt: TransmuteAltResult;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
}) {
  const { alternative, quantity, totalSavings, adjustedMaterialCost } = transmuteAlt;
  const tx = alternative.transmutation;
  const sourceInfo = getBuyPriceInfo(tx.fromId);

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
          Cheaper via Transmute
        </span>
      </div>

      {/* From → To row */}
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 mb-1.5"
        style={{ backgroundColor: 'rgba(245, 158, 11, 0.06)' }}
      >
        <ItemIcon itemId={tx.fromId} size={20} />
        <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
          {tx.fromLabel}
        </span>
        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <ItemIcon itemId={tx.toId} size={20} />
        <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
          {tx.toLabel}
        </span>
      </div>

      {/* Cost breakdown */}
      <div className="flex flex-col gap-1 text-[11px] px-1">
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Source price</span>
          <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
            {formatSilver(alternative.sourceBuyPrice)}
            {sourceInfo.city !== 'N/A' && (
              <span className="ml-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>({sourceInfo.city})</span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Transmute cost</span>
          <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{formatSilver(tx.transmuteCost)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Cost per unit</span>
          <span className="tabular-nums font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatSilver(alternative.costPerUnit)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Direct buy price</span>
          <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{formatSilver(alternative.directBuyPrice)}</span>
        </div>
      </div>

      {/* Savings summary */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Save ({quantity}x)
        </span>
        <span className="text-xs tabular-nums font-semibold" style={{ color: 'var(--color-profit)' }}>
          -{formatSilver(Math.round(totalSavings))}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Adjusted Total
        </span>
        <span className="text-xs tabular-nums font-semibold" style={{ color: 'var(--color-accent)' }}>
          {formatSilver(Math.round(adjustedMaterialCost))}
        </span>
      </div>
    </div>
  );
}

/* ─── Table Row ─── */

function RefiningRow({
  result,
  isBest,
  getBuyPriceInfo,
  getSellPriceInfo,
  onOverride,
  onClearOverride,
}: {
  result: RefineResultWithTransmute;
  isBest: boolean;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  getSellPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
}) {
  const { recipe } = result;
  const productInfo = getSellPriceInfo(recipe.productId);

  return (
    <tr
      className="border-b transition-colors"
      style={{
        borderColor: 'var(--color-border-subtle)',
        backgroundColor: isBest ? 'rgba(245, 158, 11, 0.05)' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isBest) e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isBest ? 'rgba(245, 158, 11, 0.05)' : '';
      }}
    >
      {/* Product name */}
      <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
        <div className="flex items-center gap-2">
          <ItemIcon itemId={recipe.productId} size={36} />
          <span>
            {recipe.productLabel}
            {isBest && (
              <span
                className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: 'var(--color-accent)',
                }}
              >
                Best
              </span>
            )}
          </span>
        </div>
      </td>

      {/* Material cost with hover tooltip */}
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end">
          <MaterialCostTooltip
            result={result}
            getBuyPriceInfo={getBuyPriceInfo}
            onOverride={onOverride}
            onClearOverride={onClearOverride}
          />
        </div>
      </td>

      {/* Nutrition */}
      <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        {formatSilver(result.nutritionCost)}
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{recipe.nutrition} nutr.</div>
      </td>

      {/* Product price */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="inline-flex flex-col items-end">
            <PriceCell
              itemId={recipe.productId}
              price={productInfo.price}
              city={productInfo.city}
              isOverride={productInfo.isOverride}
              onOverride={onOverride}
              onClearOverride={onClearOverride}
              hideCity
            />
            {productInfo.price === 0 && !productInfo.isOverride && (
              <span className="text-[10px] italic" style={{ color: 'var(--color-loss)' }}>
                Click to set
              </span>
            )}
          </div>
          <span className="text-[10px] whitespace-nowrap min-w-[60px] text-left" style={{ color: 'var(--color-text-muted)' }}>
            {productInfo.city !== 'N/A' ? productInfo.city : ''}
          </span>
        </div>
      </td>

      {/* Estimated sell price */}
      <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        {formatSilver(Math.round(result.estimatedSellPrice))}
      </td>

      {/* Profit no focus */}
      <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: profitColor(result.profitNoFocus) }}>
        {formatSilver(Math.round(result.profitNoFocus))}
        {result.transmuteAlt && (
          <div className="flex items-center justify-end gap-0.5 mt-0.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span className="text-[10px] font-medium" style={{ color: profitColor(result.transmuteAlt.adjustedProfitNoFocus) }}>
              {formatSilver(Math.round(result.transmuteAlt.adjustedProfitNoFocus))}
            </span>
          </div>
        )}
      </td>

      {/* Profit with focus */}
      <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: profitColor(result.profitWithFocus) }}>
        {formatSilver(Math.round(result.profitWithFocus))}
        {result.transmuteAlt && (
          <div className="flex items-center justify-end gap-0.5 mt-0.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span className="text-[10px] font-medium" style={{ color: profitColor(result.transmuteAlt.adjustedProfitWithFocus) }}>
              {formatSilver(Math.round(result.transmuteAlt.adjustedProfitWithFocus))}
            </span>
          </div>
        )}
      </td>

      {/* Focus efficiency */}
      <td className="px-4 py-3 text-right tabular-nums" style={{ color: profitColor(result.focusEfficiency) }}>
        {result.focusEfficiency}
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{recipe.focusCost} focus</div>
      </td>
    </tr>
  );
}
