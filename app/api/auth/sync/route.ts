import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin.server';
import crypto from 'crypto';
import { generateUUIDFromString } from '@/lib/utils';
import { createOrGetUser } from '@/lib/actions';

/**
 * API endpoint to synchronize Clerk user with Supabase
 * This ensures the user IDs match between systems
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Generate a UUID v4 from the Clerk user ID
    const supabaseUserId = generateUUIDFromString(userId);
    console.log('📝 Generated Supabase UUID:', supabaseUserId, 'from Clerk ID:', userId);
    
    // First check if the user already exists in Supabase
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
    
    if (!getUserError && existingUser?.user) {
      // User already exists in Supabase
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists in Supabase',
        user: existingUser.user 
      });
    }
    
    // Create a Supabase user with the UUID generated from Clerk ID
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: `${userId}@example.com`, // Placeholder email
      password: crypto.randomUUID(), // Random password, won't be used
      user_metadata: { clerkId: userId },
      email_confirm: true,
      id: supabaseUserId // Use the generated UUID instead of the Clerk ID
    });
    
    if (error) {
      console.error('Error creating Supabase user:', error);
      return NextResponse.json(
        { error: 'Failed to create Supabase user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User created in Supabase',
      user: data.user 
    });
  } catch (error) {
    console.error('Error in Supabase auth sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
