// ==============================================================
// 🚨 FOGLEAGUE — GESTIONNAIRE DE SANCTIONS & ANTI-TRICHE
// ==============================================================

export interface PlayerPenalty {
  id: string;
  userId: string;
  matchId: string;
  reason: string;
  detectedDiscrepancy: {
    declaredPerk: string;
    detectedPerk: string;
  };
  bannedUntilTimestamp: number; // Date de fin du ban
  durationMinutes: number;
  eloDeduction: number;
  timestamp: number;
  infractionCount: number; // 1ère fois, 2ème fois, 3ème fois
}

const PENALTY_STORAGE_KEY = 'fogleague_player_penalties_v1';

export function getPlayerPenalties(userId: string = 'default'): PlayerPenalty[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`${PENALTY_STORAGE_KEY}_${userId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isPlayerSuspended(userId: string = 'default'): {
  isSuspended: boolean;
  remainingMinutes: number;
  remainingSeconds: number;
  activePenalty?: PlayerPenalty;
} {
  const penalties = getPlayerPenalties(userId);
  const now = Date.now();
  const active = penalties.find((p) => p.bannedUntilTimestamp > now);

  if (!active) {
    return { isSuspended: false, remainingMinutes: 0, remainingSeconds: 0 };
  }

  const diffMs = active.bannedUntilTimestamp - now;
  const remainingMinutes = Math.floor(diffMs / (1000 * 60));
  const remainingSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    isSuspended: true,
    remainingMinutes,
    remainingSeconds,
    activePenalty: active,
  };
}

export function applyPenaltyForPerkFraud(
  userId: string = 'default',
  matchId: string,
  declaredPerk: string,
  detectedPerk: string
): PlayerPenalty {
  const current = getPlayerPenalties(userId);
  const infractionCount = current.length + 1;

  // Barème progressif des punitions :
  // 1ère infraction : 30 minutes de ban file + -35 ELO
  // 2ème infraction : 24 heures de ban file + -75 ELO
  // 3ème infraction : 7 jours de ban file + -150 ELO
  let durationMinutes = 30;
  let eloDeduction = 35;

  if (infractionCount === 2) {
    durationMinutes = 1440; // 24h
    eloDeduction = 75;
  } else if (infractionCount >= 3) {
    durationMinutes = 10080; // 7 jours
    eloDeduction = 150;
  }

  const bannedUntilTimestamp = Date.now() + durationMinutes * 60 * 1000;

  const newPenalty: PlayerPenalty = {
    id: `pen-${Date.now()}`,
    userId,
    matchId,
    reason: `Fraude de Compétence (Build Violation) : Vous avez déclaré jouer "${declaredPerk}", mais le rapport de match a relevé "${detectedPerk}" sur votre capture de jeu.`,
    detectedDiscrepancy: {
      declaredPerk,
      detectedPerk,
    },
    bannedUntilTimestamp,
    durationMinutes,
    eloDeduction,
    timestamp: Date.now(),
    infractionCount,
  };

  const updated = [newPenalty, ...current];
  localStorage.setItem(`${PENALTY_STORAGE_KEY}_${userId}`, JSON.stringify(updated));
  return newPenalty;
}

export function liftAllPenalties(userId: string = 'default'): void {
  localStorage.removeItem(`${PENALTY_STORAGE_KEY}_${userId}`);
}
