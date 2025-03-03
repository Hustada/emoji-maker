import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin.server'
import { generateUUIDFromString } from '@/lib/utils'

/**
 * Test API endpoint to add credits to a user
 * This is for testing purposes only - NO AUTHENTICATION REQUIRED
 */
export async function GET(req: Request) {
  console.log('📝 Test Add Credits API called')
  try {
    // Get user ID from query params
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId') || 'user_2too40N7WUfu9TNVnLZ5ajklmZM' // Default to your user ID
    const credits = parseInt(url.searchParams.get('credits') || '10')
    
    console.log('👤 User ID:', userId)
    console.log('💰 Adding credits:', credits)

    // Generate UUID from Clerk ID for Supabase
    const supabaseUserId = generateUUIDFromString(userId)
    console.log('🔑 Using Supabase UUID:', supabaseUserId, 'for credit addition')

    // Update user profile with new credits
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ credits })
      .eq('user_id', supabaseUserId)
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to add credits:', error)
      return NextResponse.json(
        { error: 'Failed to add credits' },
        { status: 500 }
      )
    }

    console.log('✅ Credits added successfully:', data)
    return NextResponse.json({
      success: true,
      message: `Added ${credits} credits to user`,
      profile: data
    })
  } catch (error: any) {
    console.error('❌ Error adding credits:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add credits' },
      { status: 500 }
    )
  }
}
