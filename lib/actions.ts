'use server'

import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from './supabase-admin.server'
import { generateUUIDFromString } from './utils'

export async function createOrGetUser() {
  const { userId } = auth()
  console.log('Creating/getting user for ID:', userId)
  
  if (!userId) {
    throw new Error('Not authenticated')
  }

  // Generate UUID for Supabase from Clerk ID
  const supabaseUserId = generateUUIDFromString(userId);
  console.log('Using Supabase UUID:', supabaseUserId, 'for profile operations');

  try {
    // Check if user exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single()

    console.log('Fetch result:', { existingProfile, fetchError })

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw fetchError
    }

    if (existingProfile) {
      console.log('Found existing profile:', existingProfile)
      return existingProfile
    }

    // Create new profile if doesn't exist
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          user_id: supabaseUserId,
          credits: 3,
          tier: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create profile:', insertError)
      throw new Error('Failed to create profile')
    }

    console.log('Created new profile:', newProfile)
    return newProfile

  } catch (error) {
    console.error('Error in createOrGetUser:', error)
    throw error
  }
} 