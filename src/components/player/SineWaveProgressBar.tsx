import React from 'react';
import { useUIStyle } from '../../context';

interface SineWaveProgressBarProps {
  progressPercent: number; // 0 - 100
  durationSeconds?: number;
  currentTimeSeconds?: number;
  isPlaying?: boolean;
  height?: number;
}

export const SineWaveProgressBar: React.FC<SineWaveProgressBarProps> = ({
  progressPercent,
  durationSeconds = 180,
  currentTimeSeconds = 0,
  isPlaying = false,
  height = 26,
}) => {
  const { currentStyle } = useUIStyle();
  const activePercent = Math.max(0, Math.min(100, progressPercent));

  // Generate SVG path for a pure static Sine Wave (constant phase = 0)
  // ViewBox: 0 to 100 in X, 0 to 24 in Y
  const generateSineWavePath = (
    startX = 0, 
    endX = 100, 
    amplitude = 7, 
    cycles = 4
  ) => {
    const points: string[] = [];
    const steps = 100;
    const stepSize = (endX - startX) / steps;
    const centerY = 12;

    if (startX >= endX) return '';

    for (let i = 0; i <= steps; i++) {
      const x = startX + i * stepSize;
      const progressRatio = x / 100;
      // Gentle taper at extreme edges for clean musical wave look
      const envelope = Math.sin(progressRatio * Math.PI) * 0.3 + 0.7;
      const angle = progressRatio * Math.PI * 2 * cycles;
      const y = centerY + Math.sin(angle) * amplitude * envelope;
      
      if (i === 0) {
        points.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
      } else {
        points.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
      }
    }
    return points.join(' ');
  };

  const playedWavePath = generateSineWavePath(0, activePercent, 7.5, 4);
  const unplayedWavePath = generateSineWavePath(activePercent, 100, 7.5, 4);

  // Compute current scrubber head position (x & y on the static wave)
  const currentRatio = activePercent / 100;
  const currentEnvelope = Math.sin(currentRatio * Math.PI) * 0.3 + 0.7;
  const currentY = 12 + Math.sin(currentRatio * Math.PI * 2 * 4) * 7.5 * currentEnvelope;

  // Style-specific dynamic theme gradient configurations
  const getGradientDef = () => {
    switch (currentStyle) {
      case 'custom_three':
        // Custom Three: Blue & Warm Amber/Orange Blend
        return (
          <linearGradient id="mini-sine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        );

      case 'custom_two':
        // Custom Two: Dark, White & Grayish Monochrome with Cyber Cyan Blend
        return (
          <linearGradient id="mini-sine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#e4e4e7" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        );

      case 'claymorphism':
        // Claymorphism: Playful Electric Cyan, Blue & White Blend
        return (
          <linearGradient id="mini-sine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
        );

      case 'glassmorphism':
        // Glassmorphism: Translucent Luminous Cyan & Vivid Orchid Glow Blend
        return (
          <linearGradient id="mini-sine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        );

      case 'neumorphism':
        // Neumorphism: Smooth Indigo, Violet & Soft Ice Blue Blend
        return (
          <linearGradient id="mini-sine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="65%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>
        );

      case 'minimal':
        // Minimal: Crisp Emerald Teal, Cyan & Pure Light Blend
        return (
          <linearGradient id="mini-sine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="60%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        );

      default:
        return (
          <linearGradient id="mini-sine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent, #38bdf8)" />
            <stop offset="100%" stopColor="var(--accent-dark, #f59e0b)" />
          </linearGradient>
        );
    }
  };

  const getStarColor = () => {
    switch (currentStyle) {
      case 'custom_three':
        return '#f59e0b';
      case 'custom_two':
        return '#00f0ff';
      case 'claymorphism':
        return '#00f0ff';
      case 'glassmorphism':
        return '#38bdf8';
      case 'neumorphism':
        return '#818cf8';
      case 'minimal':
        return '#10b981';
      default:
        return 'var(--accent, #f59e0b)';
    }
  };

  const starColor = getStarColor();

  return (
    <div
      className="sine-wave-container relative w-full select-none flex items-center py-1 cursor-default pointer-events-none"
      style={{ height }}
      aria-label={`Song progress: ${Math.round(activePercent)}%`}
      title={`Progress: ${Math.round(activePercent)}%`}
    >
      {/* SVG Canvas for Static Sine Wave */}
      <svg
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        className="w-full h-full relative z-10 overflow-visible"
      >
        <defs>
          {getGradientDef()}

          <filter id="mini-sine-glow" x="-30%" y="-50%" width="160%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="mini-star-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Unplayed Section of Static Sine Wave (Muted line showing remaining song) */}
        {unplayedWavePath && (
          <path
            d={unplayedWavePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sine-wave-unplayed-line text-[var(--text-dim)] opacity-25"
          />
        )}

        {/* 2. Played Section of Static Sine Wave (Glowing Theme-Adaptive Blended Gradient) */}
        {playedWavePath && (
          <path
            d={playedWavePath}
            fill="none"
            stroke="url(#mini-sine-gradient)"
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#mini-sine-glow)"
            className="sine-wave-played-line"
          />
        )}

        {/* 3. Radiant Compact Star Progress Indicator (Display-only) */}
        <g 
          transform={`translate(${activePercent}, ${currentY})`}
          className={`sine-star-thumb-wrap ${isPlaying ? 'is-playing' : ''}`}
        >
          {/* Outer Star Glow */}
          <path
            d="M 0 -4.6 Q 0.6 -0.6 4.6 0 Q 0.6 0.6 0 4.6 Q -0.6 0.6 -4.6 0 Q -0.6 -0.6 0 -4.6 Z"
            fill={starColor}
            filter="url(#mini-star-glow)"
            className="opacity-75"
          />

          {/* Compact Crisp 4-Point Star (Sparkle) */}
          <path
            d="M 0 -3.6 Q 0.45 -0.45 3.6 0 Q 0.45 0.45 0 3.6 Q -0.45 0.45 -3.6 0 Q -0.45 -0.45 0 -3.6 Z"
            fill="#ffffff"
            stroke={starColor}
            strokeWidth="0.6"
            className="sine-star-shape"
            style={{
              filter: `drop-shadow(0 0 3px ${starColor})`,
            }}
          />

          {/* Center Mini Sparkle Core */}
          <circle cx="0" cy="0" r="0.75" fill={starColor} />
        </g>
      </svg>
    </div>
  );
};
