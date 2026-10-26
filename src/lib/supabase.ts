import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigError =
  !url || !key
    ? 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill in your Supabase project values.'
    : null

// When config is missing we still export a client (pointed at placeholders) so the
// rest of the app can import it unconditionally; App.tsx shows a blocking config
// error screen instead of ever using it.
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder')
