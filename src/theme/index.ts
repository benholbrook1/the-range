export const colors = {
  bg: '#F7F6F3',
  surface: '#FFFFFF',
  text: '#1A1C1A',
  textMuted: '#5C635C',
  border: '#E2E4E0',
  accent: '#1F6B4A',
  accentPressed: '#18563B',
  danger: '#A33B2C',
  success: '#2F7D4A',
} as const;

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  pageX: 20,
} as const;

export const radii = {
  button: 10,
} as const;

export const typography = {
  brand: {
    fontSize: 44,
    lineHeight: 48,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -1,
  },
  brandHero: {
    fontSize: 72,
    lineHeight: 74,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -2.4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'DMSans_500Medium',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'DMSans_400Regular',
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'DMSans_700Bold',
  },
  score: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -0.6,
  },
} as const;

export const theme = { colors, spacing, radii, typography };
