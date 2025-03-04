import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Replicate from 'replicate'
import { supabaseAdmin } from '@/lib/supabase-admin.server'
import { ensureUserProfile } from '@/lib/auth'
import { generateUUIDFromString } from '@/lib/utils'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function POST(req: Request) {
  console.log('📝 Generate API called')
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

    // Ensure user profile exists and get profile data
    console.log('🔍 Ensuring user profile exists...')
    const profile = await ensureUserProfile(userId)
    console.log('👤 User profile:', profile)
    
    if (!profile) {
      console.log('❌ Failed to get or create user profile')
      return NextResponse.json(
        { error: 'Failed to get or create user profile' },
        { status: 500 }
      )
    }
    
    if (profile.credits <= 0) {
      console.log('❌ No credits remaining')
      return NextResponse.json(
        { error: 'No credits remaining' },
        { status: 403 }
      )
    }

    // Get prompt from request
    const { prompt } = await req.json()
    console.log('💬 Prompt:', prompt)

    // Generate image with Replicate
    console.log('🎨 Generating emoji with Replicate...')
    const output = await replicate.run(
      "fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e",
      {
        input: {
          prompt: "A TOK emoji of " + prompt,
          apply_watermark: false,
          num_outputs: 1
        }
      }
    )
    
    console.log('🖼️ Raw Replicate output type:', typeof output)
    console.log('🖼️ Is array?', Array.isArray(output))
    if (Array.isArray(output)) {
      console.log('🖼️ Array length:', output.length)
      if (output.length > 0) {
        console.log('🖼️ First item type:', typeof output[0])
      }
    }

    // Validate Replicate output
    console.log('🖼️ Replicate output:', output)
    
    // Extract the image URL from the Replicate output
    let imageUrl;
    
    // Based on testing, the output is an array with a ReadableStream
    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      
      if (typeof firstItem === 'string') {
        // If it's a string, it's likely a URL
        imageUrl = firstItem;
        console.log('✅ Found URL in array:', imageUrl);
      } else if (firstItem instanceof ReadableStream) {
        // Handle ReadableStream
        console.log('🔄 Processing ReadableStream from array');
        
        try {
          const reader = firstItem.getReader();
          let chunks = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          
          // Combine all chunks into a single Uint8Array
          let totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          let combinedArray = new Uint8Array(totalLength);
          let offset = 0;
          
          for (const chunk of chunks) {
            combinedArray.set(chunk, offset);
            offset += chunk.length;
          }
          
          // Create a data URL from the binary data
          const base64 = Buffer.from(combinedArray).toString('base64');
          imageUrl = `data:image/png;base64,${base64}`;
          console.log('💾 Created data URL from binary stream');
        } catch (streamError) {
          console.error('❌ Error processing stream:', streamError);
          throw new Error('Failed to process image stream: ' + streamError.message);
        }
      } else {
        console.log('❌ First item in array is not a string or ReadableStream:', firstItem);
        throw new Error('Unexpected output format from Replicate');
      }
    } else if (typeof output === 'string') {
      // Direct string (likely a URL)
      imageUrl = output;
      console.log('✅ Direct string URL:', imageUrl);
    } else {
      console.log('❌ Unexpected output format:', output);
      throw new Error('Unexpected output format from Replicate');
    }
    
    // Final check
    if (!imageUrl) {
      console.log('❌ No image URL could be extracted');
      throw new Error('Could not extract image from Replicate response');
    }
    
    console.log('✅ Final image URL:', imageUrl.substring(0, 100), '...');

    // Deduct one credit
    console.log('💸 Deducting credit from user...')
    // Generate UUID for Supabase from Clerk ID
    const supabaseUserId = generateUUIDFromString(userId);
    console.log('🔑 Using Supabase UUID:', supabaseUserId, 'for credit deduction');
    
    const { error: creditError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('user_id', supabaseUserId)
    
    if (creditError) {
      console.log('❌ Error deducting credit:', creditError)
    } else {
      console.log('✅ Credit deducted successfully')
    }

    console.log('🚀 Returning image URL to client')
    return NextResponse.json({ imageUrl })

  } catch (error) {
    console.error('❌ Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate emoji' },
      { status: 500 }
    )
  }
}