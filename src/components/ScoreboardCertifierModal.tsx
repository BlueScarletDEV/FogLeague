import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, ShieldCheck, Cpu, X, Plus, Sparkles, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../lib/audioManager';
import { CertifiedMatch, addCertifiedMatch } from '../lib/matchStore';
import { COMP_RULES } from '../data/dbdData';
import { computeSha256 } from '../lib/cryptoUtils';

interface ScoreboardCertifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentElo: number;
  userId?: string;
  onMatchCertified: (newMatch: CertifiedMatch) => void;
}

export const ScoreboardCertifierModal: React.FC<ScoreboardCertifierModalProps> = ({
  isOpen,
  onClose,
  currentElo,
  userId,
  onMatchCertified,
}) => {
  const [mode, setMode] = useState<'1v1_chase' | 'ranked_pug' | 'team_scrim'>('1v1_chase');
  const [role, setRole] = useState<'killer' | 'survivor'>('survivor');
  const [character, setCharacter] = useState('Nea Karlsson');
  const [map, setMap] = useState('Tour de charbon (Coal Tower)');
  const [chaseTime, setChaseTime] = useState(62);
  const [gensDone, setGensDone] = useState(3);
  const [hooksCount, setHooksCount] = useState(9);
  const [bloodpoints, setBloodpoints] = useState(24500);
  const [selectedPerks, setSelectedPerks] = useState<string[]>([
    'Resilience',
    'Iron Will',
    'Dead Hard',
    'Windows of Opportunity',
  ]);
  const [hasIllegalPerk, setHasIllegalPerk] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState('');

  if (!isOpen) return null;

  // Preset perks
  const commonPerks = role === 'killer'
    ? [
        'Scourge Hook: Pain Resonance',
        'Pop Goes The Weasel',
        'Corrupt Intervention',
        'Barbecue & Chilli',
        'Lethal Pursuer',
        'Deadlock',
        'No One Escapes Death (NOED)',
      ]
    : [
        'Resilience',
        'Iron Will',
        'Dead Hard',
        'Windows of Opportunity',
        'Sprint Burst',
        'Adrenaline',
        'Kindred',
        'Decisive Strike',
        'Unbreakable',
      ];

  const togglePerk = (perk: string) => {
    soundManager.playPickSound();
    if (selectedPerks.includes(perk)) {
      setSelectedPerks(selectedPerks.filter((p) => p !== perk));
    } else {
      if (selectedPerks.length >= 4) {
        setSelectedPerks([...selectedPerks.slice(1), perk]);
      } else {
        setSelectedPerks([...selectedPerks, perk]);
      }
    }
  };

  const handleSimulateCertify = async () => {
    setIsAuditing(true);
    soundManager.playPickSound();

    setAuditStep('Vérification du code de salon KYF et de la signature d\'intégrité...');
    await new Promise((r) => setTimeout(r, 400));

    setAuditStep('Contrôle du build selon la banlist officielle DBDL 2026...');
    await new Promise((r) => setTimeout(r, 450));

    // Check rules: e.g. Pain Res + Pop = double regression violation
    const isDoubleRegression =
      selectedPerks.includes('Scourge Hook: Pain Resonance') &&
      selectedPerks.includes('Pop Goes The Weasel');

    const isViolation = isDoubleRegression || hasIllegalPerk;

    setAuditStep('Calcul cryptographique de la signature SHA-256...');
    await new Promise((r) => setTimeout(r, 350));

    // Compute result
    let isWin = false;
    let eloChange = 0;

    if (isViolation) {
      isWin = false;
      eloChange = -35;
    } else if (mode === '1v1_chase') {
      isWin = chaseTime >= 55;
      eloChange = isWin ? 24 : -18;
    } else if (role === 'killer') {
      isWin = hooksCount >= 9;
      eloChange = isWin ? 26 : -16;
    } else {
      isWin = gensDone >= 3;
      eloChange = isWin ? 22 : -18;
    }

    const matchIdNum = Math.floor(1000 + Math.random() * 9000);
    const newMatchId = `FOG-${matchIdNum}`;
    const rawDataString = `${newMatchId}_${Date.now()}_${mode}_${role}_${eloChange}_${bloodpoints}`;
    
    // Calcul de l'empreinte cryptographique SHA-256 réelle
    const hash = await computeSha256(rawDataString);

    const newMatch: CertifiedMatch = {
      id: newMatchId,
      timestamp: Date.now(),
      dateFormatted: 'À l\'instant',
      mode: mode,
      modeLabel: mode === '1v1_chase' ? '1v1 Shack Arena' : mode === 'ranked_pug' ? 'Ranked PUG 1v4' : 'Team Scrim 5v5',
      map: map,
      userRole: role,
      result: isViolation ? 'Défaite' : (isWin ? 'Victoire' : 'Défaite'),
      isWin: !isViolation && isWin,
      eloChange: eloChange,
      eloAfter: Math.max(100, currentElo + eloChange),
      metrics: {
        chaseTimeSeconds: mode === '1v1_chase' ? chaseTime : undefined,
        generatorsDoneOrDefended: role === 'survivor' ? gensDone : Math.min(5, 5 - Math.floor(hooksCount / 3)),
        hooksInflictedOrAvoided: role === 'killer' ? hooksCount : (isWin ? 0 : 2),
        altruismEventsCount: role === 'survivor' ? (isWin ? 3 : 1) : 0,
        bloodpointsScore: bloodpoints,
        characterPlayed: character,
        perksUsed: selectedPerks,
        bannedPerksFound: isViolation ? ['Infraction Régression ou Addon'] : undefined,
      },
      audit: {
        sha256Proof: hash,
        lobbyCode: `DBD-${Math.floor(1000 + Math.random() * 9000)}-EU`,
        serverRegion: 'Europe Ouest (Paris - 10ms)',
        verifiedBy: 'Arbitre Certifié FogLeague & Consensus',
        complianceStatus: isViolation ? 'INFRACTION_DETECTEE' : 'CONFORME_DBDL',
        ruleNotes: isViolation
          ? 'INFRACTION LIGUE DBDL : Double perk de régression détectée (Pain Res + Pop).'
          : 'Scoreboard vérifié conforme aux quotas de compétition FogLeague 2026.',
        eloFormula: `ΔELO = ${eloChange > 0 ? '+' : ''}${eloChange} (K=32, Résultat certifié ${isWin ? 'Gagnant' : 'Perdant'})`,
      },
    };

    addCertifiedMatch(newMatch, userId);
    onMatchCertified(newMatch);

    setIsAuditing(false);
    setAuditStep('');

    if (isWin && !isViolation) {
      soundManager.playVictory();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF5500', '#FFAA00', '#FFFFFF'],
      });
    } else {
      soundManager.playBanSound();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141417] border border-zinc-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-[#18181d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-faceit-orange/10 border border-faceit-orange/30 text-faceit-orange flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase text-white tracking-wider">
                Certifier un Nouveau Match DBD
              </h2>
              <p className="text-xs text-zinc-400">
                Audit cryptographique, détection des infractions et mise à jour du radar
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playBanSound();
              onClose();
            }}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Mode Selector */}
          <div>
            <label className="text-xs uppercase font-bold text-zinc-400 block mb-2">Mode de Jeu</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '1v1_chase', label: '1v1 Shack Arena' },
                { id: 'ranked_pug', label: 'Ranked PUG 1v4' },
                { id: 'team_scrim', label: 'Team Scrim 5v5' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    soundManager.playPickSound();
                    setMode(m.id as any);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                    mode === m.id
                      ? 'bg-faceit-orange/20 border-faceit-orange text-white shadow-faceit-glow'
                      : 'bg-[#18181d] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role & Character */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase font-bold text-zinc-400 block mb-2">Rôle Joué</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundManager.playPickSound();
                    setRole('survivor');
                    setCharacter('Nea Karlsson');
                  }}
                  className={`py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                    role === 'survivor'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-[#18181d] border-zinc-800 text-zinc-400'
                  }`}
                >
                  Survivant
                </button>
                <button
                  onClick={() => {
                    soundManager.playPickSound();
                    setRole('killer');
                    setCharacter('La Chasseuse (The Huntress)');
                  }}
                  className={`py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                    role === 'killer'
                      ? 'bg-red-600/20 border-red-500 text-red-400'
                      : 'bg-[#18181d] border-zinc-800 text-zinc-400'
                  }`}
                >
                  Tueur
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-zinc-400 block mb-2">Personnage</label>
              <input
                type="text"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                className="w-full bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-faceit-orange"
              />
            </div>
          </div>

          {/* Metrics Sliders */}
          <div className="bg-[#18181d] border border-zinc-800 p-4 rounded-2xl space-y-4">
            <h3 className="text-xs uppercase font-bold text-zinc-300">Métriques de la Partie</h3>

            {mode === '1v1_chase' ? (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Temps de Poursuite Shack (Chrono)</span>
                  <span className="font-mono font-bold text-faceit-orange">{chaseTime} secondes (Seuil Victoire: 55s)</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={chaseTime}
                  onChange={(e) => setChaseTime(Number(e.target.value))}
                  className="w-full accent-faceit-orange"
                />
              </div>
            ) : role === 'killer' ? (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Crochets Infligés</span>
                  <span className="font-mono font-bold text-red-400">{hooksCount} / 12 crochets</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={hooksCount}
                  onChange={(e) => setHooksCount(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Générateurs Réparés</span>
                  <span className="font-mono font-bold text-emerald-400">{gensDone} générateurs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={gensDone}
                  onChange={(e) => setGensDone(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Points de Sang (Bloodpoints Score)</span>
                <span className="font-mono font-bold text-white">{bloodpoints.toLocaleString()} BP</span>
              </div>
              <input
                type="range"
                min="5000"
                max="40000"
                step="500"
                value={bloodpoints}
                onChange={(e) => setBloodpoints(Number(e.target.value))}
                className="w-full accent-zinc-500"
              />
            </div>
          </div>

          {/* Perks Selector with Rule Validation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs uppercase font-bold text-zinc-400">
                Compétences (4 Perks au choix)
              </label>
              <span className="text-xs font-mono text-faceit-orange font-bold">
                {selectedPerks.length} / 4 sélectionnées
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {commonPerks.map((perk) => {
                const isSelected = selectedPerks.includes(perk);
                const isWarning =
                  isSelected &&
                  selectedPerks.includes('Scourge Hook: Pain Resonance') &&
                  selectedPerks.includes('Pop Goes The Weasel') &&
                  (perk === 'Scourge Hook: Pain Resonance' || perk === 'Pop Goes The Weasel');

                return (
                  <button
                    key={perk}
                    onClick={() => togglePerk(perk)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      isWarning
                        ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                        : isSelected
                        ? 'bg-faceit-orange/20 border-faceit-orange text-white'
                        : 'bg-[#18181d] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {perk}
                  </button>
                );
              })}
            </div>

            {selectedPerks.includes('Scourge Hook: Pain Resonance') &&
              selectedPerks.includes('Pop Goes The Weasel') && (
                <div className="mt-2.5 p-3 rounded-xl bg-red-950/50 border border-red-600/70 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Infraction aux règles DBDL :</strong> "Pain Res" et "Pop" équipés ensemble violent la limite de 1 perk de régression. Le match sera sanctionné de -35 ELO.
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* Audit Progress or Submit Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#18181d]">
          {isAuditing ? (
            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2 text-xs font-mono text-faceit-orange animate-pulse">
                <Cpu className="w-4 h-4" />
                <span>{auditStep}</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-faceit-orange animate-pulse" style={{ width: '80%' }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                La conformité et la signature SHA-256 seront générées automatiquement.
              </div>
              <button
                onClick={handleSimulateCertify}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-faceit-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-black text-xs uppercase tracking-wider shadow-faceit-glow transition-all flex items-center gap-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Auditer & Homologuer le Match</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
