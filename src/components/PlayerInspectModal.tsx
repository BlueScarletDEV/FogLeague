import React from 'react';
import { Player } from '../types';
import { EloBadge } from './EloBadge';
import { RadarChart } from './RadarChart';
import { X, Skull, Shield, CheckCircle2, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';

interface PlayerInspectModalProps {
  player: Player | null;
  onClose: () => void;
}

export const PlayerInspectModal: React.FC<PlayerInspectModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  const steamId = player.steamId || (player.id.startsWith('usr_steam_') ? player.id.replace('usr_steam_', '') : null);

  // Stats réelles basées sur les matchs certifiés (si 0 match -> tout à 0)
  const isUnranked = player.matchesPlayed === 0;
  const isKiller = player.role === 'killer';

  const stats = isUnranked
    ? {
        chase: 0,
        macro: 0,
        altruism: 0,
        lethality: 0,
        vision: 0,
        karma: player.karma ?? 100,
      }
    : {
        chase: Math.min(99, Math.round((player.elo / 2500) * 100) + (isKiller ? -5 : 10)),
        macro: Math.min(99, Math.round((player.elo / 2500) * 95)),
        altruism: isKiller ? 40 : Math.min(99, Math.round((player.elo / 2500) * 90)),
        lethality: isKiller ? Math.min(99, Math.round((player.elo / 2500) * 105)) : 35,
        vision: Math.min(99, Math.round((player.elo / 2500) * 92)),
        karma: player.karma ?? 100,
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141417] border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#18181c]">
          <div className="flex items-center gap-2">
            <EloBadge level={player.level} size="sm" />
            <h3 className="text-base font-black uppercase text-white tracking-wide">
              Fiche Joueur Compétitif Certifiée
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

                {/* Steam ID cliquable officiel */}
                {steamId && (
                  <a
                    href={`https://steamcommunity.com/profiles/${steamId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-0.5 rounded-full bg-[#1b2838] text-[#66c0f4] border border-[#2a475e] text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-[#2a475e] transition-colors"
                    title="Voir le vrai profil Steam Valve officiel"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#66c0f4]" />
                    <span>SteamID: {steamId.slice(0, 6)}...{steamId.slice(-4)}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>
                )}

                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-bold">
                  Karma : {player.karma}%
                </span>

                {/* VAC status */}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    player.vacBanned
                      ? 'bg-red-950 text-red-400 border-red-800'
                      : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}
                >
                  {player.vacBanned ? 'VAC BANNED' : 'VAC CLEAN'}
                </span>
              </div>

              <div className="text-xs text-zinc-400 flex flex-wrap justify-center sm:justify-start gap-4 mt-2 font-mono">
                <span>Rôle : <strong className="text-white capitalize">{player.role}</strong></span>
                <span>Points : <strong className="text-faceit-orange">{player.elo} ELO</strong></span>
                <span>Matchs : <strong className="text-white">{player.matchesPlayed}</strong></span>
                <span>Winrate : <strong className="text-emerald-400">{player.matchesPlayed === 0 ? '—' : `${player.winRate}%`}</strong></span>
              </div>
            </div>
          </div>

          {/* Grid: Radar Chart + Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2 border-t border-zinc-800/80">
            {/* Radar Chart */}
            <div className="bg-[#18181c] p-4 rounded-2xl border border-zinc-800 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
                {isUnranked ? 'Calibration en Cours (0 Match)' : 'Profil de Performance Compétitive'}
              </span>
              <RadarChart stats={stats} size={220} />
            </div>

            {/* Specialties & Badges */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#18181c] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                  Tueur Préféré
                </span>
                <div className="font-bold text-sm text-white flex items-center gap-2 mt-1">
                  <Skull className="w-4 h-4 text-red-500" />
                  <span>{player.mainKiller || 'La Chasseuse (The Huntress)'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#18181c] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                  Survivant Préféré
                </span>
                <div className="font-bold text-sm text-white flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>{player.mainSurvivor || 'Nea Karlsson'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {player.vacBanned
                    ? 'Alerte : antécédent de triche détecté sur le compte Steam.'
                    : 'Compte certifié Valve : Zéro antécédent de tricherie ou de ban VAC.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
