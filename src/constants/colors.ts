// Sherpaa design tokens — single source of truth
// All components must import colors from here, not hardcode hex values

export const colors = {
  // Backgrounds
  bg: '#1C1C1E',
  surface: '#2A2A2A',
  surfaceAlt: '#242424',
  surfaceDim: '#1A1A1A',

  // Borders
  border: '#363636',
  borderSubtle: '#2E2E2E',
  borderMuted: '#333333',

  // Accent
  gold: '#F5C842',
  goldDim: 'rgba(245,200,66,0.08)',
  goldBorder: 'rgba(245,200,66,0.2)',

  // Text
  textPrimary: '#F0F0F0',
  textSecondary: '#888888',
  textMuted: '#555555',
  textDim: '#444444',
  textFaint: 'rgba(240,240,240,0.4)',

  // Semantic
  success: '#30A46C',
  successDim: 'rgba(48,164,108,0.08)',
  successBorder: 'rgba(48,164,108,0.2)',
  error: '#E5484D',
  errorDim: 'rgba(229,72,77,0.1)',

  // Pure
  black: '#000000',
  white: '#FFFFFF',
} as const;
