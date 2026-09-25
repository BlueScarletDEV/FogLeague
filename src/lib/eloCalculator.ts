export function getMistRank(elo: number): number {
  if (elo < 800) return 1;
  if (elo <= 950) return 2;
  if (elo <= 1100) return 3;
  if (elo <= 1250) return 4;
  if (elo <= 1400) return 5;
  if (elo <= 1550) return 6;
  if (elo <= 1700) return 7;
  if (elo <= 1850) return 8;
  if (elo <= 2000) return 9;
  return 10;
}

// Alias for compatibility
export const getFaceitLevel = getMistRank;

export function getLevelProgress(elo: number, matchesCount: number = 0): { currentLevel: number; progressPercent: number; nextLevelElo: number; isCalibrating: boolean } {
  if (matchesCount === 0) {
    return {
      currentLevel: 1,
      progressPercent: 0,
      nextLevelElo: 1250,
      isCalibrating: true,
    };
  }

  const currentLevel = getMistRank(elo);
  const thresholds = [0, 800, 951, 1101, 1251, 1401, 1551, 1701, 1851, 2001];
  
  if (currentLevel === 10) {
    return { currentLevel: 10, progressPercent: 100, nextLevelElo: 2500, isCalibrating: false };
  }

  const minForCurrent = thresholds[currentLevel - 1];
  const maxForCurrent = thresholds[currentLevel];
  const diff = maxForCurrent - minForCurrent;
  const currentInTier = elo - minForCurrent;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentInTier / diff) * 100)));

  return {
    currentLevel,
    progressPercent,
    nextLevelElo: maxForCurrent,
    isCalibrating: false,
  };
}

export function getLevelColor(level: number): { bg: string; text: string; border: string; glow: string } {
  switch (level) {
    case 1:
      return { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-600', glow: 'shadow-zinc-500/20' };
    case 2:
    case 3:
      return { bg: 'bg-emerald-950', text: 'text-emerald-400', border: 'border-emerald-600', glow: 'shadow-emerald-500/30' };
    case 4:
    case 5:
    case 6:
    case 7:
      return { bg: 'bg-amber-950', text: 'text-amber-400', border: 'border-amber-600', glow: 'shadow-amber-500/30' };
    case 8:
    case 9:
      return { bg: 'bg-orange-950', text: 'text-faceit-orange', border: 'border-faceit-orange', glow: 'shadow-faceit-orange/40' };
    case 10:
    default:
      return { bg: 'bg-red-950', text: 'text-red-500', border: 'border-red-500', glow: 'shadow-red-600/50' };
  }
}
