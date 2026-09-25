import React from 'react';
import { Player } from '../types';
import { EloBadge } from './EloBadge';
import { RadarChart } from './RadarChart';
import { X, Trophy, Skull, Shield, Award, CheckCircle2 } from 'lucide-react';

interface PlayerInspectModalProps {
  player: Player | null;
  onClose: () => void;
}

export const PlayerInspectModal: React.FC<PlayerInspectModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  // Generate realistic radar stats based on player role and elo
  const isKiller = player.role === 'killer';
  const stats = {
    chase: Math.min(99, Math.round((player.elo / 2500) * 100) + (isKiller ? -5 : 10)),
    macro: Math.min(99, Math.round((player.elo / 2500) * 95)),
    altruism: isKiller ? 40 : Math.min(99, Math.round((player.elo / 2500) * 90)),
    lethality: isKiller ? Math.min(99, Math.round((player.elo / 2500) * 105)) : 35,
    vision: Math.min(99, Math.round((player.elo / 2500) * 92)),
    karma: player.karma,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141417] border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#18181c]">
          <div className="flex items-center gap-2">
            <EloBadge level={player.level} size="sm" />
            <h3 className="text-base font-black uppercase text-white tracking-wide">
              Fiche Joueur Compétitif FogLeague
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-zinc-700 shadow-xl"
            />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-black text-white uppercase">{player.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-bold">
                  Karma : {player.karma}%
                </span>
              </div>
              <div className="text-xs text-zinc-400 flex flex-wrap justify-center sm:justify-start gap-4 mt-2">
                <span>Rôle : <strong className="text-white capitalize">{player.role}</strong></span>
                <span>Points : <strong className="text-faceit-orange font-mono">{player.elo} ELO</strong></span>
                <span>Matchs : <strong className="text-white font-mono">{player.matchesPlayed}</strong></span>
                <span>Winrate : <strong className="text-emerald-400 font-mono">{player.winRate}%</strong></span>
              </div>
            </div>
          </div>

          {/* Grid: Radar Chart + Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2 border-t border-zinc-800/80">
            {/* Radar Chart */}
            <div className="bg-[#18181c] p-4 rounded-2xl border border-zinc-800 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
                Profil de Performance Compétitive
              </span>
              <RadarChart stats={stats} size={220} />
            </div>

            {/* Specialties & Badges */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#18181c] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                  Tueur Maîtrisé
                </span>
                <div className="font-bold text-sm text-white flex items-center gap-2 mt-1">
                  <Skull className="w-4 h-4 text-red-500" />
                  <span>{player.mainKiller || 'Flex Tueur'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#18181c] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                  Survivant de Prédilection
                </span>
                <div className="font-bold text-sm text-white flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>{player.mainSurvivor || 'Flex Survivant'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Casier compétitif vierge : Zéro avertissement ou tricherie détectée.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
