import { useMemo, useState, type ReactNode } from 'react';
import { type Transmutation } from '../data/transmutations';
import { calculateTransmutation, formatSilver, type TransmuteResult } from '../utils/calculations';
import PriceCell from './PriceCell';
import ItemIcon from './ItemIcon';

type SortKey = 'path' | 'profitLoss';

interface TransmutationTableProps {
  transmutations: Transmutation[];
  getBuyPrice: (itemId: string) => number;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  getSellPrice: (itemId: string) => number;
  getSellPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
}

const profitColor = (val: number) =>
  val < 0 ? 'var(--color-profit)' : val > 0 ? 'var(--color-loss)' : 'var(--color-text-muted)';

export default function TransmutationTable({
  transmutations,
  getBuyPrice,
  getBuyPriceInfo,
  getSellPrice,
  getSellPriceInfo,
  onOverride,
  onClearOverride,
}: TransmutationTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('profitLoss');
  const [sortAsc, setSortAsc] = useState(true);

  const results = useMemo(() => {
    return transmutations.map((tx) => calculateTransmutation(tx, getBuyPrice, getSellPrice));
  }, [transmutations, getBuyPrice, getSellPrice]);

  const sorted = useMemo(() => {
    const arr = [...results];
    arr.sort((a, b) => {
      if (sortKey === 'path') {
        const cmp = a.transmutation.id.localeCompare(b.transmutation.id);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? a.profitLoss - b.profitLoss : b.profitLoss - a.profitLoss;
    });
    return arr;
  }, [results, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'profitLoss');
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

  const thClass = "px-4 py-3 text-xs font-medium uppercase tracking-wider select-none";
  const thSortable = thClass + " cursor-pointer transition-colors";

  return (
    <div className="border rounded-xl overflow-hidden shadow-lg" style={{
      backgroundColor: 'var(--color-surface-2)',
      borderColor: 'var(--color-border)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
    }}>
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Transmutation Paths
          </h2>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {sorted.length} paths &middot; negative = cheaper than buying
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
              <th className={thSortable + " text-left"} onClick={() => toggleSort('path')}>
                From / To{sortIcon('path')}
              </th>
              <th className={thClass + " text-right"}>Transmute Cost</th>
              <th className={thClass + " text-right"}>Source Price</th>
              <th className={thClass + " text-right"}>Total Cost</th>
              <th className={thClass + " text-right"}>Product Price</th>
              <th className={thSortable + " text-right"} onClick={() => toggleSort('profitLoss')}>
                Difference{sortIcon('profitLoss')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  No transmutation paths available.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <TransmuteRow
                  key={r.transmutation.id}
                  result={r}
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

function TransmuteRow({
  result,
  getBuyPriceInfo,
  getSellPriceInfo,
  onOverride,
  onClearOverride,
}: {
  result: TransmuteResult;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  getSellPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
}) {
  const { transmutation: tx } = result;
  const fromInfo = getBuyPriceInfo(tx.fromId);
  const toInfo = getSellPriceInfo(tx.toId);

  return (
    <tr
      className="border-b transition-colors"
      style={{ borderColor: 'var(--color-border-subtle)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
    >
      {/* From → To */}
      <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
        <div className="flex items-center gap-2">
          <ItemIcon itemId={tx.fromId} size={28} />
          <span>{tx.fromLabel}</span>
          <svg
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <ItemIcon itemId={tx.toId} size={28} />
          <span>{tx.toLabel}</span>
        </div>
      </td>

      {/* Transmute cost */}
      <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        {formatSilver(tx.transmuteCost)}
      </td>

      {/* Source price */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <PriceCell
            itemId={tx.fromId}
            price={fromInfo.price}
            city={fromInfo.city}
            isOverride={fromInfo.isOverride}
            onOverride={onOverride}
            onClearOverride={onClearOverride}
            hideCity
          />
          <span className="text-[10px] whitespace-nowrap min-w-[60px] text-left" style={{ color: 'var(--color-text-muted)' }}>
            {fromInfo.city !== 'N/A' ? fromInfo.city : ''}
          </span>
        </div>
      </td>

      {/* Total cost */}
      <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        {formatSilver(result.totalCost)}
      </td>

      {/* Product price */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <PriceCell
            itemId={tx.toId}
            price={toInfo.price}
            city={toInfo.city}
            isOverride={toInfo.isOverride}
            onOverride={onOverride}
            onClearOverride={onClearOverride}
            hideCity
          />
          <span className="text-[10px] whitespace-nowrap min-w-[60px] text-left" style={{ color: 'var(--color-text-muted)' }}>
            {toInfo.city !== 'N/A' ? toInfo.city : ''}
          </span>
        </div>
      </td>

      {/* Difference */}
      <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: profitColor(result.profitLoss) }}>
        {formatSilver(result.profitLoss)}
      </td>
    </tr>
  );
}
