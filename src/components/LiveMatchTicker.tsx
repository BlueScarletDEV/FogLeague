import React, { useState, useEffect } from 'react';
import { GameMode } from '../types';
import { Clock, ShieldCheck, Copy, Check, ExternalLink, AlertTriangle, Users } from 'lucide-react';
import { soundManager } from '../lib/audioManager';

interface LiveMatchTickerProps {
  mode: GameMode;
  killerName: string;
  survivorNames: string[];
  lobbyCode?: string;
  refereeName?: string;
}

export const LiveMatchTicker: React.FC<LiveMatchTickerProps> = ({
  mode,
  killerName,
  survivorNames,
  lobbyCode,
  refereeName,
}) => {
  const [matchSeconds, setMatchSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  // Chronomètre officiel de match
  useEffect(() => {
    const timer = setInterval(() => {
      setMatchSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = () => {
    if (!lobbyCode) return;
    navigator.clipboard.writeText(lobbyCode);
    setCopied(true);
    soundManager.playPickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#141417] border border-faceit-orange/40 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header Statut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PARTIE DBD EN COURS</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-faceit-orange" />
            <span>Chronomètre : <strong className="text-white font-bold">{formatTimer(matchSeconds)}</strong></span>
          </div>
        </div>

        {/* Lobby Code Direct Copy */}
        {lobbyCode && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">Salon DBD :</span>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 font-mono font-bold text-xs text-faceit-orange flex items-center gap-1.5 transition-colors"
              title="Copier le code de salon Dead by Daylight"
            >
              <span>{lobbyCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Participants & Protocole */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#18181c] border border-zinc-800 space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Tueur (Hôte / KYF)</div>
          <div className="font-bold text-sm text-red-400 truncate">{killerName}</div>
          <div className="text-[11px] text-zinc-400">Rôle Tueur • Règle DBDL 1 régression max</div>
        </div>

        <div className="p-4 rounded-xl bg-[#18181c] border border-zinc-800 space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-zinc-500 font-mono">
            {mode === '1v1_chase' ? 'Survivant Duel' : `Survivants (${survivorNames.length})`}
          </div>
          <div className="font-bold text-sm text-blue-400 truncate">
            {survivorNames.join(', ') || 'En attente...'}
          </div>
          <div className="text-[11px] text-zinc-400">
            {mode === '1v1_chase' ? 'Shack Arena • Seuil victoire 55s' : 'Compétition 4v1'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#18181c] border border-zinc-800 space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Arbitrage Officiel</div>
          <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{refereeName || 'Arbitre Neutre Homologué'}</span>
          </div>
          <div className="text-[11px] text-zinc-400">Observateur officiel en salon Dead by Daylight</div>
        </div>
      </div>

      {/* Directives de Fin de Match */}
      <div className="p-4 rounded-xl bg-orange-950/20 border border-faceit-orange/30 text-xs text-zinc-300 leading-relaxed flex items-start gap-3">
        <div className="p-1 rounded bg-faceit-orange/20 text-faceit-orange shrink-0 mt-0.5 font-bold">
          ℹ️
        </div>
        <div>
          <strong className="text-white">Protocole de Clôture du Match :</strong> Jouez la partie dans Dead by Daylight. Dès que la partie est terminée, utilisez les boutons de <strong>Déclaration Rapide (Victoire / Défaite)</strong> ci-dessous. En cas d'accord mutuel, les points ELO sont mis à jour instantanément. En cas de désaccord, l'arbitre tranche avec la capture d'écran.
        </div>
      </div>
    </div>
  );
};
