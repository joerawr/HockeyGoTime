'use client';

/**
 * Helper Hints Component
 * Shows dismissible example queries to help users understand app capabilities
 * Displays until user explicitly dismisses
 */

import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import type { MCPServerId } from '@/types/preferences';

interface HelperHintsProps {
  onQueryClick: (query: string) => void;
  league: MCPServerId;
}

const SCAHA_EXAMPLES = [
  "When do we play next?",
  "When do we need to leave for our next game?",
  "What are the team standings in our division?",
  "Who has the most points on our team?",
  "What are our earliest games?",
];

const PGHL_EXAMPLES = [
  "When do we play next?",
  "When do we need to leave for our next game?",
  "What are the team standings in our division?",
  "Who do we play this weekend?",
  "What are our earliest games?",
];

export function HelperHints({ onQueryClick, league }: HelperHintsProps) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('hgt-hints-dismissed');
      setIsDismissed(dismissed === 'true');
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('hgt-hints-dismissed', 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  const examples = league === 'pghl' ? PGHL_EXAMPLES : SCAHA_EXAMPLES;

  return (
    <div className="mb-6 rounded-2xl border-2 border-sky-200 bg-sky-50 p-5 shadow-sm dark:border-sky-900 dark:bg-sky-950/30">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold text-sky-900 dark:text-sky-100">
            Try asking me...
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-sky-600 transition hover:bg-sky-100 dark:text-sky-400 dark:hover:bg-sky-900/50"
          aria-label="Dismiss hints"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {examples.map((example, i) => (
          <button
            key={i}
            onClick={() => onQueryClick(example)}
            className="w-full rounded-xl border border-sky-300 bg-white px-4 py-3 text-left text-sm text-sky-900 shadow-sm transition hover:border-sky-400 hover:bg-sky-50 hover:shadow-md dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100 dark:hover:border-sky-700 dark:hover:bg-sky-900/50"
          >
            "{example}"
          </button>
        ))}
      </div>

      {league === 'scaha' && (
        <p className="mt-3 text-xs text-sky-700 dark:text-sky-300">
          💡 I can also compare players, check standings, and get team stats!
        </p>
      )}

      {league === 'pghl' && (
        <p className="mt-3 text-xs text-sky-700 dark:text-sky-300">
          💡 Player and team stats coming soon for PGHL!
        </p>
      )}
    </div>
  );
}
