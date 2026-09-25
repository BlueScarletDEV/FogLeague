-- =============================================================================
-- FOGLEAGUE — SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- Version 2.0 — Sécurité Maximale (RLS Verrouillé)
-- 
-- ⚠️ IMPORTANT : Exécuter ce script dans le SQL Editor de votre projet Supabase
-- Les politiques d'écriture sont RÉSERVÉES au rôle 'service_role' uniquement.
-- La clé VITE_SUPABASE_ANON_KEY (côté client) n'autorise que la LECTURE.
-- Seul le serveur Node.js (avec SUPABASE_SERVICE_ROLE_KEY) peut écrire en base.
-- =============================================================================

-- 1. Table des Joueurs (Enregistrés via Steam OpenID)
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,                           -- Ex: usr_steam_76561198084291842
  steam_id TEXT UNIQUE NOT NULL,                 -- SteamID64 (17 chiffres)
  name TEXT NOT NULL,                            -- Pseudo Steam public
  avatar TEXT,                                   -- URL avatar Steam
  elo INTEGER NOT NULL DEFAULT 1200,             -- ELO initial
  level INTEGER NOT NULL DEFAULT 1,              -- Rang Mist Rank (1 à 10)
  role TEXT NOT NULL DEFAULT 'flex',             -- 'survivor' | 'killer' | 'flex' | 'referee'
  main_killer TEXT DEFAULT 'La Chasseuse (The Huntress)',
  main_survivor TEXT DEFAULT 'Nea Karlsson',
  karma INTEGER NOT NULL DEFAULT 100,            -- Score de réputation (0 - 100)
  matches_played INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  vac_banned BOOLEAN NOT NULL DEFAULT false,
  trust_factor TEXT NOT NULL DEFAULT 'Élite (100%)',
  game_hours_dbd INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour classement rapide par ELO
CREATE INDEX IF NOT EXISTS idx_players_elo ON public.players (elo DESC);
CREATE INDEX IF NOT EXISTS idx_players_steam_id ON public.players (steam_id);

-- 2. Table des Matchs Officiels Certifiés
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  team1_ids TEXT[] NOT NULL,
  team2_ids TEXT[] NOT NULL,
  referee_id TEXT,
  winner_team TEXT,
  map_name TEXT,
  lobby_code TEXT,
  server_region TEXT DEFAULT 'Europe Ouest (Paris - 9ms)',
  sha256_proof TEXT,
  verified_by TEXT DEFAULT 'FogLeague Arbitre Certifié & Consensus Joueurs',
  compliance_status TEXT DEFAULT 'CONFORME_DBDL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches (created_at DESC);

-- 3. Table des Statistiques Détaillées par Joueur par Match
CREATE TABLE IF NOT EXISTS public.match_player_stats (
  id BIGSERIAL PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  result TEXT NOT NULL,
  is_win BOOLEAN NOT NULL DEFAULT false,
  elo_change INTEGER NOT NULL DEFAULT 0,
  elo_after INTEGER NOT NULL,
  chase_seconds INTEGER DEFAULT 0,
  generators_done INTEGER DEFAULT 0,
  hooks INTEGER DEFAULT 0,
  altruism_events INTEGER DEFAULT 0,
  bloodpoints INTEGER DEFAULT 0,
  character_played TEXT,
  perks_used TEXT[] DEFAULT '{}',
  banned_perks_found TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_player_stats_player ON public.match_player_stats (player_id);
CREATE INDEX IF NOT EXISTS idx_match_player_stats_match ON public.match_player_stats (match_id);;

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) — POLITIQUE VERROUILLÉE
-- Principe : anon = lecture seule / service_role = écriture exclusive
-- =============================================================================
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;

-- ✅ LECTURE PUBLIQUE : Le classement et les matchs sont visibles par tous
CREATE POLICY "Lecture publique des joueurs" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique des matchs" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique des stats de match" ON public.match_player_stats
  FOR SELECT USING (true);

-- 🛡️ ÉCRITURE RÉSERVÉE AU SERVICE_ROLE (Backend Node.js uniquement)
-- Le rôle 'anon' (clé publique client) n'a AUCUN droit d'écriture.
-- Seul le serveur Node.js avec SUPABASE_SERVICE_ROLE_KEY peut modifier les données.
CREATE POLICY "Ecriture joueurs service_role uniquement" ON public.players
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Mise a jour joueurs service_role uniquement" ON public.players
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Suppression joueurs service_role uniquement" ON public.players
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Ecriture matchs service_role uniquement" ON public.matches
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Mise a jour matchs service_role uniquement" ON public.matches
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Ecriture stats service_role uniquement" ON public.match_player_stats
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- 5. DONNÉES INITIALES DU CLASSEMENT COMPÉTITIF
-- =============================================================================
INSERT INTO public.players (id, steam_id, name, avatar, elo, level, role, karma, matches_played, win_rate, vac_banned, trust_factor)
VALUES
  ('usr_steam_76561198000000001', '76561198000000001', 'Aura_Nurse', 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg', 2150, 9, 'killer', 99, 140, 74.5, false, 'Élite (100%)'),
  ('usr_steam_76561198000000002', '76561198000000002', 'ShadowLooper', 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg', 2040, 9, 'survivor', 98, 122, 69.2, false, 'Élite (100%)'),
  ('usr_steam_76561198000000003', '76561198000000003', 'BlightSpeed', 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg', 1980, 8, 'flex', 100, 98, 65.4, false, 'Élite (100%)')
ON CONFLICT (id) DO NOTHING;
