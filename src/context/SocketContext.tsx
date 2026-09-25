import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameMode, MatchState, Player, PlayerRole } from '../types';
import { soundManager } from '../lib/audioManager';

interface ServerStats {
  onlinePlayers: number;
  inQueueCount: number;
  activeMatchesCount: number;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  stats: ServerStats;
  joinQueue: (player: Player, mode: GameMode, role: PlayerRole) => void;
  leaveQueue: () => void;
  banMap: (matchId: string, mapId: string, bannedByName: string, nextTurn: string) => void;
  sendMatchChat: (matchId: string, message: any) => void;
  submitMatchScore: (matchId: string, result: any) => void;
  pendingMatchFound: { match: MatchState; assignedTeam: 'team1' | 'team2' } | null;
  clearPendingMatch: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const getSocketUrl = () => {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) return envApi.replace(/\/$/, '');
  return window.location.port === '5173' ? 'http://localhost:3001' : window.location.origin;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<ServerStats>({
    onlinePlayers: 1,
    inQueueCount: 0,
    activeMatchesCount: 0,
  });
  const [pendingMatchFound, setPendingMatchFound] = useState<{
    match: MatchState;
    assignedTeam: 'team1' | 'team2';
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    console.log(`[FogLeague-WS] Connexion WebSocket vers ${socketUrl}...`);

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[FogLeague-WS] Connecté au serveur relais Socket.io ! ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.warn('[FogLeague-WS] Déconnecté du serveur relais.');
      setIsConnected(false);
    });

    newSocket.on('stats_update', (newStats: ServerStats) => {
      setStats(newStats);
    });

    // Événement officiel quand 2 vrais joueurs sont matchés par le serveur
    newSocket.on('match_ready', (data: { match: MatchState; assignedTeam: 'team1' | 'team2' }) => {
      console.log('⚡ [FogLeague-WS] Vrai match trouvé avec un joueur réel !', data);
      soundManager.playMatchFound();
      setPendingMatchFound(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinQueue = (player: Player, mode: GameMode, role: PlayerRole) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join_queue', {
      player,
      mode,
      role,
    });
  };

  const leaveQueue = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave_queue');
  };

  const banMap = (matchId: string, mapId: string, bannedByName: string, nextTurn: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('ban_map', { matchId, mapId, bannedByName, nextTurn });
  };

  const sendMatchChat = (matchId: string, message: any) => {
    if (!socketRef.current) return;
    socketRef.current.emit('send_match_chat', { matchId, message });
  };

  const submitMatchScore = (matchId: string, result: any) => {
    if (!socketRef.current) return;
    socketRef.current.emit('submit_match_score', { matchId, result });
  };

  const clearPendingMatch = () => {
    setPendingMatchFound(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        stats,
        joinQueue,
        leaveQueue,
        banMap,
        sendMatchChat,
        submitMatchScore,
        pendingMatchFound,
        clearPendingMatch,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
