import { useState, useRef, useEffect } from 'react';
import { formatSilver } from '../utils/calculations';

interface PriceCellProps {
  itemId: string;
  price: number;
  city: string;
  isOverride: boolean;
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
  hideCity?: boolean;
}

export default function PriceCell({
  itemId,
  price,
  city,
  isOverride,
  onOverride,
  onClearOverride,
  hideCity = false,
}: PriceCellProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setInputValue(price > 0 ? String(price) : '');
    setEditing(true);
  };

  const commit = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val > 0) {
      onOverride(itemId, val);
    }
    setEditing(false);
  };

  const cancel = () => {
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') cancel();
        }}
        className="border rounded-md px-2 py-1 text-sm w-20 text-right focus:outline-none focus:ring-2 shadow-sm"
        style={{
          backgroundColor: 'var(--color-surface-3)',
          borderColor: 'var(--color-accent)',
          color: 'var(--color-text-primary)',
          boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.1)',
        }}
      />
    );
  }

  return (
    <span className="inline-flex flex-col items-end">
      <span className="inline-flex items-center gap-1">
        <span
          onClick={startEdit}
          className="cursor-pointer text-right tabular-nums transition-colors"
          style={{
            color: isOverride
              ? 'var(--color-override)'
              : price === 0
                ? 'var(--color-text-muted)'
                : 'var(--color-text-secondary)',
            fontWeight: isOverride ? 500 : undefined,
            fontStyle: price === 0 ? 'italic' : undefined,
          }}
          title={isOverride ? 'Manual override. Click to edit.' : `${city}. Click to override.`}
        >
          {price === 0 ? 'N/A' : formatSilver(price)}
        </span>
        {isOverride && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearOverride(itemId);
            }}
            className="text-xs leading-none rounded-sm p-0.5 transition-colors"
            style={{ color: 'color-mix(in srgb, var(--color-override) 60%, transparent)' }}
            title="Revert to market data"
          >
            ✕
          </button>
        )}
      </span>
      {!hideCity && city && city !== 'N/A' && (
        <span className="text-[10px] font-normal not-italic leading-tight" style={{ color: 'var(--color-text-muted)' }}>
          {city}
        </span>
      )}
    </span>
  );
}
