import React, { useState, useEffect } from 'react';
import { GameMode, MatchState, Player, PlayerRole } from '../types';
import { Swords, Shield, Skull, Users, Check, X, Flame } from 'lucide-react';
import { soundManager } from '../lib/audioManager';
import { useSocket } from '../context/SocketContext';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchFound: (mode: GameMode, role: PlayerRole, matchedState?: MatchState) => void;
  isInQueue: boolean;
  setIsInQueue: (val: boolean) => void;
  queueTimer: number;
  currentUser: Player;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  onClose,
  onMatchFound,
  isInQueue,
  setIsInQueue,
  queueTimer,
  currentUser,
}) => {
  const { joinQueue, leaveQueue, pendingMatchFound, clearPendingMatch, stats } = useSocket();
  const [selectedMode, setSelectedMode] = useState<GameMode>('1v1_chase');
  const [selectedRole, setSelectedRole] = useState<PlayerRole>('flex');
  const [matchFound, setMatchFound] = useState(false);
  const [acceptTimer, setAcceptTimer] = useState(10);
  const [acceptedPlayers, setAcceptedPlayers] = useState(0);

  // Détection d'un vrai match via WebSocket
  useEffect(() => {
    if (pendingMatchFound) {
      setMatchFound(true);
      setAcceptTimer(10);
      setAcceptedPlayers(2);
    }
  }, [pendingMatchFound]);

  // Accept timer countdown with ticks
  useEffect(() => {
    let interval: any;
    if (matchFound && acceptTimer > 0) {
      interval = setInterval(() => {
        soundManager.playTick();
        setAcceptTimer((t) => t - 1);
      }, 1000);
    } else if (matchFound && acceptTimer === 0) {
      handleAcceptMatch();
    }
    return () => clearInterval(interval);
  }, [matchFound, acceptTimer]);

  if (!isOpen) return null;

  const handleStartQueue = () => {
    soundManager.playPickSound();
    setIsInQueue(true);
    setMatchFound(false);
    joinQueue(currentUser, selectedMode, selectedRole);
  };

  const handleCancelQueue = () => {
    soundManager.playBanSound();
    setIsInQueue(false);
    setMatchFound(false);
    leaveQueue();
    clearPendingMatch();
  };

  const handleAcceptMatch = () => {
    soundManager.playVictory();
    setMatchFound(false);
    setIsInQueue(false);
    if (pendingMatchFound) {
      onMatchFound(pendingMatchFound.match.mode, selectedRole, pendingMatchFound.match);
      clearPendingMatch();
    } else {
      onMatchFound(selectedMode, selectedRole);
    }
    onClose();
  };

  // Lancer un match test immédiat (utile si on teste seul sans second joueur)
  const handleStartSoloTraining = () => {
    soundManager.playVictory();
    setIsInQueue(false);
    setMatchFound(false);
    leaveQueue();
    clearPendingMatch();
    onMatchFound(selectedMode, selectedRole);
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  const opponentPlayer = pendingMatchFound
    ? (pendingMatchFound.match.team1[0]?.id === currentUser.id
        ? pendingMatchFound.match.team2[0]
        : pendingMatchFound.match.team1[0])
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#131316] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Match Ready Overlay (Faceit Popup) */}
        {matchFound ? (
          <div className="p-8 text-center space-y-6 animate-scaleIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-faceit-orange/20 border-2 border-faceit-orange flex items-center justify-center shadow-faceit-glow animate-bounce">
              <Swords className="w-10 h-10 text-faceit-orange" />
            </div>

            <div>
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-faceit-orange">
                Salle Prête • {selectedMode === '1v1_chase' ? '1v1 Shack Duel' : 'Ranked 4v1'}
              </span>
              <h2 className="text-3xl font-black uppercase text-white mt-1">
                MATCH TROUVÉ !
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Confirme ta présence pour entrer dans la salle de Veto
              </p>
            </div>

            {/* Vrai Adversaire Connecté */}
            {opponentPlayer && (
              <div className="flex items-center justify-center gap-3 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-700 max-w-sm mx-auto shadow-inner animate-fadeIn">
                <img
                  src={opponentPlayer.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                  alt={opponentPlayer.name}
                  className="w-11 h-11 rounded-xl border border-faceit-orange/50 object-cover"
                />
                <div className="text-left">
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{opponentPlayer.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                      Adversaire Réel
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    {opponentPlayer.elo} ELO • {opponentPlayer.role === 'killer' ? 'Tueur' : opponentPlayer.role === 'survivor' ? 'Survivant' : 'Flex'}
                  </div>
                </div>
              </div>
            )}

            {/* Accept Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>Temps restant</span>
                <span className="text-faceit-orange font-bold">{acceptTimer}s</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-faceit-orange transition-all duration-1000 ease-linear"
                  style={{ width: `${(acceptTimer / 10) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                Joueurs prêts : {acceptedPlayers} / {selectedMode === '1v1_chase' ? 2 : 5}
              </div>
            </div>

            {/* Accept Button */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={handleAcceptMatch}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Check className="w-5 h-5" />
                <span>ACCEPTER LE MATCH</span>
              </button>
              <button
                onClick={handleCancelQueue}
                className="px-5 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase transition-colors"
              >
                Refuser
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#17171a]">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-faceit-orange" />
                <h3 className="text-base font-black uppercase text-white tracking-wide">
                  Matchmaking Compétitif
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
              
              {/* Game Mode Selection */}
              <div>
                <label className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-2.5 block">
                  1. Sélectionne le Format de Jeu
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  {/* 1v1 Chase */}
                  <div
                    onClick={() => {
                      if (!isInQueue) {
                        soundManager.playPickSound();
                        setSelectedMode('1v1_chase');
                      }
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedMode === '1v1_chase'
                        ? 'bg-orange-950/40 border-faceit-orange shadow-faceit-glow'
                        : 'bg-[#18181c] border-zinc-800 hover:border-zinc-700'
                    } ${isInQueue ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Swords className="w-5 h-5 text-faceit-orange" />
                      <span className="text-[10px] uppercase font-bold bg-faceit-orange/20 text-faceit-orange px-1.5 py-0.5 rounded">
                        2 Joueurs
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white">1v1 Chase Arena</div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Duel au Shack, chrono instantané
                    </div>
                  </div>

                  {/* 4v1 Ranked */}
                  <div
                    onClick={() => {
                      if (!isInQueue) {
                        soundManager.playPickSound();
                        setSelectedMode('ranked_pug');
                      }
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedMode === 'ranked_pug'
                        ? 'bg-orange-950/40 border-faceit-orange shadow-faceit-glow'
                        : 'bg-[#18181c] border-zinc-800 hover:border-zinc-700'
                    } ${isInQueue ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <span className="text-[10px] uppercase font-bold bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                        5 Joueurs
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white">Ranked PUG 1v4</div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      SoloQ / DuoQ avec vrai classement Elo
                    </div>
                  </div>

                  {/* 5v5 Scrim */}
                  <div
                    onClick={() => {
                      if (!isInQueue) {
                        soundManager.playPickSound();
                        setSelectedMode('team_scrim');
                      }
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedMode === 'team_scrim'
                        ? 'bg-orange-950/40 border-faceit-orange shadow-faceit-glow'
                        : 'bg-[#18181c] border-zinc-800 hover:border-zinc-700'
                    } ${isInQueue ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Skull className="w-5 h-5 text-red-500" />
                      <span className="text-[10px] uppercase font-bold bg-red-950/80 text-red-400 px-1.5 py-0.5 rounded border border-red-800">
                        10 Joueurs
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white">Team Scrim DBDL</div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Tournoi miroir officiel par équipes
                    </div>
                  </div>

                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-2.5 block">
                  2. Choisis ton Rôle
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    disabled={isInQueue}
                    onClick={() => {
                      soundManager.playPickSound();
                      setSelectedRole('killer');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'killer'
                        ? 'bg-red-950/60 border-red-500 text-red-400 shadow-blood-glow'
                        : 'bg-[#18181c] border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Skull className="w-4 h-4" />
                    <span>Tueur</span>
                  </button>

                  <button
                    disabled={isInQueue}
                    onClick={() => {
                      soundManager.playPickSound();
                      setSelectedRole('survivor');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'survivor'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-400'
                        : 'bg-[#18181c] border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Survivant</span>
                  </button>

                  <button
                    disabled={isInQueue}
                    onClick={() => {
                      soundManager.playPickSound();
                      setSelectedRole('flex');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'flex'
                        ? 'bg-orange-950/60 border-faceit-orange text-faceit-orange'
                        : 'bg-[#18181c] border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Swords className="w-4 h-4" />
                    <span>Flex</span>
                  </button>

                  <button
                    disabled={isInQueue}
                    onClick={() => {
                      soundManager.playPickSound();
                      setSelectedRole('referee');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'referee'
                        ? 'bg-amber-950/70 border-amber-500 text-amber-400 shadow-lg shadow-amber-950'
                        : 'bg-[#18181c] border-zinc-800 text-zinc-400 hover:text-amber-300'
                    }`}
                  >
                    <span className="text-sm">⚖️</span>
                    <span>Arbitre</span>
                  </button>
                </div>

                {/* Info role Arbitre */}
                {selectedRole === 'referee' && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                    <span className="text-base">⚖️</span>
                    <div>
                      <strong className="text-white font-bold">Rôle Arbitre Spectateur :</strong> Vous rejoindrez le slot spectateur officiel du salon DBD. Vous superviserez le match et validerez le score en 1 clic.
                      <div className="text-amber-400 font-mono text-[10px] mt-0.5 font-bold">
                        Récompense : +150 FogPoints & progression au classement des Arbitres.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status / Action Footer */}
              <div className="pt-2">
                {isInQueue ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-faceit-orange animate-ping" />
                        <div>
                          <div className="text-sm font-bold text-white">
                            Recherche de joueurs en cours...
                          </div>
                          <div className="text-xs text-zinc-500 font-mono mt-0.5">
                            {stats.onlinePlayers} connecté(s) • {stats.inQueueCount} en file d'attente
                          </div>
                        </div>
                      </div>
                      <div className="text-base font-mono font-black text-faceit-orange">
                        {formatSeconds(queueTimer)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelQueue}
                        className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        Annuler la recherche
                      </button>
                      <button
                        onClick={handleStartSoloTraining}
                        className="py-3 px-4 rounded-xl bg-orange-950/60 hover:bg-orange-900/80 border border-faceit-orange/40 text-faceit-orange text-xs font-bold uppercase tracking-wider transition-colors"
                        title="Tester immédiatement contre un bot d'entraînement IA"
                      >
                        ⚡ Test Solo IA
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleStartQueue}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-faceit-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-black text-sm uppercase tracking-wider shadow-faceit-glow transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Lancer la Recherche de Match</span>
                  </button>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};
