import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin.server';
import { generateUUIDFromString } from '@/lib/utils';

/**
 * API endpoint to get or create a user profile
 * This is called from client components
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Generate UUID for Supabase from Clerk ID
    const supabaseUserId = generateUUIDFromString(userId);
    console.log('🔑 Using Supabase UUID:', supabaseUserId, 'for profile operations');

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single();

    console.log('Fetch result:', { existingProfile, fetchError });

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw fetchError;
    }

    if (existingProfile) {
      console.log('Found existing profile:', existingProfile);
      return NextResponse.json(existingProfile);
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
      .single();

    if (insertError) {
      console.error('Failed to create profile:', insertError);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    console.log('Created new profile:', newProfile);
    return NextResponse.json(newProfile);

  } catch (error) {
    console.error('Error in profile endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
