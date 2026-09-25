import React, { useState, useEffect } from 'react';
import { MatchState, Player, DBDMap, DBDKiller } from '../types';
import { EloBadge } from './EloBadge';
import { MapVeto } from './MapVeto';
import { KillerDraft } from './KillerDraft';
import { LoadoutSelector } from './LoadoutSelector';
import { LiveMatchTicker } from './LiveMatchTicker';
import { MatchResultModal } from './MatchResultModal';
import { OCRScanReport } from '../lib/ocrSimulator';
import { soundManager } from '../lib/audioManager';
import { useSocket } from '../context/SocketContext';
import {
  Copy,
  Check,
  MessageSquare,
  Send,
  ShieldAlert,
  Server,
  Trophy,
  Cpu,
  Headphones,
  LifeBuoy,
} from 'lucide-react';

interface MatchRoomProps {
  match: MatchState;
  onMatchComplete: (updatedMatch: MatchState) => void;
  currentUser: Player;
}

export const MatchRoom: React.FC<MatchRoomProps> = ({
  match,
  onMatchComplete,
  currentUser,
}) => {
  const { socket, sendMatchChat, submitMatchScore } = useSocket();
  const [copiedCode, setCopiedCode] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [disputeActive, setDisputeActive] = useState(false);
  const [consensusStep, setConsensusStep] = useState<'idle' | 'declared_win' | 'declared_loss' | 'opponent_confirmed'>('idle');
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; time: string; isSystem?: boolean }[]
  >([
    {
      sender: 'Système FogLeague',
      text: 'Salon de match créé avec succès. Phase de Veto et Draft lancée.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    },
  ]);
  const [inputText, setInputText] = useState('');

  // Synchronisation WebSocket en direct pour le chat et les scores
  useEffect(() => {
    if (!socket) return;

    const handleNewChat = (msg: { sender: string; text: string; time: string; isSystem?: boolean }) => {
      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === msg.sender && last.text === msg.text) {
          return prev;
        }
        return [...prev, msg];
      });
    };

    const handleMatchCompleted = (res: any) => {
      soundManager.playVictory();
      setConsensusStep('opponent_confirmed');
      onMatchComplete({
        ...match,
        status: 'completed',
        result: res,
      });
    };

    const handleSecurityAlert = (data: { message: string }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Bouclier Sécurité',
          text: `🚨 ${data.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ]);
    };

    socket.on('new_match_chat', handleNewChat);
    socket.on('match_completed_update', handleMatchCompleted);
    socket.on('security_alert', handleSecurityAlert);

    return () => {
      socket.off('new_match_chat', handleNewChat);
      socket.off('match_completed_update', handleMatchCompleted);
      socket.off('security_alert', handleSecurityAlert);
    };
  }, [socket, match, onMatchComplete]);

  const handle1ClickReport = (resultType: 'win' | 'loss') => {
    soundManager.playPickSound();
    setConsensusStep(resultType === 'win' ? 'declared_win' : 'declared_loss');

    // Notification dans le chat
    const declarationText =
      resultType === 'win'
        ? `🏁 ${currentUser.name} a déclaré avoir remporté la partie.`
        : `🏳️ ${currentUser.name} a déclaré la défaite.`;

    const reportMsg = {
      sender: 'Arbitre Automatique',
      text: declarationText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    };

    setChatMessages((prev) => [...prev, reportMsg]);
    if (socket && match.id) {
      sendMatchChat(match.id, reportMsg);
    }

    const isWin = resultType === 'win';
    const computedResult = {
      winner: (isWin ? 'player1' : 'player2') as 'player1' | 'player2',
      chaseTimeSeconds: isWin ? 68 : 34,
      killerHooks: isWin ? 10 : 2,
      escapes: isWin ? 0 : 3,
      gensRemaining: isWin ? 2 : 0,
      eloChange: isWin ? 24 : -18,
      verifiedByOCR: false,
    };

    if (socket && match.id) {
      submitMatchScore(match.id, computedResult);
    }

    // Validation immédiate ou confirmation
    setTimeout(() => {
      soundManager.playVictory();
      setConsensusStep('opponent_confirmed');

      onMatchComplete({
        ...match,
        status: 'completed',
        result: computedResult,
      });
    }, 1200);
  };

  const handleCopyCode = () => {
    soundManager.playPickSound();
    navigator.clipboard.writeText(match.lobbyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText) return;

    soundManager.playPickSound();
    const msgObj = {
      sender: currentUser.name,
      text: cleanText.slice(0, 300),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, msgObj]);
    setInputText('');

    if (socket && match.id) {
      sendMatchChat(match.id, msgObj);
    }
  };

  const handleVetoComplete = (selectedMap: DBDMap) => {
    soundManager.playVictory();
    onMatchComplete({
      ...match,
      selectedMap,
      status: 'in_progress',
    });

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'Système FogLeague',
        text: `★ Map officielle choisie : ${selectedMap.name}. Partie en cours !`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
  };

  const handleDraftComplete = (bannedKiller: DBDKiller, pickedKiller: DBDKiller) => {
    onMatchComplete({
      ...match,
      bannedKillers: [bannedKiller],
    });

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'Système FogLeague',
        text: `Draft Tueur : ${bannedKiller.alias} banni. ${pickedKiller.alias} sélectionné par le Tueur.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
  };

  const handleCallReferee = () => {
    soundManager.playBanSound();
    setDisputeActive(true);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: '🚨 Arbitre Comp (Mod_DBDL)',
        text: 'Bonjour, je suis l\'arbitre de permanence. J\'ai accès aux logs de votre salle. Quel est le problème constaté ?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
  };

  const handleConfirmOCRResult = (report: OCRScanReport) => {
    if (socket && match.id) {
      submitMatchScore(match.id, report.matchResult);
    }
    onMatchComplete({
      ...match,
      status: 'completed',
      result: report.matchResult,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Lobby Connect & Status */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-faceit-orange/15 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-faceit-orange/20 text-faceit-orange text-[10px] font-mono font-bold uppercase tracking-wider border border-faceit-orange/30">
                Match #{match.id.toUpperCase()}
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                {match.mode === '1v1_chase'
                  ? '1v1 Chase Arena (Duel Shack)'
                  : match.mode === 'ranked_pug'
                  ? 'Ranked PUG 1v4'
                  : 'Team Scrim Comp 5v5'}
              </span>
            </div>

            <h1 className="text-2xl font-black uppercase text-white tracking-wide flex items-center gap-3">
              <span>Salle de Match FogLeague</span>
              {match.status === 'completed' && (
                <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-700 px-3 py-1 rounded-full font-bold">
                  Terminé
                </span>
              )}
            </h1>
          </div>

          {/* Lobby Code & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1b1b20] border border-zinc-700 px-4 py-2.5 rounded-xl">
              <Server className="w-4 h-4 text-zinc-400" />
              <div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase">
                  Code Partie Perso DBD
                </div>
                <div className="font-mono font-bold text-white text-sm">
                  {match.lobbyCode}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="ml-2 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="Copier le code de la partie"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Discord Comms Button */}
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2] border border-[#5865F2]/40 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              title="Rejoindre le salon vocal Discord généré pour le match"
            >
              <Headphones className="w-4 h-4 text-[#5865F2] group-hover:text-white" />
              <span>Vocal Discord</span>
            </a>

            {/* Dispute Button */}
            <button
              onClick={handleCallReferee}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                disputeActive
                  ? 'bg-red-950 border-red-600 text-red-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-700'
              }`}
            >
              <LifeBuoy className="w-4 h-4 text-red-400" />
              <span>{disputeActive ? 'Arbitre en ligne' : 'Appeler Arbitre'}</span>
            </button>

            {/* OCR Report Button (Litige / Preuve avancée) */}
            <button
              onClick={() => setIsOCRModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              title="Soumettre une capture d'écran en cas de litige ou contrôle avancé"
            >
              <Cpu className="w-4 h-4 text-faceit-orange" />
              <span>
                {match.status === 'completed'
                  ? 'Voir Preuve OCR'
                  : 'Preuve Image (Optionnel)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ⚡ BANDEAU DE VALIDATION RAPIDE 1-CLIC (ZÉRO SCREENSHOT) */}
      {match.status !== 'completed' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#17171c] to-[#141418] border border-faceit-orange/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-faceit-orange/15 border border-faceit-orange/40 text-faceit-orange flex items-center justify-center text-lg font-black shrink-0">
              ⚡
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>Validation Express de Fin de Match</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  Zéro Screenshot Requis
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Validez le résultat en 1 seul clic par accord mutuel. L'ELO est actualisé instantanément dès la confirmation.
              </p>
            </div>
          </div>

          {consensusStep === 'idle' ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handle1ClickReport('win')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all active:scale-95"
              >
                <span>🏆</span>
                <span>J'ai Gagné (+24 ELO)</span>
              </button>
              <button
                onClick={() => handle1ClickReport('loss')}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                <span>💀</span>
                <span>J'ai Perdu (-18 ELO)</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/40 border border-faceit-orange/40 text-xs font-mono text-faceit-orange animate-pulse">
              <div className="w-2 h-2 rounded-full bg-faceit-orange animate-ping" />
              <span>Confirmation de l'adversaire en cours... Validation automatique !</span>
            </div>
          )}
        </div>
      )}

      {/* Dispute Alert Banner */}
      {disputeActive && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-700 text-red-200 flex items-center gap-3 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold">Arbitre officiel assigné au match :</strong> Un modérateur examine actuellement votre salon. Vous pouvez lui exposer les faits dans le chat ci-dessous.
          </div>
        </div>
      )}

      {/* Match Result Banner if completed */}
      {match.result && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-[#1b1b22] border-2 border-faceit-orange/60 shadow-faceit-glow flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-faceit-orange/20 border border-faceit-orange flex items-center justify-center text-faceit-orange">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs uppercase font-mono font-bold text-faceit-orange">
                Match Validé par Arbitre Numérique
              </div>
              <div className="text-xl font-black text-white">
                Vainqueur :{' '}
                {match.result.winner === 'player1'
                  ? match.team1[0].name
                  : match.result.winner === 'player2'
                  ? match.team2[0].name
                  : 'Équipe Survivants'}
              </div>
              <div className="text-xs text-zinc-400">
                {match.mode === '1v1_chase'
                  ? `Chrono officiel au Shack : ${match.result.chaseTimeSeconds} secondes`
                  : `Crochets : ${match.result.killerHooks}/12 • Évasions : ${match.result.escapes}`}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">
              Variation ELO
            </span>
            <span
              className={`text-2xl font-black font-mono ${
                match.result.eloChange >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {match.result.eloChange >= 0 ? '+' : ''}
              {match.result.eloChange} ELO
            </span>
          </div>
        </div>
      )}

      {/* ⚖️ ARBITRE SPECTATEUR OFFICIEL DU SALON (SLOT 6 DBD) */}
      {match.referee && (
        <div className="p-4 rounded-2xl bg-[#16161b] border border-amber-600/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={match.referee.avatar}
                alt={match.referee.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 text-xs">⚖️</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-white">{match.referee.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/70 text-[10px] font-mono font-bold">
                  ARBITRE SPECTATEUR (SLOT 6)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Karma 100%</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Présent en direct dans le salon de jeu en tant que spectateur. Supervise les perks et homologue le match.
              </p>
            </div>
          </div>

          {match.status !== 'completed' && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {currentUser.id === match.referee.id ? (
                <button
                  onClick={() => handle1ClickReport('win')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-950 transition-all active:scale-95"
                >
                  <span>⚖️</span>
                  <span>Homologuer le Match (Verdict Arbitre)</span>
                </button>
              ) : (
                <button
                  onClick={handleCallReferee}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-red-950/80 hover:text-red-300 border border-zinc-700 text-zinc-400 text-[11px] font-bold uppercase transition-all flex items-center gap-1"
                  title="En cas de désaccord ou de comportement suspect de l'arbitre"
                >
                  <span>🚨</span>
                  <span>Contester / Litige</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Teams Rosters Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team 1 */}
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-faceit-orange" />
              <h3 className="font-black text-sm uppercase text-white">
                Équipe 1 (Entité / Shack)
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Moyenne : {match.team1[0]?.elo} ELO
            </span>
          </div>

          <div className="space-y-2.5">
            {match.team1.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#19191d] border border-zinc-800/80"
              >
                <div className="flex items-center gap-3">
                  <EloBadge level={p.level} size="sm" />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {p.isCaptain && (
                        <span className="text-[9px] bg-faceit-orange/20 text-faceit-orange border border-faceit-orange/30 px-1 rounded font-bold uppercase">
                          Cap
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Main : {p.mainKiller || p.mainSurvivor}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-zinc-400">
                  {p.elo} ELO
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team 2 */}
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <h3 className="font-black text-sm uppercase text-white">
                Équipe 2 (Challenger)
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Moyenne : {match.team2[0]?.elo} ELO
            </span>
          </div>

          <div className="space-y-2.5">
            {match.team2.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#19191d] border border-zinc-800/80"
              >
                <div className="flex items-center gap-3">
                  <EloBadge level={p.level} size="sm" />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {p.isCaptain && (
                        <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 rounded font-bold uppercase">
                          Cap
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Main : {p.mainKiller || p.mainSurvivor}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-zinc-400">
                  {p.elo} ELO
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Build & Loadout Configurator */}
      <LoadoutSelector
        role={currentUser.role === 'killer' ? 'killer' : 'survivor'}
        onSaveLoadout={(_perks) => {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: 'Système FogLeague',
              text: `Build de ${currentUser.name} vérifié et conforme aux règles officielles de la ligue.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSystem: true,
            },
          ]);
        }}
      />

      {/* Killer Draft & Ban Phase */}
      <KillerDraft
        onDraftComplete={handleDraftComplete}
        killerPlayerName={match.team1[0]?.name || currentUser.name}
        survivorCaptainName={match.team2[0]?.name || 'Adversaire'}
      />

      {/* Map Veto Section */}
      <MapVeto
        maps={match.remainingMaps}
        onVetoComplete={handleVetoComplete}
        team1Name={match.team1[0]?.name || 'Équipe 1'}
        team2Name={match.team2[0]?.name || 'Équipe 2'}
      />

      {/* Live Match Broadcast Panel */}
      {match.status === 'in_progress' && (
        <LiveMatchTicker
          mode={match.mode}
          killerName={match.team1[0]?.name || currentUser.name}
          survivorNames={match.team2.map((p) => p.name)}
          lobbyCode={match.lobbyCode}
          refereeName={match.referee?.name}
        />
      )}

      {/* Live Match Chat */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-faceit-orange" />
            <h3 className="font-black text-sm uppercase text-white">
              Chat en Direct du Match
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            Serveur : {match.serverRegion}
          </span>
        </div>

        <div className="h-40 overflow-y-auto space-y-2 pr-2 mb-3">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg text-xs ${
                msg.isSystem
                  ? 'bg-zinc-800/50 text-faceit-orange font-mono border-l-2 border-faceit-orange'
                  : 'bg-[#19191d] text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                <span className="font-bold text-zinc-400">{msg.sender}</span>
                <span>{msg.time}</span>
              </div>
              <p className="text-xs">{msg.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Écris un message à ton adversaire ou à l'arbitre..."
            className="flex-1 bg-[#19191d] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-faceit-orange"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Envoyer</span>
          </button>
        </form>
      </div>

      {/* OCR Validation Modal */}
      <MatchResultModal
        isOpen={isOCRModalOpen}
        onClose={() => setIsOCRModalOpen(false)}
        mode={match.mode}
        onConfirmScore={handleConfirmOCRResult}
      />
    </div>
  );
};
