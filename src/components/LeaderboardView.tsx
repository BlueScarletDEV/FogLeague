import React, { useState, useEffect } from 'react';
import { MOCK_LEADERBOARD } from '../data/dbdData';
import { EloBadge } from './EloBadge';
import { PlayerInspectModal } from './PlayerInspectModal';
import { Trophy, Skull, Shield, Search, Flame, Eye, Database } from 'lucide-react';
import { Player } from '../types';
import { fetchLiveLeaderboard } from '../lib/supabaseService';

import { useAuth } from '../context/AuthContext';

export const LeaderboardView: React.FC = () => {
  const { user } = useAuth();
  const [playersList, setPlayersList] = useState<Player[]>(MOCK_LEADERBOARD);
  const [isLiveFromDb, setIsLiveFromDb] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    fetchLiveLeaderboard().then((dbPlayers) => {
      if (dbPlayers && dbPlayers.length > 0) {
        setPlayersList(dbPlayers);
        setIsLiveFromDb(true);
      }
    });
  }, []);

  const filteredPlayers = playersList.filter((p) => {
    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'killer' && (p.role === 'killer' || p.role === 'flex')) ||
      (filterRole === 'survivor' && (p.role === 'survivor' || p.role === 'flex'));
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <Trophy className="w-6 h-6 text-faceit-orange" />
            <h1 className="text-2xl font-black uppercase text-white tracking-wide">
              Classement Officiel FogLeague (Saison 1)
            </h1>
            {isLiveFromDb && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>PostgreSQL Supabase Live</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Top des meilleurs joueurs compétitifs Dead by Daylight • Clique sur un joueur pour inspecter son profil radar
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher un joueur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1b1b20] border border-zinc-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-faceit-orange"
          />
        </div>
      </div>

      {/* Role Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            filterRole === 'all'
              ? 'bg-faceit-orange text-white shadow-faceit-glow'
              : 'bg-[#18181c] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Général (Tous)</span>
        </button>

        <button
          onClick={() => setFilterRole('killer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            filterRole === 'killer'
              ? 'bg-red-600 text-white shadow-blood-glow'
              : 'bg-[#18181c] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Skull className="w-3.5 h-3.5" />
          <span>Tueurs</span>
        </button>

        <button
          onClick={() => setFilterRole('survivor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            filterRole === 'survivor'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#18181c] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Survivants</span>
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#18181d] text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-16">Rang</th>
                <th className="py-3.5 px-4">Joueur</th>
                <th className="py-3.5 px-4 text-center">Rang de l'Épreuve</th>
                <th className="py-3.5 px-4">Points ELO</th>
                <th className="py-3.5 px-4">Spécialité</th>
                <th className="py-3.5 px-4 text-center">Winrate</th>
                <th className="py-3.5 px-4 text-center">Karma</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {filteredPlayers.map((player, index) => {
                const isMe = Boolean(user && (player.id === user.id || player.steamId === user.steamId));

                return (
                  <tr
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className={`transition-colors hover:bg-zinc-800/60 cursor-pointer ${
                      isMe ? 'bg-orange-950/20 border-l-4 border-faceit-orange' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-4 text-center font-mono font-black">
                      {index === 0 && <span className="text-yellow-400 text-base">🥇 #1</span>}
                      {index === 1 && <span className="text-zinc-300 text-base">🥈 #2</span>}
                      {index === 2 && <span className="text-amber-600 text-base">🥉 #3</span>}
                      {index > 2 && <span className="text-zinc-500">#{index + 1}</span>}
                    </td>

                    {/* Player Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{player.name}</span>
                            {isMe && (
                              <span className="text-[10px] bg-faceit-orange text-white px-1.5 py-0.2 rounded font-bold uppercase">
                                TOI
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-500 capitalize">
                            {player.role === 'flex' ? 'Flex (Tueur & Surv)' : player.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="py-4 px-4 text-center">
                      <EloBadge level={player.level} size="sm" showLabel />
                    </td>

                    {/* ELO */}
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {player.elo} <span className="text-zinc-500 text-xs">PTS</span>
                    </td>

                    {/* Main */}
                    <td className="py-4 px-4 text-xs text-zinc-300">
                      {player.mainKiller || player.mainSurvivor || 'Non spécifié'}
                    </td>

                    {/* Winrate */}
                    <td className="py-4 px-4 text-center font-mono text-xs font-semibold text-emerald-400">
                      {player.winRate}% ({player.matchesPlayed} matchs)
                    </td>

                    {/* Karma */}
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                        {player.karma}%
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlayer(player);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-faceit-orange hover:text-white text-zinc-400 transition-colors"
                        title="Inspecter le profil"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-16 px-4 bg-[#141417]">
              <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Aucun Joueur Classé pour le Moment
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                La Saison 1 est officiellement ouverte. Connecte-toi via Steam et dispute ton premier match classé pour inscrire ton nom en tête du classement !
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Modal */}
      <PlayerInspectModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
};
