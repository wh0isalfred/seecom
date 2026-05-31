import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    lock: async (_name, _timeout, fn) => await fn(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export const generateSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
