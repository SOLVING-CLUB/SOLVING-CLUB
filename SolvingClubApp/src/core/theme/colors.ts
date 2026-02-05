import {useTheme} from './ThemeContext';

/**
 * Theme-aware color palette
 */
const lightColors = {
  // Primary
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',

  // Secondary
  secondary: '#EC4899',
  secondaryDark: '#DB2777',
  secondaryLight: '#F472B6',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8FAFC',
  surface: '#FFFFFF',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Border & Divider
  border: '#E2E8F0',
  divider: '#F1F5F9',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

const darkColors = {
  // Primary
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primaryLight: '#A5B4FC',

  // Secondary
  secondary: '#F472B6',
  secondaryDark: '#EC4899',
  secondaryLight: '#F9A8D4',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#0F172A',
  surface: '#1E293B',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverse: '#0F172A',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Border & Divider
  border: '#334155',
  divider: '#1E293B',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;

export type ColorKey = keyof typeof lightColors;

/**
 * Hook to get theme-aware colors
 */
export const useColors = () => {
  const {theme} = useTheme();
  return theme === 'dark' ? darkColors : lightColors;
};

/**
 * Static color getter (for use outside components)
 */
export const getColors = (theme: 'light' | 'dark') => {
  return theme === 'dark' ? darkColors : lightColors;
};

