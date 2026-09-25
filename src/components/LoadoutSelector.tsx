import React, { useState } from 'react';
import { Shield, Skull, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { soundManager } from '../lib/audioManager';

interface Perk {
  id: string;
  name: string;
  category: 'regression' | 'exhaustion' | 'info' | 'chase' | 'utility';
  role: 'killer' | 'survivor';
  description: string;
}

const AVAILABLE_PERKS: Perk[] = [
  // Killer Perks
  { id: 'pain_res', name: 'Crochet Flagellateur : Écho de Douleur', category: 'regression', role: 'killer', description: 'Régression de 20% sur le générateur au premier accrochage.' },
  { id: 'pop', name: 'Pop Goes The Weasel', category: 'regression', role: 'killer', description: 'Régression de 20% après avoir donné un coup de pied au générateur.' },
  { id: 'corrupt', name: 'Intervention Corrompue', category: 'utility', role: 'killer', description: 'Les 3 générateurs les plus distants sont bloqués en début de match.' },
  { id: 'lethal', name: 'Poursuivant Mortel', category: 'info', role: 'killer', description: 'Aura des survivants révélée pendant 9 secondes au spawn.' },
  { id: 'deadlock', name: 'Impasse (Deadlock)', category: 'utility', role: 'killer', description: 'Bloque le générateur le plus avancé pendant 30s après chaque gen complété.' },
  { id: 'bamboozle', name: 'Embrouille (Bamboozle)', category: 'chase', role: 'killer', description: 'Enjambement plus rapide et bloque la fenêtre pendant 16 secondes.' },

  // Survivor Perks
  { id: 'dead_hard', name: 'Course Effrénée (Dead Hard)', category: 'exhaustion', role: 'survivor', description: 'Encaisse un coup fatal lors d\'un dash timing parfait.' },
  { id: 'sprint_burst', name: 'Course de Sprint', category: 'exhaustion', role: 'survivor', description: 'Sprint à 150% pendant 3s au démarrage d\'une course.' },
  { id: 'windows', name: 'Fenêtres d\'Opportunité', category: 'info', role: 'survivor', description: 'Auras des palettes et fenêtres visibles à 32 mètres.' },
  { id: 'resilience', name: 'Résilience', category: 'chase', role: 'survivor', description: '+9% de vitesse d\'action (réparations, sauts) lorsque blessé.' },
  { id: 'otr', name: 'Hors Dossier (Off The Record)', category: 'utility', role: 'survivor', description: 'Protection contre le tunnel pendant 80 secondes post-décrochage.' },
  { id: 'unbreakable', name: 'Indestructible', category: 'utility', role: 'survivor', description: 'Permet de se relever seul de l\'état critique une fois par match.' },
];

interface LoadoutSelectorProps {
  role: 'killer' | 'survivor';
  onSaveLoadout: (perks: string[]) => void;
}

export const LoadoutSelector: React.FC<LoadoutSelectorProps> = ({ role, onSaveLoadout }) => {
  const [selectedPerks, setSelectedPerks] = useState<string[]>(
    role === 'killer' ? ['pain_res', 'corrupt', 'lethal', 'deadlock'] : ['dead_hard', 'windows', 'resilience', 'otr']
  );
  const [isLocked, setIsLocked] = useState(false);

  const perksPool = AVAILABLE_PERKS.filter((p) => p.role === role);

  const togglePerk = (perkId: string) => {
    if (isLocked) return;
    soundManager.playPickSound();

    if (selectedPerks.includes(perkId)) {
      setSelectedPerks(selectedPerks.filter((id) => id !== perkId));
    } else {
      if (selectedPerks.length >= 4) {
        // Replace last
        setSelectedPerks([...selectedPerks.slice(1), perkId]);
      } else {
        setSelectedPerks([...selectedPerks, perkId]);
      }
    }
  };

  // Rule violation check
  const hasDoubleRegression =
    role === 'killer' &&
    selectedPerks.includes('pain_res') &&
    selectedPerks.includes('pop');

  const handleConfirm = () => {
    soundManager.playVictory();
    setIsLocked(true);
    onSaveLoadout(selectedPerks);
  };

  return (
    <div className="bg-[#151518] rounded-2xl border border-zinc-800 p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center gap-2.5">
          {role === 'killer' ? (
            <Skull className="w-5 h-5 text-red-500" />
          ) : (
            <Shield className="w-5 h-5 text-blue-400" />
          )}
          <div>
            <h3 className="font-black text-base uppercase text-white tracking-wide">
              Configuration du Build Compétitif (4 Compétences)
            </h3>
            <p className="text-xs text-zinc-400">
              Choisis ton build officiel avant le début de la partie
            </p>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={hasDoubleRegression || selectedPerks.length < 4}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            isLocked
              ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-400'
              : hasDoubleRegression
              ? 'bg-red-950/50 border border-red-800 text-red-400 cursor-not-allowed'
              : 'bg-faceit-orange hover:bg-orange-600 text-white shadow-faceit-glow'
          }`}
        >
          {isLocked ? (
            <>
              <Check className="w-4 h-4" />
              <span>Build Verrouillé</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Verrouiller mon Build</span>
            </>
          )}
        </button>
      </div>

      {/* Warning if Rule Infraction */}
      {hasDoubleRegression && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700 text-red-300 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold">Infraction Règlement de Ligue :</strong> Vous avez équipé à la fois <em>Écho de Douleur</em> et <em>Pop Goes The Weasel</em>. Le format officiel limite à 1 seule perk de régression. Vous devez en retirer une pour valider.
          </div>
        </div>
      )}

      {/* Perks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {perksPool.map((perk) => {
          const isSelected = selectedPerks.includes(perk.id);

          return (
            <div
              key={perk.id}
              onClick={() => togglePerk(perk.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-orange-950/30 border-faceit-orange shadow-md'
                  : 'bg-[#18181c] border-zinc-800 hover:border-zinc-700'
              } ${isLocked ? 'opacity-80 pointer-events-none' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {perk.category}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-faceit-orange text-white'
                        : 'border border-zinc-700 text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                </div>

                <div className="font-bold text-xs text-white">{perk.name}</div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  {perk.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
