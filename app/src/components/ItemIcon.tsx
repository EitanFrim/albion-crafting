import { useState } from 'react';
import { getAllItemIds } from '../data/items';

interface ItemIconProps {
  itemId: string;
  size?: number;
  className?: string;
}

// Convert price API item IDs to render API format
// Price API: T8_WOOD@1  →  Render API: T8_WOOD_LEVEL1@1
function toRenderId(itemId: string): string {
  const atIndex = itemId.indexOf('@');
  if (atIndex === -1) return itemId;
  const base = itemId.substring(0, atIndex);
  const enchant = itemId.substring(atIndex + 1);
  return `${base}_LEVEL${enchant}@${enchant}`;
}

export function getIconUrl(itemId: string, size = 64): string {
  return `https://render.albiononline.com/v1/item/${toRenderId(itemId)}?size=${size}`;
}

// ─── Preload all icons into browser cache ───

let preloaded = false;

export function preloadAllIcons(size = 32) {
  if (preloaded) return;
  preloaded = true;

  const ids = getAllItemIds();
  const BATCH = 20;
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    setTimeout(() => {
      for (const id of batch) {
        const img = new Image();
        img.src = getIconUrl(id, size);
      }
    }, (i / BATCH) * 200);
  }
}

export default function ItemIcon({ itemId, size = 32, className = '' }: ItemIconProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-sm text-[8px] ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: 'var(--color-surface-3)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={getIconUrl(itemId, size)}
      alt={itemId}
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block rounded-sm ${className}`}
      style={{ border: '1px solid var(--color-border-subtle)' }}
      onError={() => setHasError(true)}
    />
  );
}
