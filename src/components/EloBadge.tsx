import React from 'react';
import { getLevelColor } from '../lib/eloCalculator';

interface EloBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const EloBadge: React.FC<EloBadgeProps> = ({ level, size = 'md', showLabel = false }) => {
  const colors = getLevelColor(level);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-11 h-11 text-base font-bold',
    xl: 'w-16 h-16 text-2xl font-black',
  }[size];

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`relative ${sizeClasses} ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg flex items-center justify-center font-mono shadow-md ${colors.glow} select-none transition-transform hover:scale-105`}
        title={`Rang de l'Épreuve : Niveau ${level}`}
      >
        <span>{level}</span>
        {level === 10 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Rang {level}
        </span>
      )}
    </div>
  );
};
