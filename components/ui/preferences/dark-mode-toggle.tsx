'use client';

/**
 * Dark Mode Toggle
 * Toggle button for switching between light and dark themes
 */

import { useTheme } from '@/components/theme/theme-provider';
import { Moon, Sun } from 'lucide-react';

export function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      type="button"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span>{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
    </button>
  );
}
