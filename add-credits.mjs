// Script to add credits to a user
import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseKey)

async function addCredits() {
  const userId = '5a02c6c8-9b0a-485e-8968-fa5abad77db3' // Your user ID
  const credits = 10 // Number of credits to add
  
  console.log(`Adding ${credits} credits to user ${userId}...`)
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ credits })
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error adding credits:', error)
    process.exit(1)
  }
  
  console.log('Credits added successfully!')
  
  // Verify credits were added
  const { data: profile, error: getError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (getError) {
    console.error('Error getting profile:', getError)
    process.exit(1)
  }
  
  console.log('Updated profile:', profile)
}

addCredits()
