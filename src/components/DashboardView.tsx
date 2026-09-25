import React from 'react';
import { Swords, Trophy, Users, Skull, Flame, ArrowRight, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

interface DashboardViewProps {
  onStartQueue: () => void;
  setCurrentTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartQueue,
  setCurrentTab,
}) => {
  const { stats } = useSocket();

  return (
    <div className="space-y-8">
      {/* Hero Banner FogLeague Style */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#17171b] via-[#1a171d] to-[#121215] border border-zinc-800 p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-faceit-orange/20 via-dbd-blood/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-faceit-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-faceit-orange/20 border border-faceit-orange/40 text-faceit-orange text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Saison 1 Compétitive Ouverte</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tight leading-none">
            L'ARÈNE COMPÉTITIVE DE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-faceit-orange to-red-500">
              DEAD BY DAYLIGHT
            </span>
          </h1>

          <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
            Fini le MMR masqué et les parties déséquilibrées. Rejoins la ligue, gravis les 10 Rangs de l'Épreuve, bannis les maps, configure tes builds et valide tes victoires de manière certifiée.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <button
              onClick={onStartQueue}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-faceit-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-black text-sm uppercase tracking-wider shadow-faceit-glow transition-all active:scale-95 flex items-center gap-3"
            >
              <Swords className="w-5 h-5" />
              <span>Lancer une Recherche de Match</span>
            </button>

            <button
              onClick={() => setCurrentTab('leaderboard')}
              className="px-6 py-4 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-bold text-sm uppercase tracking-wider border border-zinc-700 transition-colors flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-faceit-orange" />
              <span>Voir le Classement</span>
            </button>
          </div>
        </div>

        {/* Live stats ticker réels via Socket */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-wrap gap-6 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white font-bold">{stats.onlinePlayers}</span> Joueur(s) connecté(s) en direct
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-faceit-orange" />
            <span className="text-white font-bold">{stats.activeMatchesCount}</span> Match(s) actif(s)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{stats.inQueueCount}</span> Joueur(s) en file
          </div>
        </div>
      </div>

      {/* Game Modes Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Flame className="w-5 h-5 text-faceit-orange" />
            <span>Files Classées Disponibles</span>
          </h2>
          <span className="text-xs text-zinc-400">Matchmaking automatique équilibré</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: 1v1 */}
          <div
            onClick={onStartQueue}
            className="group relative rounded-2xl bg-[#141417] border border-zinc-800 hover:border-faceit-orange p-6 transition-all duration-300 hover:shadow-faceit-glow cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-950/40 border border-faceit-orange/40 text-faceit-orange flex items-center justify-center">
                  <Swords className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-faceit-orange text-white">
                  Instantané
                </span>
              </div>

              <h3 className="text-lg font-black text-white uppercase group-hover:text-faceit-orange transition-colors">
                1v1 Chase Arena
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Duel rapide 1 Tueur vs 1 Survivant sur le Shack. Chronomètre automatique, aucun temps mort. Idéal pour s'entraîner aux boucles.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-faceit-orange">
              <span>Lancer le Duel</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 2: 4v1 PUG */}
          <div
            onClick={onStartQueue}
            className="group relative rounded-2xl bg-[#141417] border border-zinc-800 hover:border-emerald-500 p-6 transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                  Compétitif
                </span>
              </div>

              <h3 className="text-lg font-black text-white uppercase group-hover:text-emerald-400 transition-colors">
                Ranked PUG 1v4
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                La vraie SoloQ compétitive de DBD. 1 Tueur vs 4 Survivants avec un système d'Elo équitable et ban des abus.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Lancer la file 4v1</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 3: 5v5 Scrim */}
          <div
            onClick={onStartQueue}
            className="group relative rounded-2xl bg-[#141417] border border-zinc-800 hover:border-red-500 p-6 transition-all duration-300 hover:shadow-blood-glow cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-600/40 text-red-500 flex items-center justify-center">
                  <Skull className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-red-950 text-red-400 border border-red-700">
                  Équipe 5v5
                </span>
              </div>

              <h3 className="text-lg font-black text-white uppercase group-hover:text-red-400 transition-colors">
                Team Scrim DBDL
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Format miroir officiel pour équipes et tournois. Matchs aller-retour avec calcul automatique des points de crochets.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-red-400">
              <span>Créer un Scrim</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Tournament Banner */}
      <div className="p-6 rounded-2xl bg-[#151519] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shrink-0">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-500 font-mono">
              Événement Communautaire
            </span>
            <h3 className="text-lg font-black text-white uppercase">
              Shack Masters Cup #1 • Tournoi Communautaire Ouvert
            </h3>
            <p className="text-xs text-zinc-400">
              Inscription gratuite ouverte à tous les joueurs classés. Badges de profil exclusifs, gloire au classement et rôle Discord officiel.
            </p>
          </div>
        </div>

        <button
          onClick={onStartQueue}
          className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider transition-colors shrink-0 shadow-lg"
        >
          Rejoindre le Tournoi
        </button>
      </div>
    </div>
  );
};
