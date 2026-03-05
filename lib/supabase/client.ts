import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ctcezjjamqnarnlhfdrh.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Y2V6amphbXFuYXJubGhmZHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2Nzc4MDEsImV4cCI6MjA3NTI1MzgwMX0.ZKSvExkGFbU6V4eUcNU3bW-iTnFwU5rHbLw0cp5mK0E'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
