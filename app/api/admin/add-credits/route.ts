import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-admin.server'
import { generateUUIDFromString } from '@/lib/utils'

/**
 * Admin API endpoint to add credits to a user
 * This is for testing purposes only
 */
export async function POST(req: Request) {
  console.log('📝 Admin Add Credits API called')
  try {
    // Get authenticated user
    const { userId } = await auth()
    console.log('👤 User ID:', userId)
    if (!userId) {
      console.log('❌ No user ID found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate UUID from Clerk ID for Supabase
    const supabaseUserId = generateUUIDFromString(userId)
    console.log('🔑 Using Supabase UUID:', supabaseUserId, 'for credit addition')

    // Get credits from request or use default
    const { credits = 10 } = await req.json().catch(() => ({}))
    console.log('💰 Adding credits:', credits)

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
