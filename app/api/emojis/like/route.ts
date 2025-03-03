import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin.server';
import { generateUUIDFromString } from '@/lib/utils';

/**
 * API endpoint to like/unlike an emoji
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Generate UUID for Supabase from Clerk ID
    const supabaseUserId = generateUUIDFromString(userId);
    console.log('🔑 Using Supabase UUID:', supabaseUserId, 'for like operation');
    
    // Get the emoji ID from the request body
    const { emojiId, like } = await request.json();
    
    if (!emojiId) {
      return NextResponse.json(
        { error: 'Emoji ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`${like ? '❤️' : '💔'} ${like ? 'Liking' : 'Unliking'} emoji:`, emojiId);
    
    // Increment or decrement the likes_count
    const { data, error } = await supabaseAdmin
      .from('emojis')
      .update({ 
        likes_count: like 
          ? supabaseAdmin.rpc('increment_likes', { row_id: emojiId })
          : supabaseAdmin.rpc('decrement_likes', { row_id: emojiId })
      })
      .eq('id', emojiId)
      .select('likes_count')
      .single();
    
    if (error) {
      console.error('❌ Error updating likes:', error);
      return NextResponse.json(
        { error: 'Failed to update likes' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      likes: data.likes_count 
    });
    
  } catch (error) {
    console.error('❌ Error in like/unlike endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
