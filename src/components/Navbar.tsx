import React, { useState } from 'react';
import { Flame, Swords, Trophy, BookOpen, User, Users, Target, Volume2, VolumeX, ShieldCheck, LogIn, LogOut, Share2 } from 'lucide-react';
import { CURRENT_USER } from '../data/dbdData';
import { EloBadge } from './EloBadge';
import { soundManager } from '../lib/audioManager';
import { useAuth } from '../context/AuthContext';

import { Player } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isInQueue: boolean;
  queueTimer: number;
  onOpenQueueModal: () => void;
  onOpenAuthModal: () => void;
  onOpenShareModal: () => void;
  hasActiveMatch: boolean;
  currentUser?: Player;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  isInQueue,
  queueTimer,
  onOpenQueueModal,
  onOpenAuthModal,
  onOpenShareModal,
  hasActiveMatch,
  currentUser,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
    if (!next) {
      soundManager.playPickSound();
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-[#121215]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div 
          onClick={() => setCurrentTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-faceit-orange to-dbd-blood flex items-center justify-center shadow-faceit-glow transition-transform group-hover:scale-105">
            <Flame className="w-6 h-6 text-white animate-pulse-subtle" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-[#121215]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-wider text-white">FOG</span>
              <span className="font-black text-xl tracking-wider text-faceit-orange">LEAGUE</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
              Arène Compétitive DBD
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#18181c] p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setCurrentTab('play')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'play'
                ? 'bg-faceit-orange text-white shadow-faceit-glow'
                : 'text-zinc-400 hover:text-faceit-orange hover:bg-zinc-800/50'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Jouer</span>
          </button>

          {hasActiveMatch && (
            <button
              onClick={() => setCurrentTab('match')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 animate-pulse ${
                currentTab === 'match'
                  ? 'bg-red-600 text-white shadow-blood-glow'
                  : 'text-red-400 bg-red-950/40 border border-red-800 hover:bg-red-900/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Salle de Match</span>
            </button>
          )}

          <button
            onClick={() => setCurrentTab('hubs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === 'hubs'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Hubs & Clans</span>
          </button>

          <button
            onClick={() => setCurrentTab('missions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === 'missions'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Épreuves & Pass</span>
          </button>

          <button
            onClick={() => setCurrentTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'security'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sécurité & IA</span>
          </button>

          <button
            onClick={() => setCurrentTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === 'leaderboard'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Classement</span>
          </button>

          <button
            onClick={() => setCurrentTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === 'rules'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Règles Comp</span>
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === 'profile'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil</span>
          </button>
        </nav>

        {/* Right side: Share Button, Audio, Queue Pill, Login/Auth */}
        <div className="flex items-center gap-2.5">
          {/* Share / Invite button */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-950/40 hover:bg-faceit-orange hover:text-white border border-faceit-orange/40 text-faceit-orange text-xs font-bold uppercase transition-all"
            title="Inviter des joueurs & Partager"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inviter</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-[#18181c] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-faceit-orange" />}
          </button>

          {/* Matchmaking Queue Button */}
          {isInQueue ? (
            <div 
              onClick={onOpenQueueModal}
              className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-orange-950/60 border border-faceit-orange/50 text-faceit-orange text-xs font-semibold animate-pulse"
            >
              <div className="w-2 h-2 rounded-full bg-faceit-orange animate-ping" />
              <span>Recherche... ({formatSeconds(queueTimer)})</span>
            </div>
          ) : (
            <button
              onClick={onOpenQueueModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-faceit-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider shadow-faceit-glow transition-all active:scale-95"
            >
              <Swords className="w-4 h-4" />
              <span>Trouver Match</span>
            </button>
          )}

          {/* Authentication State */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div 
                onClick={() => setCurrentTab('profile')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <EloBadge level={currentUser?.level || 1} size="md" />
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white group-hover:text-faceit-orange transition-colors">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800" title="Indice de Confiance Valve & Fair-Play">
                      {user.trustFactor}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">
                    {currentUser?.elo || 1200} ELO • {user.gameHoursDBD}h DBD
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-400 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b2838] hover:bg-[#2a475e] border border-[#2a475e] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4 text-[#66c0f4]" />
              <span>Connexion</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
