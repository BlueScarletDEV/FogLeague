import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.info(
    '[FogLeague-DB] Mode hybride actif : Supabase non configuré pour le moment (Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes). Utilisation du cache local persistant.'
  );
} else {
  console.info('[FogLeague-DB] Connecté avec succès à la base PostgreSQL Supabase !');
}
