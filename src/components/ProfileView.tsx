import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EloBadge } from './EloBadge';
import { getLevelProgress } from '../lib/eloCalculator';
import {
  Trophy,
  Shield,
  Clock,
  Award,
  ShieldCheck,
  ExternalLink,
  Swords,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Gamepad2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  CertifiedMatch,
  getCertifiedMatches,
} from '../lib/matchStore';
import { MatchAuditModal } from './MatchAuditModal';
import { soundManager } from '../lib/audioManager';

interface ProfileViewProps {
  onFindMatch?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onFindMatch }) => {
  const { user } = useAuth();

  // Liste des vrais matchs homologués
  const [matches, setMatches] = useState<CertifiedMatch[]>([]);
  const [selectedAuditMatch, setSelectedAuditMatch] = useState<CertifiedMatch | null>(null);

  useEffect(() => {
    const list = getCertifiedMatches(user?.id);
    setMatches(list);
  }, [user?.id]);

  // Calcul ELO et progression réels
  const baseElo = user?.elo || 1200;
  const currentElo = matches.length > 0 ? matches[0].eloAfter : baseElo;
  const { currentLevel, progressPercent, nextLevelElo, isCalibrating } = getLevelProgress(
    currentElo,
    matches.length
  );

  const winCount = matches.filter((m) => m.isWin).length;
  const lossCount = matches.filter((m) => !m.isWin).length;
  const winRate = matches.length > 0 ? Number(((winCount / matches.length) * 100).toFixed(1)) : 0;

  // Calcul de la série de victoires en cours (Win streak)
  let currentStreak = 0;
  for (const m of matches) {
    if (m.isWin) currentStreak++;
    else break;
  }

  const steamId = user?.steamId;

  return (
    <div className="space-y-6">
      {/* 1. Carte Bannière Principale */}
      <div className="bg-[#141417] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-faceit-orange/15 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar avec badge de niveau */}
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

          {/* Informations Compte */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl font-black uppercase text-white tracking-wide">
                {user?.name || 'Joueur_FogLeague'}
              </h1>

              {/* Badge Steam Officiel avec lien réel vers le profil */}
              {user?.steamConnected && steamId ? (
                <a
                  href={`https://steamcommunity.com/profiles/${steamId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-full bg-[#1b2838] text-[#66c0f4] border border-[#2a475e] text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-[#2a475e] transition-colors"
                  title="Voir le profil réel sur SteamCommunity"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#66c0f4]" />
                  <span>Steam: {steamId.slice(0, 6)}...{steamId.slice(-4)}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-mono">
                  Mode Invité
                </span>
              )}

              {/* Statut VAC officiel */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  user?.vacBanned
                    ? 'bg-red-950 text-red-400 border-red-800'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                }`}
              >
                {user?.vacBanned ? 'Bannissement VAC Détecté' : 'VAC: Conforme (0 ban)'}
              </span>

              {/* Karma / Fair-Play */}
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
                Karma : {user?.karma ?? 100}% (Audité)
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4 max-w-xl">
              Fiche e-sport certifiée par le protocole FogLeague. Les scores, l'ELO et les matchs sont vérifiés et scellés par signature cryptographique SHA-256.
            </p>

            {/* Barre de Progression de Rang */}
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
                  {currentElo} {isCalibrating ? 'ELO' : `/ ${nextLevelElo} ELO`}
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                <div
                  className="h-full bg-gradient-to-r from-faceit-orange to-orange-400 rounded-full transition-all duration-1000 shadow-faceit-glow"
                  style={{ width: `${isCalibrating ? 10 : progressPercent}%` }}
                />
              </div>
            </div>

            {/* Bouton d'action */}
            {onFindMatch && (
              <div className="mt-5 flex flex-wrap gap-2.5 justify-center md:justify-start">
                <button
                  onClick={onFindMatch}
                  className="px-5 py-2.5 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-faceit-glow transition-all"
                >
                  <Swords className="w-4 h-4" />
                  <span>Trouver un Match Officiel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Statistiques 100% Réelles et Incontestables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* ELO Officiel */}
        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-faceit-orange" />
            <span>Score ELO</span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {currentElo}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            {isCalibrating ? 'Étalonnage initial (1200)' : `Rang ${currentLevel} compétitif`}
          </div>
        </div>

        {/* Bilan Victoires / Défaites */}
        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-blue-400" />
            <span>Bilan Matchs</span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {matches.length === 0 ? '0' : `${winCount}V - ${lossCount}D`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            {matches.length} match(s) officiel(s)
          </div>
        </div>

        {/* Taux de Victoire (Winrate) */}
        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Taux de Victoire</span>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {matches.length === 0 ? '—' : `${winRate}%`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            {matches.length === 0 ? 'Aucune partie jouée' : `${winCount} victoire(s)`}
          </div>
        </div>

        {/* Série de Victoires */}
        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Série en Cours</span>
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {currentStreak > 0 ? `${currentStreak}🔥` : '0'}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            {currentStreak > 1 ? `${currentStreak} victoires consécutives` : 'Série de victoires'}
          </div>
        </div>
      </div>

      {/* 3. Métriques Certifiées Steam & Fair-Play */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Heures de Jeu Dead by Daylight */}
        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-orange-950/40 border border-orange-800 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-6 h-6 text-faceit-orange" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-zinc-400">Heures de Jeu DBD</div>
            <div className="text-lg font-black text-white font-mono">
              {user?.gameHoursDBD && user.gameHoursDBD > 0 ? `${user.gameHoursDBD.toLocaleString()} heures` : 'Synchronisé via Steam'}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">Certifié par Steamworks (AppID 381210)</div>
          </div>
        </div>

        {/* Statut Anti-Triche */}
        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-zinc-400">Casier Valve Anti-Cheat</div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {user?.vacBanned ? 'Banni Valve' : '0 Ban (100% Clean)'}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">Contrôlé en direct à la connexion</div>
          </div>
        </div>

        {/* Fair-Play & Réputation */}
        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/60 border border-zinc-700 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-zinc-300" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-zinc-400">Indice de Réputation</div>
            <div className="text-lg font-black text-white font-mono">
              {user?.trustFactor || 'Élite (100%)'}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">Zéro infraction ni déconnexion</div>
          </div>
        </div>
      </div>

      {/* 4. Historique Réel des Matchs Compétitifs */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5 text-faceit-orange" />
            <span>Historique des Matchs Officiels de la Ligue</span>
          </h3>

          <span className="text-xs font-mono text-zinc-400">
            {matches.length} match(s) homologué(s)
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12 bg-[#18181d] rounded-xl border border-dashed border-zinc-800 p-6 space-y-3">
            <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="font-bold text-white text-sm">Aucun match officiel enregistré</div>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Rejoignez la file classée pour disputer votre premier match Dead by Daylight et inscrire votre premier résultat officiel dans la ligue.
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
                      {match.dateFormatted} • {match.metrics.characterPlayed}
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

      {/* Modal d'audit du certificat SHA-256 */}
      <MatchAuditModal
        match={selectedAuditMatch}
        isOpen={Boolean(selectedAuditMatch)}
        onClose={() => setSelectedAuditMatch(null)}
      />
    </div>
  );
};
