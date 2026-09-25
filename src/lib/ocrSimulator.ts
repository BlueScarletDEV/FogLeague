import { MatchResult } from '../types';

export interface OCRScanReport {
  success: boolean;
  killerDetected: string;
  totalHooks: number;
  escapes: number;
  gensRemaining: number;
  perksFound: string[];
  ruleViolationDetected?: string;
  matchResult: MatchResult;
  processingTimeMs: number;
}

export function simulateOCRScan(imageFileName: string, mode: '1v1_chase' | 'ranked_pug' | 'team_scrim'): Promise<OCRScanReport> {
  return new Promise((resolve) => {
    // Simuler un temps de calcul de 1.8s (OCR neural)
    setTimeout(() => {
      if (mode === '1v1_chase') {
        const chaseSeconds = Math.floor(Math.random() * 45) + 35; // 35s à 80s
        const survWins = chaseSeconds >= 55;
        
        resolve({
          success: true,
          killerDetected: 'Le Fléau (The Blight)',
          totalHooks: 1,
          escapes: survWins ? 1 : 0,
          gensRemaining: 5,
          perksFound: ['Shadowborn', 'Dead Hard', 'Resilience', 'Iron Will'],
          processingTimeMs: 1420,
          matchResult: {
            winner: survWins ? 'player2' : 'player1',
            chaseTimeSeconds: chaseSeconds,
            eloChange: survWins ? 22 : -18,
            verifiedByOCR: true,
          }
        });
      } else {
        // Mode 4v1 Ranked ou 5v5 Scrim
        const hooks = Math.floor(Math.random() * 5) + 7; // 7 à 11 hooks
        const escapes = hooks >= 10 ? 1 : 2;
        const killerWins = hooks >= 9;
        
        // Simuler une petite chance de détecter une perk interdite (ex: double régression)
        const hasDoubleRegression = Math.random() < 0.15;
        const ruleViolation = hasDoubleRegression 
          ? 'Violation Détectée : "Pop Goes The Weasel" + "Scourge Hook: Pain Resonance" équipés simultanément (Limite : 1 perk de régression en DBDL).'
          : undefined;

        resolve({
          success: true,
          killerDetected: 'La Chasseuse (The Huntress)',
          totalHooks: hooks,
          escapes: escapes,
          gensRemaining: escapes > 1 ? 0 : 1,
          perksFound: [
            'Scourge Hook: Pain Resonance',
            hasDoubleRegression ? 'Pop Goes The Weasel' : 'Corrupt Intervention',
            'Barbecue & Chilli',
            'Lethal Pursuer'
          ],
          ruleViolationDetected: ruleViolation,
          processingTimeMs: 1850,
          matchResult: {
            winner: ruleViolation ? 'survivors' : (killerWins ? 'killer' : 'survivors'),
            killerHooks: hooks,
            escapes: escapes,
            gensRemaining: escapes > 1 ? 0 : 1,
            eloChange: ruleViolation ? -35 : (killerWins ? 24 : -16),
            bannedPerkDetected: ruleViolation,
            verifiedByOCR: true,
          }
        });
      }
    }, 1800);
  });
}
