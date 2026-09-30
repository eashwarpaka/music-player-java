/**
 * Custom Two Color Palette
 * 1. Primary: Black
 * 2. Secondary: Gray
 * 3. Third: White
 * 4. Last: Grayish
 * + Cyber Cyan Accent
 */

export const CUSTOM_TWO_PALETTE = {
  // 1. Primary: Pure & Deep Black
  primary: {
    black: '#000000',
    blackSurface: '#0d0d11',
    blackCard: '#131318',
    blackCardHover: '#1a1a22',
  },

  // 2. Secondary: Neutral & Cool Gray
  secondary: {
    gray: '#52525b',
    grayDark: '#27272a',
    grayBtn: '#222228',
    grayBtnHover: '#2e2e38',
    grayBorder: 'rgba(255, 255, 255, 0.12)',
    grayBorderHover: 'rgba(255, 255, 255, 0.25)',
  },

  // 3. Third: Crisp Pure & Off White
  third: {
    white: '#ffffff',
    whiteSoft: '#f4f4f5',
    whiteDim: '#e4e4e7',
    whiteGlass: 'rgba(255, 255, 255, 0.08)',
  },

  // 4. Last: Soft Grayish
  last: {
    grayish: '#a1a1aa',
    grayishSubtle: '#71717a',
    grayishLight: '#d4d4d8',
    grayishDark: '#3f3f46',
  },

  // Futuristic Cyber Accent
  accent: {
    cyan: '#00f0ff',
    cyanHover: '#38bdf8',
    cyanDark: '#0284c7',
    cyanGlow: 'rgba(0, 240, 255, 0.35)',
    mint: '#00f5d4',
  },
} as const;

export type CustomTwoPalette = typeof CUSTOM_TWO_PALETTE;
