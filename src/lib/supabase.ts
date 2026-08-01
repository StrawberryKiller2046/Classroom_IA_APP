import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase env vars — running without a backend. Copy .env.example to .env and fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY to enable data and AI generation."
  )
}

// Falls back to an inert placeholder so the UI still renders (and fails
// gracefully per-request) instead of crashing before Supabase is configured.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
)
