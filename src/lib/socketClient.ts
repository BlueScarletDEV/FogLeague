import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnectedState: boolean = false;

  public init() {
    if (this.socket) return;

    // Connect to server (same origin in prod, or localhost:3001 in dev)
    const serverUrl =
      window.location.port === '5173'
        ? `http://${window.location.hostname}:3001`
        : window.location.origin;

    try {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        this.isConnectedState = true;
        console.log('[FogLeague] Connecté au serveur multijoueur temps réel');
      });

      this.socket.on('disconnect', () => {
        this.isConnectedState = false;
        console.log('[FogLeague] Déconnecté du serveur multijoueur');
      });
    } catch (e) {
      console.warn('[FogLeague] Serveur multijoueur indisponible, bascule en mode local.');
    }
  }

  public isConnected(): boolean {
    return this.isConnectedState && Boolean(this.socket?.connected);
  }

  public joinQueue(player: any, mode: string, role: string) {
    this.init();
    if (this.socket) {
      this.socket.emit('join_queue', { player, mode, role });
    }
  }

  public leaveQueue() {
    if (this.socket) {
      this.socket.emit('leave_queue');
    }
  }

  public banMap(matchId: string, mapId: string, bannedByName: string, nextTurn: string) {
    if (this.socket) {
      this.socket.emit('ban_map', { matchId, mapId, bannedByName, nextTurn });
    }
  }

  public sendChat(matchId: string, message: any) {
    if (this.socket) {
      this.socket.emit('send_match_chat', { matchId, message });
    }
  }

  public onMatchReady(callback: (data: any) => void) {
    this.init();
    if (this.socket) {
      this.socket.off('match_ready');
      this.socket.on('match_ready', callback);
    }
  }

  public onMapBanned(callback: (data: any) => void) {
    this.init();
    if (this.socket) {
      this.socket.off('map_banned_update');
      this.socket.on('map_banned_update', callback);
    }
  }

  public onNewChat(callback: (message: any) => void) {
    this.init();
    if (this.socket) {
      this.socket.off('new_match_chat');
      this.socket.on('new_match_chat', callback);
    }
  }

  public onStatsUpdate(callback: (stats: any) => void) {
    this.init();
    if (this.socket) {
      this.socket.off('stats_update');
      this.socket.on('stats_update', callback);
    }
  }
}

export const socketService = new SocketService();
