import { supabaseAdmin } from './supabase-admin.server'
import crypto from 'crypto'
import { generateUUIDFromString } from './utils'

/**
 * Synchronizes a Clerk user with Supabase Auth
 * Ensures the user exists in Supabase Auth with the same ID
 */

export async function syncUserWithSupabase(userId: string, email?: string) {
  console.log('🔄 Syncing user with Supabase Auth:', userId)
  if (!userId) {
    console.log('❌ No userId provided to syncUserWithSupabase')
    return null
  }
  
  // Generate a UUID v4 from the Clerk user ID
  // This is necessary because Supabase requires UUIDs but Clerk uses its own format
  const supabaseUserId = generateUUIDFromString(userId);
  console.log('📝 Generated Supabase UUID:', supabaseUserId, 'from Clerk ID:', userId);
  
  try {
    // First check if user exists with the generated UUID
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId)
    
    if (!getUserError && existingUser?.user) {
      console.log('✅ User already exists in Supabase Auth:', existingUser.user.id)
      return existingUser.user
    }
    
    // Create a new Supabase user with the UUID generated from Clerk ID
    console.log('📝 Creating new Supabase Auth user')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email || `${userId}@example.com`,
      password: crypto.randomUUID(), // Random password, won't be used
      user_metadata: { clerkId: userId },
      email_confirm: true,
      id: supabaseUserId // Use the generated UUID instead of the Clerk ID
    })
    
    if (createError) {
      console.error('❌ Failed to create Supabase Auth user:', createError)
      return null
    }
    
    console.log('✅ New Supabase Auth user created successfully:', newUser.user.id)
    return newUser.user
  } catch (error) {
    console.error('❌ Error in syncUserWithSupabase:', error)
    return null
  }
}

/**
 * Ensures a user profile exists in the database
 * Creates one with default values if it doesn't exist
 */
export async function ensureUserProfile(userId: string, email?: string) {
  console.log('🔍 ensureUserProfile called for userId:', userId)
  if (!userId) {
    console.log('❌ No userId provided to ensureUserProfile')
    return null
  }
  
  // Generate UUID from Clerk ID for Supabase
  const supabaseUserId = generateUUIDFromString(userId);
  console.log('📝 Using Supabase UUID:', supabaseUserId, 'for profile operations');
  
  // First, ensure the user exists in Supabase Auth
  await syncUserWithSupabase(userId, email)
  
  try {
    // Check if user profile exists
    console.log('🔍 Checking if user profile exists for:', supabaseUserId)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single()
    
    // If profile exists, return it
    if (existingProfile) {
      console.log('✅ Existing profile found:', existingProfile)
      return existingProfile
    }
    console.log('📝 No existing profile found, will create new one')
    
    // Create new profile with default values
    console.log('📝 Creating new profile with default values')
    const { data: newProfile, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: supabaseUserId,
        credits: 3, // Default credits as per requirements
        tier: 'free'
        // Note: The profiles table doesn't have a metadata column per schema
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Failed to create user profile:', error)
      return null
    }
    
    console.log('✅ New profile created successfully:', newProfile)
    return newProfile
  } catch (error) {
    console.error('❌ Error in ensureUserProfile:', error)
    return null
  }
}
