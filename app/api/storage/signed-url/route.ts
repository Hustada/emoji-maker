import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin.server';
import { generateUUIDFromString } from '@/lib/utils';

/**
 * API endpoint to generate a signed URL for accessing Supabase Storage
 * This bypasses RLS policies by using the admin client
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the path from the query parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('🔐 Generating signed URL for path:', path);
    
    // Generate a signed URL that expires in 1 hour
    const { data, error } = await supabaseAdmin.storage
      .from('emojis')
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error) {
      console.error('❌ Error generating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }
    
    console.log('✅ Successfully generated signed URL');
    
    return NextResponse.json({ 
      signedUrl: data.signedUrl 
    });
  } catch (error) {
    console.error('❌ Error in signed URL generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
