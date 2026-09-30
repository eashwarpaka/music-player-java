/**
 * UI Design System and Theme Type Definitions.
 */

export type UIStyleId = 
  | 'custom_three' 
  | 'custom_two' 
  | 'claymorphism' 
  | 'glassmorphism' 
  | 'neumorphism' 
  | 'minimal';

export interface UIStyleDefinition {
  id: UIStyleId;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  accentHint: string;
  supportsLightMode: boolean;
}

export const UI_STYLES: UIStyleDefinition[] = [
  {
    id: 'custom_three',
    name: 'Custom Three',
    tagline: 'Black Gray & Strong Black',
    description: 'Black gray primary, deep strong black secondary, and sleek titanium slate with warm amber glow blends.',
    emoji: '🌑',
    accentHint: '#f59e0b',
    supportsLightMode: false,
  },
  {
    id: 'custom_two',
    name: 'Custom Two',
    tagline: 'Black, Gray, White & Grayish',
    description: 'High-contrast monochrome palette combining primary black, secondary gray, third white, and grayish accents.',
    emoji: '🖤',
    accentHint: '#ffffff',
    supportsLightMode: false,
  },
  {
    id: 'claymorphism',
    name: 'Claymorphism',
    tagline: 'Soft 3D & Playful',
    description: 'Inflated 3D rounded shapes, tactile clay depth, double convex drop shadows, and warm organic curves.',
    emoji: '🧸',
    accentHint: '#00f0ff',
    supportsLightMode: true,
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    tagline: 'Frosted Glass & Luminous',
    description: 'Deep background blur, translucent frosted panels, specular crystalline borders, and vibrant atmospheric glows.',
    emoji: '💎',
    accentHint: '#38bdf8',
    supportsLightMode: true,
  },
  {
    id: 'neumorphism',
    name: 'Neumorphism',
    tagline: 'Soft Extruded Surface',
    description: 'Monochromatic surface extrusion, seamless soft dual-shadow blend, and sunken debossed pressed states.',
    emoji: '🔘',
    accentHint: '#818cf8',
    supportsLightMode: true,
  },
  {
    id: 'minimal',
    name: 'Modern Minimal',
    tagline: 'Clean Flat & Precision',
    description: 'Sharp precision lines, crisp borders, subtle single-direction elevation, and high-contrast typography.',
    emoji: '⚡',
    accentHint: '#10b981',
    supportsLightMode: true,
  },
];

export const DEFAULT_UI_STYLE: UIStyleId = 'custom_three';
