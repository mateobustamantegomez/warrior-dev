/**
 * supabaseClient
 * --------------
 * SERVICE layer. Single shared Supabase client, initialized from the
 * anon/public key (safe to ship in the browser bundle — access is
 * restricted per-user by Row Level Security policies in the database,
 * not by keeping this key secret).
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
