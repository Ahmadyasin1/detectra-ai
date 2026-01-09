import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://txkwnceefmaotmqluajc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4a3duY2VlZm1hb3RtcWx1YWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDY1OTksImV4cCI6MjA3NzAyMjU5OX0.YGZdhYEA4rI3dQCSKPIOfW0wiROkhzdMfUOaHH0uONI';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Using fallback values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
