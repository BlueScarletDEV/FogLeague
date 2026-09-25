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
  Activity,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  FileCheck,
  Info,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  CertifiedMatch,
  getCertifiedMatches,
  computeRadarAnalysis,
  clearMatches,
} from '../lib/matchStore';
import { MatchAuditModal } from './MatchAuditModal';
import { ScoreboardCertifierModal } from './ScoreboardCertifierModal';
import { soundManager } from '../lib/audioManager';

export const ProfileView: React.FC = () => {
  const { user } = useAuth();

  // Load certified matches from store
  const [matches, setMatches] = useState<CertifiedMatch[]>([]);
  const [selectedAuditMatch, setSelectedAuditMatch] = useState<CertifiedMatch | null>(null);
  const [isCertifyModalOpen, setIsCertifyModalOpen] = useState(false);
  const [activeStatTab, setActiveStatTab] = useState<string | null>(null);
  const [isVerifyingSteam, setIsVerifyingSteam] = useState(false);
  const [steamVerifyProof, setSteamVerifyProof] = useState<any | null>(null);

  // Load matches on mount or when user changes
  useEffect(() => {
    const list = getCertifiedMatches(user?.id);
    setMatches(list);
  }, [user?.id]);

  // Compute dynamic ELO and rank from matches
  const baseElo = user?.elo || 1200;
  const currentElo = matches.length > 0 ? matches[0].eloAfter : baseElo;
  const { currentLevel, progressPercent, nextLevelElo } = getLevelProgress(currentElo);

  // Compute radar mathematically from real matches
  const radarAnalysis = computeRadarAnalysis(matches, user?.karma || 100);

  const handleMatchCertified = (newMatch: CertifiedMatch) => {
    const updated = [newMatch, ...matches];
    setMatches(updated);
  };

  const handleResetMatches = () => {
    if (window.confirm('Voulez-vous réinitialiser vos matchs enregistrés pour démarrer une phase de calibration vierge ?')) {
      soundManager.playBanSound();
      clearMatches(user?.id);
      setMatches([]);
    }
  };

  const handleVerifySteamLive = async () => {
    if (!user?.steamId) return;
    setIsVerifyingSteam(true);
    soundManager.playPickSound();

    try {
      const endpoint =
        window.location.port === '5173'
          ? 'http://localhost:3001/api/auth/steam/direct-lookup'
          : '/api/auth/steam/direct-lookup';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamId: user.steamId }),
      });
      const data = await res.json();
      setSteamVerifyProof(data);
      soundManager.playVictory();
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifyingSteam(false);
    }
  };

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
                  <span>SteamID: {user.steamId.slice(0, 7)}...{user.steamId.slice(-4)}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold">
                  Mode Invité
                </span>
              )}

              {/* VAC Status */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  user?.vacBanned
                    ? 'bg-red-950 text-red-400 border-red-800'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                }`}
              >
                {user?.vacBanned ? 'Bannissement VAC Détecté' : 'VAC: Conforme (0 ban)'}
              </span>

              {/* Sentinel verified */}
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
                Karma : {radarAnalysis.stats.karma}% (Audité)
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4 max-w-xl">
              Toutes les statistiques, pourcentages et historiques de cette fiche sont certifiés par le protocole d'arbitrage FogLeague et vérifiables par empreinte SHA-256.
            </p>

            {/* Level & Elo Progress */}
            <div className="space-y-1.5 max-w-md">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">
                  Progression vers le <strong className="text-faceit-orange">Rang {currentLevel + 1} de l'Épreuve</strong>
                </span>
                <span className="text-white font-bold">
                  {currentElo} / {nextLevelElo} ELO
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                <div
                  className="h-full bg-gradient-to-r from-faceit-orange to-orange-400 rounded-full transition-all duration-1000 shadow-faceit-glow"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Verification buttons */}
            <div className="mt-4 flex flex-wrap gap-2.5 justify-center md:justify-start">
              <button
                onClick={handleVerifySteamLive}
                disabled={isVerifyingSteam}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isVerifyingSteam ? 'Interrogation Valve...' : 'Audit Steam Direct'}</span>
              </button>

              <button
                onClick={() => setIsCertifyModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-faceit-glow transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Certifier un Match (Scoreboard)</span>
              </button>

              <button
                onClick={handleResetMatches}
                className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors flex items-center gap-1"
                title="Remettre les matchs à zéro pour calibrer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Réinitialiser</span>
              </button>
            </div>

            {/* Live Steam proof drawer if triggered */}
            {steamVerifyProof && (
              <div className="mt-3 p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Rapport d'Intégrité Valve SteamCommunity :</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Pseudo : <strong className="text-white">{steamVerifyProof.user?.name}</strong> • SteamID64 : <strong className="text-white">{steamVerifyProof.user?.steamId}</strong> • VAC Ban : <strong className="text-emerald-400">{steamVerifyProof.user?.vacBanned ? 'OUI' : 'NON (0 ban)'}</strong> • Trust : <strong className="text-emerald-400">{steamVerifyProof.user?.trustFactor}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spider Chart + Stats Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Spider Chart — 100% Calculated */}
        <div className="bg-[#141417] border border-zinc-800 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-faceit-orange" />
              <h3 className="font-black text-sm uppercase text-white tracking-wide">
                Radar d'Aptitude Certifié
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
              {radarAnalysis.isCalibrated ? 'ÉTALONNÉ' : 'CALIBRATION'}
            </span>
          </div>

          <RadarChart stats={radarAnalysis.stats} size={250} />

          {/* Dynamic caption — REAL count, no fake "50 parties" */}
          <div className="w-full text-center mt-3">
            <div className="text-xs text-zinc-300 font-semibold">
              Calculé sur <strong className="text-faceit-orange">{radarAnalysis.matchesCount} match(s)</strong> officiel(s) enregistré(s)
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Chaque axe correspond à la moyenne vérifiée de vos performances en jeu
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-faceit-orange" />
              <span>Taux de Victoire Certifié</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {winRate}%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              {winCount} victoires sur {matches.length} match(s) homologué(s)
            </div>
          </div>

          <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Skull className="w-4 h-4 text-red-400" />
              <span>Performance Létalité (Tueur)</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {radarAnalysis.stats.lethality}%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              {radarAnalysis.breakdown.lethality.formula}
            </div>
          </div>

          <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Performance Poursuite (Survivant)</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {radarAnalysis.stats.chase}%
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
              Audit Mathématique du Radar de Compétences (Transparence Totale)
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
              <div className="text-lg font-black text-white font-mono mt-0.5">{item.stat.value}%</div>
              <div className="text-[10px] text-zinc-500 mt-1 truncate">{item.stat.formula}</div>
            </button>
          ))}
        </div>

        {/* Expanded Details */}
        {activeStatTab && (
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs space-y-1.5 animate-fadeIn">
            <div className="font-bold text-faceit-orange uppercase tracking-wide">
              Détails du calcul pour l'axe : {activeStatTab.toUpperCase()}
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

      {/* Match History with SHA-256 Audit Inspection */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5 text-faceit-orange" />
            <span>Historique des Matchs Compétitifs Certifiés</span>
          </h3>

          <button
            onClick={() => setIsCertifyModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-faceit-glow transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ajouter / Certifier</span>
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12 bg-[#18181d] rounded-xl border border-dashed border-zinc-800 p-6 space-y-3">
            <FileCheck className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="font-bold text-white text-sm">Aucun match certifié enregistré</div>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Rejoins la file classée pour jouer un match officiel, ou certifie un rapport de fin de partie Dead by Daylight pour démarrer ton calibrage.
            </p>
            <button
              onClick={() => setIsCertifyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-faceit-glow"
            >
              Certifier un premier Match
            </button>
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

                  {/* Verification button */}
                  <button
                    onClick={() => {
                      soundManager.playPickSound();
                      setSelectedAuditMatch(match);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors border border-zinc-700/60"
                    title="Inspecter le certificat d'arbitrage et l'empreinte SHA-256"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-faceit-orange" />
                    <span>Vérifier Preuve</span>
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

      {/* Certifier Modal */}
      <ScoreboardCertifierModal
        isOpen={isCertifyModalOpen}
        onClose={() => setIsCertifyModalOpen(false)}
        currentElo={currentElo}
        userId={user?.id}
        onMatchCertified={handleMatchCertified}
      />
    </div>
  );
};
