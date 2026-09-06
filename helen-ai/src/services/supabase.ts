import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Environment variables — replace these with your actual Supabase project values.
//
// In development, create a .env file at the project root:
//   VITE_SUPABASE_URL=https://your-project.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key
//
// You can find these in your Supabase project dashboard under
// Settings → API.
// ---------------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Helen AI] Supabase credentials are not configured. ' +
    'Copy .env.example to .env and fill in your project URL and anon key. ' +
    'Auth functionality will fail until then.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
