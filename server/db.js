// ==============================================================
// 🗄️ FOGLEAGUE BACKEND — SUPABASE POSTGRESQL PERSISTENCE
// ==============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isDbConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project-id')
);

export const db = isDbConfigured ? createClient(supabaseUrl, supabaseKey) : null;

if (!isDbConfigured) {
  console.log('[DB] Supabase non configuré (SUPABASE_URL manquante). Le serveur tourne en mode mémoire vive.');
} else {
  console.log('[DB] Connecté avec succès à Supabase PostgreSQL !');
}

/**
 * Enregistrer ou mettre à jour un joueur lors de son authentification Steam
 */
export async function upsertSteamPlayer(userData) {
  if (!db) return null;
  try {
    const { data, error } = await db.from('players').upsert(
      {
        id: userData.id,
        steam_id: userData.steamId,
        name: userData.name,
        avatar: userData.avatar,
        vac_banned: userData.vacBanned || false,
        game_hours_dbd: userData.gameHoursDBD || 0,
        trust_factor: userData.trustFactor || 'Élite (100%)',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('[DB] Erreur upsert joueur:', error.message);
    } else {
      console.log(`[DB] Joueur ${userData.name} (${userData.steamId}) sauvegardé en base.`);
    }
    return data;
  } catch (err) {
    console.error('[DB] Erreur inattendue upsert joueur:', err);
    return null;
  }
}

/**
 * Enregistrer un match finalisé
 */
export async function persistMatchResult(matchData) {
  if (!db) return null;
  try {
    const { data, error } = await db.from('matches').upsert(
      {
        id: matchData.id,
        mode: matchData.mode,
        status: 'completed',
        team1_ids: matchData.team1 ? matchData.team1.map((p) => p.id) : [],
        team2_ids: matchData.team2 ? matchData.team2.map((p) => p.id) : [],
        referee_id: matchData.referee ? matchData.referee.id : null,
        lobby_code: matchData.lobbyCode,
        server_region: matchData.serverRegion,
        sha256_proof: matchData.sha256Proof || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('[DB] Erreur persistMatchResult:', error.message);
    }
    return data;
  } catch (err) {
    console.error('[DB] Erreur inattendue persistMatchResult:', err);
    return null;
  }
}
