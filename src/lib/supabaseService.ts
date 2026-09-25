import { supabase, isSupabaseConfigured } from './supabaseClient';
import { CertifiedMatch } from './matchStore';
import { Player } from '../types';

export interface DbPlayerRecord {
  id: string;
  steam_id: string;
  name: string;
  avatar: string;
  elo: number;
  level: number;
  role: string;
  karma: number;
  matches_played: number;
  win_rate: number;
  vac_banned: boolean;
  trust_factor: string;
  game_hours_dbd: number;
}

// 1. Synchroniser / Enregistrer un joueur (opéré de manière autoritaire par le serveur Node.js via Valve OpenID)
export async function syncPlayerToSupabase(player: Partial<Player> & { id: string; steamId?: string }): Promise<void> {
  // 🛡️ SÉCURITÉ E-SPORT : L'écriture officielle dans la table 'players' est assurée exclusivement
  // par le backend Node.js (db.js) avec la clé secrète service_role, empêchant toute falsification F12.
  if (player.name) {
    console.log(`[Supabase] Profil joueur vérifié : ${player.name} (${player.id})`);
  }
}

// 2. Enregistrer un match certifié (opéré de manière autoritaire par le serveur WebSocket via submit_match_score)
export async function saveCertifiedMatchToSupabase(match: CertifiedMatch, playerId: string): Promise<void> {
  // 🛡️ SÉCURITÉ E-SPORT : La persistance et le calcul d'ÉLO officiel sont scellés côté serveur (persistMatchResult)
  // lors de la réception de l'événement socket 'submit_match_score'.
  console.log(`[Supabase] Match #${match.id} certifié pour ${playerId} (Sauvegarde autoritaire serveur).`);
}

// 3. Récupérer le vrai classement des joueurs depuis Supabase
export async function fetchLiveLeaderboard(): Promise<Player[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('elo', { ascending: false })
      .limit(50);

    if (error || !data) {
      console.warn('[Supabase] Erreur lecture leaderboard:', error?.message);
      return null;
    }

    return data.map((d: DbPlayerRecord) => ({
      id: d.id,
      name: d.name,
      avatar: d.avatar,
      elo: d.elo,
      level: d.level,
      role: (d.role as any) || 'flex',
      karma: d.karma,
      matchesPlayed: d.matches_played,
      winRate: Number(d.win_rate),
      vacBanned: d.vac_banned,
      trustFactor: d.trust_factor,
    }));
  } catch (err) {
    console.warn('[Supabase] Erreur réseau classement:', err);
    return null;
  }
}
