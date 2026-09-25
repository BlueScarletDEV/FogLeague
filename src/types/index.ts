export type GameMode = '1v1_chase' | 'ranked_pug' | 'team_scrim';

export type PlayerRole = 'killer' | 'survivor' | 'flex' | 'referee';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  elo: number;
  level: number; // Rang de l'Épreuve (1 à 10)
  role: PlayerRole;
  mainKiller?: string;
  mainSurvivor?: string;
  karma: number; // 0 - 100%
  matchesPlayed: number;
  winRate: number;
  isCaptain?: boolean;
  steamId?: string;
  vacBanned?: boolean;
  trustFactor?: string;
  gameHoursDBD?: number;
}

export interface DBDMap {
  id: string;
  name: string;
  realm: string;
  image: string;
  type: 'Balanced' | 'Killer-Favored' | 'Survivor-Favored';
  isCompApproved: boolean;
  bannedBy?: string;
}

export interface DBDKiller {
  id: string;
  name: string;
  alias: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile' | 'Très Difficile';
  tier: 'S' | 'A' | 'B' | 'C';
  icon: string;
  isBanned?: boolean;
}

export interface CompRule {
  id: string;
  name: string;
  category: 'killer' | 'perk' | 'item' | 'map';
  description: string;
  isRestricted: boolean;
}

export interface MatchResult {
  winner: 'killer' | 'survivors' | 'draw' | 'player1' | 'player2';
  killerHooks?: number;
  escapes?: number;
  chaseTimeSeconds?: number;
  gensRemaining?: number;
  eloChange: number;
  bannedPerkDetected?: string;
  verifiedByOCR: boolean;
}

export interface MatchState {
  id: string;
  mode: GameMode;
  status: 'queue' | 'veto' | 'in_progress' | 'reporting' | 'completed';
  team1: Player[];
  team2: Player[];
  referee?: Player; // Arbitre Spectateur officiel assigné
  activeVetoTurn: 'team1' | 'team2';
  remainingMaps: DBDMap[];
  bannedMaps: DBDMap[];
  selectedMap?: DBDMap;
  bannedKillers: DBDKiller[];
  lobbyCode: string;
  serverRegion: string;
  result?: MatchResult;
}
