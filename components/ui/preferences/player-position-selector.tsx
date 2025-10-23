'use client';

/**
 * Player Position Selector Component
 * Allows users to select their player position (Skater or Goalie)
 * Used in preferences panel to customize stats display
 */

import type { PlayerPosition } from '@/types/preferences';
import { Swords, Shield } from 'lucide-react';

interface PlayerPositionSelectorProps {
  value: PlayerPosition;
  onChange: (position: PlayerPosition) => void;
  disabled?: boolean;
}

export function PlayerPositionSelector({
  value,
  onChange,
  disabled = false,
}: PlayerPositionSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Skater/Goalie
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('skater')}
          disabled={disabled}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
            value === 'skater'
              ? 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-100'
              : 'border-border bg-card text-muted-foreground hover:border-border/60 hover:bg-accent'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          aria-pressed={value === 'skater'}
        >
          <Swords className="h-4 w-4" />
          <span>Skater</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('goalie')}
          disabled={disabled}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
            value === 'goalie'
              ? 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-100'
              : 'border-border bg-card text-muted-foreground hover:border-border/60 hover:bg-accent'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          aria-pressed={value === 'goalie'}
        >
          <Shield className="h-4 w-4" />
          <span>Goalie</span>
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {value === 'skater'
          ? 'Shows goals, assists, points, and +/- by default'
          : 'Shows saves, save percentage, GAA, and shutouts by default'}
      </p>
    </div>
  );
}
