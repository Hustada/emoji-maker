import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin.server';
import { generateUUIDFromString } from '@/lib/utils';

/**
 * API endpoint to like/unlike an emoji
 */
export async function POST(req: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { emojiId, like } = await req.json();
    
    if (!emojiId) {
      return NextResponse.json({ error: 'Missing emojiId' }, { status: 400 });
    }

    // Update likes count in the emojis table
    const { data, error } = await supabaseAdmin
      .from('emojis')
      .update({
        likes_count: like ? 1 : 0  // Increment or decrement likes
      })
      .eq('id', emojiId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update likes:', error);
      return NextResponse.json(
        { error: 'Failed to update likes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
