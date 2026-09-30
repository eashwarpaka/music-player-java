/**
 * Custom Three Design System Palette
 * - Primary: Black Gray
 * - Secondary: Strong Obsidian Black
 * - Accents: Warm Amber Gold, Electric Sky Blue, Titanium & Slate
 */

export const CUSTOM_THREE_PALETTE = {
  // 1. Primary: Black Gray shades
  primary: {
    base: '#18181b', // Zinc-900 / Deep Black Gray
    surface: '#1e1e24', // Subtle elevated black gray
    card: '#23232a', // Container card surface
    cardHover: '#2a2a33', // Hover highlight
    border: '#33333d', // Muted structural border
    borderHover: '#4b4b57', // High contrast border hover
  },

  // 2. Secondary: Strong Black
  secondary: {
    base: '#000000', // Pure obsidian black
    surface: '#050507', // Deep dark backdrop
    subtle: '#0c0c10', // Deep black container
    inset: '#000000', // Sunk pressed inset
  },

  // 3. Harmonious Blending Tones (Slate & Titanium)
  blend: {
    slate: '#94a3b8', // Cool titanium secondary text
    slateDim: '#64748b', // Muted subtitle text
    titaniumLight: '#cbd5e1', // High-contrast crisp labels
    charcoal: '#27272a', // Soft pill button background
    charcoalHover: '#323238', // Soft pill hover
  },

  // 4. Accent Highlights
  accent: {
    amber: '#f59e0b', // Radiant amber gold
    amberBright: '#fbbf24', // Luminous glow
    amberGlow: 'rgba(245, 158, 11, 0.45)', // Amber box shadow glow
    sky: '#38bdf8', // Electric wave blue
    skyGlow: 'rgba(56, 189, 248, 0.35)', // Cyan-sky wave glow
  },

  // Typography
  text: {
    primary: '#f8fafc', // Crisp white titanium
    secondary: '#cbd5e1', // Slate light
    dim: '#94a3b8', // Zinc / Slate muted
    inverse: '#000000', // Black for buttons with light fills
  },
} as const;

export type CustomThreePalette = typeof CUSTOM_THREE_PALETTE;
