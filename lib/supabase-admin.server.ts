import { createClient } from '@supabase/supabase-js'

// Debug environment variables
console.log('🔑 Supabase Admin Client Environment Check:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
  serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
})

// Admin client for server-side only
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
