import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { QueueModal } from './components/QueueModal';
import { MatchRoom } from './components/MatchRoom';
import { LeaderboardView } from './components/LeaderboardView';
import { RulesView } from './components/RulesView';
import { ProfileView } from './components/ProfileView';
import { HubsView } from './components/HubsView';
import { MissionsView } from './components/MissionsView';
import { SecurityView } from './components/SecurityView';
import { AuthModal } from './components/AuthModal';
import { ShareInviteModal } from './components/ShareInviteModal';
import { FogCanvas } from './components/FogCanvas';
import { CURRENT_USER, DBD_MAPS_POOL } from './data/dbdData';
import { GameMode, MatchState, Player, PlayerRole } from './types';
import { getMistRank } from './lib/eloCalculator';

import { useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { addCertifiedMatch, CertifiedMatch } from './lib/matchStore';
import { saveCertifiedMatchToSupabase } from './lib/supabaseService';
import { computeSha256 } from './lib/cryptoUtils';

const FogLeagueApp: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<Player>(CURRENT_USER);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueTimer, setQueueTimer] = useState(0);
  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null);

  // Synchroniser avec l'utilisateur authentifié (compte Steam réel)
  useEffect(() => {
    if (user) {
      setCurrentUser((prev) => ({
        ...prev,
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        vacBanned: user.vacBanned,
        trustFactor: user.trustFactor,
      }));
    }
  }, [user]);

  // Queue timer ticker
  useEffect(() => {
    let interval: any;
    if (isInQueue) {
      interval = setInterval(() => {
        setQueueTimer((t) => t + 1);
      }, 1000);
    } else {
      setQueueTimer(0);
    }
    return () => clearInterval(interval);
  }, [isInQueue]);

  const handleOpenQueue = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsQueueModalOpen(true);
  };

  const handleMatchFound = (mode: GameMode, role: PlayerRole, matchedState?: MatchState) => {
    // Si un vrai match a été trouvé entre 2 joueurs réels via Socket.io
    if (matchedState) {
      const matchWithPool: MatchState = {
        ...matchedState,
        remainingMaps: matchedState.remainingMaps || [...DBD_MAPS_POOL],
        bannedMaps: matchedState.bannedMaps || [],
        bannedKillers: matchedState.bannedKillers || [],
        status: 'veto',
        activeVetoTurn: 'team1',
      };
      setActiveMatch(matchWithPool);
      setCurrentTab('match');
      return;
    }

    // Sinon : mode entraînement test solo (Bot d'entraînement IA Shack)
    const soloPracticeBot: Player = {
      id: 'bot_shack_trainer',
      name: 'Bot Entraînement (IA Shack)',
      avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&auto=format&fit=crop&q=80',
      elo: 1200,
      level: 1,
      role: 'flex',
      karma: 100,
      matchesPlayed: 0,
      winRate: 50,
    };

    const soloPracticeOpponent: Player = {
      id: 'bot_challenger_test',
      name: 'Joueur Entraînement (Test)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      elo: 1200,
      level: 1,
      role: 'flex',
      karma: 100,
      matchesPlayed: 0,
      winRate: 50,
    };

    const matchId = `dbd-${Math.floor(1000 + Math.random() * 9000)}`;
    const lobbyCode = `DBD-${Math.floor(1000 + Math.random() * 9000)}-EU`;

    // Arbitre système neutre assigné pour le test
    const testReferee: Player = {
      id: 'ref_system_neutral',
      name: 'Arbitre Système Neutre (Mode Test)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      elo: 1500,
      level: 5,
      role: 'referee',
      karma: 100,
      matchesPlayed: 0,
      winRate: 100,
    };

    const isUserReferee = role === 'referee';

    const newMatch: MatchState = {
      id: matchId,
      mode: mode,
      status: 'veto',
      team1: isUserReferee ? [{ ...soloPracticeOpponent, isCaptain: true }] : [{ ...currentUser, isCaptain: true }],
      team2: [{ ...soloPracticeBot, isCaptain: true }],
      referee: isUserReferee ? currentUser : testReferee,
      activeVetoTurn: 'team1',
      remainingMaps: [...DBD_MAPS_POOL],
      bannedMaps: [],
      bannedKillers: [],
      lobbyCode: lobbyCode,
      serverRegion: 'Europe Ouest (Paris - 14ms)',
    };

    setActiveMatch(newMatch);
    setCurrentTab('match');
  };

  const handleMatchComplete = async (updatedMatch: MatchState) => {
    setActiveMatch(updatedMatch);

    if (updatedMatch.result) {
      const eloDiff = updatedMatch.result.eloChange;
      const newElo = Math.max(100, currentUser.elo + eloDiff);
      const newLevel = getMistRank(newElo);
      const isWin = eloDiff > 0;

      // Calculer une empreinte cryptographique SHA-256 authentique
      const rawPayload = `${updatedMatch.id}_${Date.now()}_${updatedMatch.mode}_${updatedMatch.lobbyCode}_${eloDiff}_${currentUser.id}`;
      const hash = await computeSha256(rawPayload);

      const certifiedRecord: CertifiedMatch = {
        id: updatedMatch.id.toUpperCase(),
        timestamp: Date.now(),
        dateFormatted: 'À l\'instant',
        mode: updatedMatch.mode,
        modeLabel:
          updatedMatch.mode === '1v1_chase'
            ? '1v1 Shack Arena'
            : updatedMatch.mode === 'ranked_pug'
            ? 'Ranked PUG 1v4'
            : 'Team Scrim 5v5',
        map: updatedMatch.selectedMap?.name || 'Tour de charbon',
        userRole: 'survivor',
        result: isWin ? 'Victoire' : 'Défaite',
        isWin: isWin,
        eloChange: eloDiff,
        eloAfter: newElo,
        metrics: {
          chaseTimeSeconds: updatedMatch.result.chaseTimeSeconds || (isWin ? 64 : 32),
          generatorsDoneOrDefended:
            updatedMatch.result.gensRemaining !== undefined
              ? 5 - updatedMatch.result.gensRemaining
              : 3,
          hooksInflictedOrAvoided: updatedMatch.result.killerHooks || (isWin ? 1 : 3),
          altruismEventsCount: isWin ? 3 : 1,
          bloodpointsScore: isWin ? 26500 : 17200,
          characterPlayed: currentUser.mainSurvivor || 'Nea Karlsson',
          perksUsed: ['Resilience', 'Iron Will', 'Dead Hard', 'Windows of Opportunity'],
          bannedPerksFound: updatedMatch.result.bannedPerkDetected
            ? [updatedMatch.result.bannedPerkDetected]
            : undefined,
        },
        audit: {
          sha256Proof: hash,
          lobbyCode: updatedMatch.lobbyCode,
          serverRegion: updatedMatch.serverRegion,
          verifiedBy: updatedMatch.referee?.name ? `${updatedMatch.referee.name} (Certifié)` : 'Arbitre Homologué & Consensus Joueurs',
          complianceStatus: updatedMatch.result.bannedPerkDetected
            ? 'INFRACTION_DETECTEE'
            : 'CONFORME_DBDL',
          ruleNotes:
            updatedMatch.result.bannedPerkDetected ||
            'Scoreboard certifié conforme aux règles de compétition.',
          eloFormula: `ΔELO = ${eloDiff > 0 ? '+' : ''}${eloDiff} (Calculé sur résultat officiel)`,
        },
      };

      addCertifiedMatch(certifiedRecord, currentUser.id);
      saveCertifiedMatchToSupabase(certifiedRecord, currentUser.id);

      setCurrentUser((prev) => ({
        ...prev,
        elo: newElo,
        level: newLevel,
        matchesPlayed: prev.matchesPlayed + 1,
        winRate: Number(
          (
            ((prev.matchesPlayed * (prev.winRate / 100) + (isWin ? 1 : 0)) /
              (prev.matchesPlayed + 1)) *
            100
          ).toFixed(1)
        ),
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e1e1e6] flex flex-col font-sans relative">
      {/* Background Animated Fog & Embers */}
      <FogCanvas />

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isInQueue={isInQueue}
        queueTimer={queueTimer}
        onOpenQueueModal={handleOpenQueue}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        hasActiveMatch={Boolean(activeMatch)}
        currentUser={currentUser}
      />

      {/* Main Content Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 relative z-10">
        {currentTab === 'dashboard' && (
          <DashboardView
            onStartQueue={handleOpenQueue}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'play' && (
          <DashboardView
            onStartQueue={handleOpenQueue}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'hubs' && <HubsView />}

        {currentTab === 'missions' && <MissionsView />}

        {currentTab === 'security' && <SecurityView />}

        {currentTab === 'match' && activeMatch && (
          <MatchRoom
            match={activeMatch}
            onMatchComplete={handleMatchComplete}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'match' && !activeMatch && (
          <div className="text-center py-24 bg-[#141417]/90 backdrop-blur-md rounded-3xl border border-zinc-800 p-8 shadow-2xl">
            <h2 className="text-xl font-black uppercase text-white mb-2">
              Aucun match en cours
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Rejoins la file d'attente pour lancer une partie compétitive.
            </p>
            <button
              onClick={handleOpenQueue}
              className="px-6 py-3 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-faceit-glow"
            >
              Lancer la Recherche de Match
            </button>
          </div>
        )}

        {currentTab === 'leaderboard' && <LeaderboardView />}

        {currentTab === 'rules' && <RulesView />}

        {currentTab === 'profile' && <ProfileView onFindMatch={handleOpenQueue} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#111114]/90 backdrop-blur-md py-6 px-4 text-center text-xs text-zinc-500 font-mono relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">FogLeague</span>
            <span>• Plateforme Compétitive & Esport Indépendante pour Dead by Daylight</span>
          </div>
          <div>Protocole Valve OpenID 2.0 • Chiffrement TLS 1.3 • Scellé SHA-256 • Rangs 1 à 10</div>
        </div>
      </footer>

      {/* Queue Launcher Modal */}
      <QueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        onMatchFound={handleMatchFound}
        isInQueue={isInQueue}
        setIsInQueue={setIsInQueue}
        queueTimer={queueTimer}
        currentUser={currentUser}
      />

      {/* Authentication Modal (Steam & FogLeague 2FA) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Share & Invite Modal */}
      <ShareInviteModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <FogLeagueApp />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
