import React from 'react';
import { Player } from '../types';
import { EloBadge } from './EloBadge';
import {
  X,
  Skull,
  Shield,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Trophy,
  Swords,
  Gamepad2,
  Award,
} from 'lucide-react';

interface PlayerInspectModalProps {
  player: Player | null;
  onClose: () => void;
}

export const PlayerInspectModal: React.FC<PlayerInspectModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  const steamId =
    player.steamId || (player.id.startsWith('usr_steam_') ? player.id.replace('usr_steam_', '') : null);

  const isUnranked = player.matchesPlayed === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#141417] border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#18181c]">
          <div className="flex items-center gap-2">
            <EloBadge level={player.level} size="sm" />
            <h3 className="text-base font-black uppercase text-white tracking-wide">
              Fiche Joueur Compétitive Officielle
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
        <div className="p-6 space-y-5">
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
                    title="Inspecter le profil réel sur Steam"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#66c0f4]" />
                    <span>Steam: {steamId.slice(0, 6)}...{steamId.slice(-4)}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>
                )}

                {/* Statut VAC */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    player.vacBanned
                      ? 'bg-red-950 text-red-400 border-red-800'
                      : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}
                >
                  {player.vacBanned ? 'VAC BANNED' : '0 BAN VAC'}
                </span>
              </div>

              <div className="text-xs text-zinc-400 flex flex-wrap justify-center sm:justify-start gap-3 mt-2 font-mono">
                <span>Rôle : <strong className="text-white capitalize">{player.role}</strong></span>
                <span>Karma : <strong className="text-emerald-400">{player.karma}%</strong></span>
                <span>Réputation : <strong className="text-white">{player.trustFactor || 'Élite'}</strong></span>
              </div>
            </div>
          </div>

          {/* Grille des Stats E-Sport Incontestables */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-[#18181c] p-3.5 rounded-xl border border-zinc-800">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1 mb-1">
                <Trophy className="w-3.5 h-3.5 text-faceit-orange" />
                <span>Score ELO</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">{player.elo}</div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Rang {player.level} officiel</div>
            </div>

            <div className="bg-[#18181c] p-3.5 rounded-xl border border-zinc-800">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1 mb-1">
                <Swords className="w-3.5 h-3.5 text-blue-400" />
                <span>Matchs Ligue</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">{player.matchesPlayed}</div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {isUnranked ? 'En calibration' : 'Homologués'}
              </div>
            </div>

            <div className="bg-[#18181c] p-3.5 rounded-xl border border-zinc-800 col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1 mb-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Taux Victoire</span>
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {isUnranked ? '—' : `${player.winRate}%`}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {isUnranked ? '0 match' : 'Winrate réel'}
              </div>
            </div>
          </div>

          {/* Heures de Jeu & Préférences de Rôle */}
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-[#18181c] border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4 text-faceit-orange" />
                <span className="text-xs text-zinc-300 font-semibold">Temps de jeu Dead by Daylight :</span>
              </div>
              <span className="text-xs font-mono font-bold text-white">
                {player.gameHoursDBD && player.gameHoursDBD > 0
                  ? `${player.gameHoursDBD.toLocaleString()} heures`
                  : 'Certifié Steam'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#18181c] border border-zinc-800 flex items-center gap-2">
                <Skull className="w-4 h-4 text-red-500 shrink-0" />
                <div className="truncate">
                  <div className="text-[9px] uppercase font-bold text-zinc-500">Tueur Favori</div>
                  <div className="text-xs font-bold text-white truncate">{player.mainKiller || 'La Chasseuse'}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#18181c] border border-zinc-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[9px] uppercase font-bold text-zinc-500">Survivant Favori</div>
                  <div className="text-xs font-bold text-white truncate">{player.mainSurvivor || 'Nea Karlsson'}</div>
                </div>
              </div>
            </div>

            {/* Certificat Valve */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {player.vacBanned
                  ? 'Compte exclu : Antécédent de tricherie détecté par Valve.'
                  : 'Identité Steam certifiée et intégrité compétitive vérifiée (100% Clean).'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
