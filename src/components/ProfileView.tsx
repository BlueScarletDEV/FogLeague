import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EloBadge } from './EloBadge';
import { RadarChart } from './RadarChart';
import { getLevelProgress } from '../lib/eloCalculator';
import {
  Trophy,
  Shield,
  Skull,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Award,
  ShieldCheck,
  ExternalLink,
  Info,
  Swords,
  Layers,
} from 'lucide-react';
import {
  CertifiedMatch,
  getCertifiedMatches,
  computeRadarAnalysis,
} from '../lib/matchStore';
import { MatchAuditModal } from './MatchAuditModal';
import { soundManager } from '../lib/audioManager';

interface ProfileViewProps {
  onFindMatch?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onFindMatch }) => {
  const { user } = useAuth();

  // Load certified matches from store
  const [matches, setMatches] = useState<CertifiedMatch[]>([]);
  const [selectedAuditMatch, setSelectedAuditMatch] = useState<CertifiedMatch | null>(null);
  const [activeStatTab, setActiveStatTab] = useState<string | null>(null);

  // Load matches on mount or when user changes
  useEffect(() => {
    const list = getCertifiedMatches(user?.id);
    setMatches(list);
  }, [user?.id]);

  // Compute dynamic ELO and rank from matches
  const baseElo = user?.elo || 1200;
  const currentElo = matches.length > 0 ? matches[0].eloAfter : baseElo;
  const { currentLevel, progressPercent, nextLevelElo, isCalibrating } = getLevelProgress(
    currentElo,
    matches.length
  );

  // Compute radar mathematically from real matches
  const radarAnalysis = computeRadarAnalysis(matches, user?.karma || 100);

  const winCount = matches.filter((m) => m.isWin).length;
  const winRate = matches.length > 0 ? Number(((winCount / matches.length) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      {/* Profile Card Banner */}
      <div className="bg-[#141417] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-faceit-orange/15 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar with Mist Rank Level */}
          <div className="relative">
            <img
              src={user?.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
              alt={user?.name || 'Joueur'}
              className="w-28 h-28 rounded-2xl object-cover border-2 border-zinc-700 shadow-xl"
            />
            <div className="absolute -bottom-3 -right-3">
              <EloBadge level={currentLevel} size="lg" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl font-black uppercase text-white tracking-wide">
                {user?.name || 'Joueur_FogLeague'}
              </h1>

              {/* Steam Verified Badge */}
              {user?.steamConnected ? (
                <a
                  href={`https://steamcommunity.com/profiles/${user.steamId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-0.5 rounded-full bg-[#1b2838] text-[#66c0f4] border border-[#2a475e] text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-[#2a475e] transition-colors"
                  title="Voir le profil officiel Valve Steam"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#66c0f4]" />
                  <span>SteamID: {user.steamId ? `${user.steamId.slice(0, 7)}...${user.steamId.slice(-4)}` : 'Vérifié'}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-mono">
                  Mode Invité
                </span>
              )}

              {/* VAC status */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  user?.vacBanned
                    ? 'bg-red-950 text-red-400 border-red-800'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                }`}
              >
                {user?.vacBanned ? 'Bannissement VAC Détecté' : 'VAC: Conforme (0 ban)'}
              </span>

              {/* Karma status */}
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
                Karma : {radarAnalysis.stats.karma}% (Audité)
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4 max-w-xl">
              Fiche officielle certifiée par le protocole d'arbitrage FogLeague. Les scores et historiques sont scellés par signature cryptographique SHA-256.
            </p>

            {/* Level & Elo Progress */}
            <div className="space-y-1.5 max-w-md">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">
                  {isCalibrating ? (
                    <strong className="text-amber-400">Phase de Placement (0/5 Matchs)</strong>
                  ) : (
                    <>
                      Progression vers le <strong className="text-faceit-orange">Rang {currentLevel + 1}</strong>
                    </>
                  )}
                </span>
                <span className="text-white font-bold">
                  {currentElo} {isCalibrating ? 'ELO (Initial)' : `/ ${nextLevelElo} ELO`}
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                <div
                  className="h-full bg-gradient-to-r from-faceit-orange to-orange-400 rounded-full transition-all duration-1000 shadow-faceit-glow"
                  style={{ width: `${isCalibrating ? 15 : progressPercent}%` }}
                />
              </div>
            </div>

            {/* Call to action */}
            {onFindMatch && (
              <div className="mt-4 flex flex-wrap gap-2.5 justify-center md:justify-start">
                <button
                  onClick={onFindMatch}
                  className="px-4 py-2 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-faceit-glow transition-all"
                >
                  <Swords className="w-4 h-4" />
                  <span>Trouver un Match Officiel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Grid: Radar + Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart Card */}
        <div className="bg-[#141417] border border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-between shadow-xl">
          <div className="w-full flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-faceit-orange" />
                <span>Radar d'Aptitude</span>
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">Performances mesurées en match</p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                radarAnalysis.isCalibrated
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950/80 text-amber-400 border-amber-800'
              }`}
            >
              {radarAnalysis.isCalibrated ? 'ÉTALONNÉ' : 'EN CALIBRAGE'}
            </span>
          </div>

          <RadarChart stats={radarAnalysis.stats} size={250} />

          {/* Dynamic caption */}
          <div className="w-full text-center mt-3">
            <div className="text-xs text-zinc-300 font-semibold">
              Calculé sur <strong className="text-faceit-orange">{radarAnalysis.matchesCount} match(s)</strong> officiel(s) enregistré(s)
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {radarAnalysis.matchesCount === 0
                ? 'Jouez vos 5 premiers matchs en file classée pour débloquer votre graphique'
                : 'Moyenne vérifiée de vos performances réelles en jeu'}
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-faceit-orange" />
              <span>Taux de Victoire</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {matches.length === 0 ? '—' : `${winRate}%`}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              {matches.length === 0
                ? 'Non étalonné (0 match)'
                : `${winCount} victoires sur ${matches.length} match(s)`}
            </div>
          </div>

          <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Skull className="w-4 h-4 text-red-400" />
              <span>Létalité (Tueur)</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {matches.length === 0 ? '—' : `${radarAnalysis.stats.lethality}%`}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              {radarAnalysis.breakdown.lethality.formula}
            </div>
          </div>

          <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Poursuite (Survivant)</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {matches.length === 0 ? '—' : `${radarAnalysis.stats.chase}%`}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              {radarAnalysis.breakdown.chase.formula}
            </div>
          </div>

          <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Karma & Fair-Play</span>
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {radarAnalysis.stats.karma}%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              {radarAnalysis.breakdown.karma.formula}
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Breakdown Accordion — COMPLETE VERIFIABILITY */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-faceit-orange" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              Détail des Compétences Compétitives
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            Cliquez sur un axe pour inspecter la formule
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'chase', label: 'Poursuite', stat: radarAnalysis.breakdown.chase },
            { key: 'macro', label: 'Générateurs', stat: radarAnalysis.breakdown.macro },
            { key: 'altruism', label: 'Altruisme', stat: radarAnalysis.breakdown.altruism },
            { key: 'lethality', label: 'Létalité', stat: radarAnalysis.breakdown.lethality },
            { key: 'vision', label: 'Vision', stat: radarAnalysis.breakdown.vision },
            { key: 'karma', label: 'Fair-Play', stat: radarAnalysis.breakdown.karma },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                soundManager.playPickSound();
                setActiveStatTab(activeStatTab === item.key ? null : item.key);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeStatTab === item.key
                  ? 'bg-faceit-orange/15 border-faceit-orange'
                  : 'bg-[#18181d] border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="text-[10px] text-zinc-400 font-bold uppercase">{item.label}</div>
              <div className="text-lg font-black text-white font-mono mt-0.5">
                {matches.length === 0 && item.key !== 'karma' ? '—' : `${item.stat.value}%`}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1 truncate">{item.stat.formula}</div>
            </button>
          ))}
        </div>

        {/* Expanded Details */}
        {activeStatTab && (
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs space-y-1.5 animate-fadeIn">
            <div className="font-bold text-faceit-orange uppercase tracking-wide">
              Détails du calcul : {activeStatTab.toUpperCase()}
            </div>
            <div className="text-zinc-300">
              {(radarAnalysis.breakdown as any)[activeStatTab]?.details}
            </div>
            <div className="text-zinc-500 font-mono text-[11px]">
              Formule appliquée : {(radarAnalysis.breakdown as any)[activeStatTab]?.formula}
            </div>
          </div>
        )}
      </div>

      {/* Match History */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5 text-faceit-orange" />
            <span>Historique des Matchs Compétitifs Officiels</span>
          </h3>

          <span className="text-xs font-mono text-zinc-400">
            {matches.length} match(s) homologué(s)
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12 bg-[#18181d] rounded-xl border border-dashed border-zinc-800 p-6 space-y-3">
            <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="font-bold text-white text-sm">Aucun match compétitif enregistré</div>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Rejoignez la file de matchmaking pour disputer votre premier match officiel DBD et débuter votre étalonnage compétitif.
            </p>
            {onFindMatch && (
              <button
                onClick={onFindMatch}
                className="px-5 py-2.5 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-faceit-glow"
              >
                Lancer la Recherche de Match
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="p-4 rounded-xl bg-[#19191d] border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      match.isWin
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {match.isWin ? 'V' : 'D'}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{match.modeLabel}</span>
                      <span className="text-xs font-normal text-zinc-400">• {match.map}</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                        {match.id}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {match.dateFormatted} • {match.metrics.characterPlayed} • {match.metrics.bloodpointsScore.toLocaleString()} BP
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div
                    className={`font-mono font-black text-sm flex items-center gap-1 ${
                      match.isWin ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    <span>{match.eloChange > 0 ? `+${match.eloChange}` : match.eloChange} ELO</span>
                    {match.isWin ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playPickSound();
                      setSelectedAuditMatch(match);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors border border-zinc-700/60"
                    title="Inspecter le certificat d'arbitrage et l'empreinte SHA-256"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-faceit-orange" />
                    <span>Certificat SHA-256</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Inspection Modal */}
      <MatchAuditModal
        match={selectedAuditMatch}
        isOpen={Boolean(selectedAuditMatch)}
        onClose={() => setSelectedAuditMatch(null)}
      />
    </div>
  );
};
