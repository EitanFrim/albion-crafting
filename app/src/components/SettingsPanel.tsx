import { useState } from 'react';
import type { Settings } from '../utils/calculations';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (s: Settings) => void;
}

const inputClass = "border rounded-md px-3 py-1.5 text-sm w-full text-right focus:outline-none focus:ring-2";

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const update = (key: keyof Settings, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onChange({ ...settings, [key]: num });
    }
  };

  return (
    <div className="border rounded-xl overflow-hidden" style={{
      backgroundColor: 'var(--color-surface-2)',
      borderColor: 'var(--color-border)',
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left transition-colors hover:opacity-90"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            style={{ color: 'var(--color-text-muted)' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
        </div>
        {!isOpen && (
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Return {settings.returnRateNoFocus}% / {settings.returnRateWithFocus}%
            &nbsp;&middot;&nbsp; Nutrition {settings.nutritionPricePer100}
            &nbsp;&middot;&nbsp; Markdown {settings.sellMarkdown}%
          </span>
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-4">
            <SettingField
              label="Return Rate (No Focus)"
              value={settings.returnRateNoFocus}
              step="0.1"
              unit="%"
              onChange={(v) => update('returnRateNoFocus', v)}
            />
            <SettingField
              label="Return Rate (Focus)"
              value={settings.returnRateWithFocus}
              step="0.1"
              unit="%"
              onChange={(v) => update('returnRateWithFocus', v)}
            />
            <SettingField
              label="Nutrition Cost / 100"
              value={settings.nutritionPricePer100}
              step="1"
              onChange={(v) => update('nutritionPricePer100', v)}
            />
            <SettingField
              label="Sell Markdown"
              value={settings.sellMarkdown}
              step="0.5"
              unit="%"
              onChange={(v) => update('sellMarkdown', v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SettingField({
  label, value, step, unit, onChange,
}: {
  label: string;
  value: number;
  step: string;
  unit?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={{
            backgroundColor: 'var(--color-surface-3)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        {unit && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{unit}</span>}
      </div>
    </div>
  );
}
