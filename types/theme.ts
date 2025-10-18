/**
 * Theme Types
 * Type definitions for dark mode theming
 */

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}
