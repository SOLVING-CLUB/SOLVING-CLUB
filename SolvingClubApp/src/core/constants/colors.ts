/**
 * App Color Palette
 * Following Material Design 3 guidelines
 * 
 * @deprecated Use useColors() hook from @core/theme/colors for theme-aware colors
 * This is kept for backward compatibility
 */
export const Colors = {
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

export type ColorKey = keyof typeof Colors;

