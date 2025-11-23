import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('WARNING: Missing Supabase environment variables. Using placeholders to prevent build failure.')
}

// Create Supabase client
// Supabase will handle browser vs server environment automatically
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
