import React from 'react';

interface PlayingDotsIndicatorProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  barsCount?: number;
}

export const PlayingDotsIndicator: React.FC<PlayingDotsIndicatorProps> = ({
  color = 'var(--accent)',
  size = 'md',
  className = '',
  barsCount = 3,
}) => {
  const gapClass = 
    size === 'sm' ? 'gap-[2px]' : 
    size === 'lg' ? 'gap-[4px]' : 
    'gap-[2.5px]';

  return (
    <div 
      className={`playing-dots-indicator flex items-center justify-center ${gapClass} ${className}`}
      aria-label="Song playing"
      title="Currently Playing"
    >
      <span 
        className="playing-eq-bar shadow-xs" 
        style={{ backgroundColor: color }} 
      />
      <span 
        className="playing-eq-bar shadow-xs" 
        style={{ backgroundColor: color }} 
      />
      <span 
        className="playing-eq-bar shadow-xs" 
        style={{ backgroundColor: color }} 
      />
      {barsCount >= 4 && (
        <span 
          className="playing-eq-bar shadow-xs" 
          style={{ backgroundColor: color }} 
        />
      )}
    </div>
  );
};
