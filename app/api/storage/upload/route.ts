import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin.server';
import { generateUUIDFromString } from '@/lib/utils';
import { Buffer } from 'buffer';
import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint to handle file uploads to Supabase Storage
 * This bypasses RLS policies by using the admin client
 */
export async function POST(request: NextRequest) {
  try {
    // Debug environment variables
    console.log('🔑 Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
    });
    
    // Try to get userId from Clerk auth
    let { userId } = auth();
    
    // If Clerk auth fails, try to get userId from request headers or body
    if (!userId) {
      console.log('⚠️ No userId from Clerk auth, checking request...');
      
      // Check if we have JSON content
      if (request.headers.get('content-type')?.includes('application/json')) {
        try {
          // Clone the request to avoid consuming the body
          const clonedRequest = request.clone();
          const body = await clonedRequest.json();
          if (body.userId) {
            userId = body.userId;
            console.log('🔑 Found userId in JSON body:', userId);
          }
        } catch (e) {
          console.error('❌ Error parsing JSON body:', e);
        }
      }
      
      // If still no userId, check if it's in the file name
      if (!userId && request.headers.get('content-type')?.includes('multipart/form-data')) {
        try {
          const clonedRequest = request.clone();
          const formData = await clonedRequest.formData();
          const fileName = formData.get('fileName') as string;
          
          if (fileName && fileName.includes('/')) {
            // Extract userId from fileName (format: userId/timestamp.png)
            userId = fileName.split('/')[0];
            console.log('🔑 Extracted userId from fileName:', userId);
          }
        } catch (e) {
          console.error('❌ Error parsing form data:', e);
        }
      }
      
      // If we still don't have a userId, return unauthorized
      if (!userId) {
        console.log('❌ No userId found in request');
        return NextResponse.json(
          { success: false, error: 'Unauthorized - No user ID provided' },
          { status: 401 }
        );
      }
    }
    
    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';
    let file: Buffer | File;
    let fileName: string;
    
    console.log('📤 Server: Content-Type:', contentType);
    
    if (contentType.includes('application/json')) {
      // Handle JSON request (data URL)
      try {
        const body = await request.json();
        
        if (!body.dataUrl || !body.fileName) {
          return NextResponse.json(
            { success: false, error: 'dataUrl and fileName are required for JSON requests' },
            { status: 400 }
          );
        }
        
        console.log('📤 Server: Received data URL for upload');
        fileName = body.fileName;
        
        // Get userId from JSON body if it exists
        if (body.userId) {
          // Override userId from auth with the one from JSON body
          userId = body.userId;
          console.log('🔑 Using userId from JSON body:', userId);
        }
        
        // Extract the base64 data from the data URL
        const matches = body.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
          return NextResponse.json(
            { success: false, error: 'Invalid data URL format' },
            { status: 400 }
          );
        }
        
        // Convert base64 to buffer
        file = Buffer.from(matches[2], 'base64');
        console.log('📤 Server: Converted data URL to buffer, size:', file.length);
      } catch (error) {
        console.error('❌ Server: Error parsing JSON:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid JSON format' },
          { status: 400 }
        );
      }
    } else if (contentType.includes('multipart/form-data')) {
      // Handle FormData request (file upload)
      try {
        console.log('📤 Server: Processing multipart form data');
        const formData = await request.formData();
        file = formData.get('file') as File;
        fileName = formData.get('fileName') as string;
        
        // Get userId from form data if it exists
        const formUserId = formData.get('userId');
        if (formUserId && typeof formUserId === 'string') {
          // Override userId from auth with the one from form data
          userId = formUserId;
          console.log('🔑 Using userId from form data:', userId);
        }
        
        if (!file || !fileName) {
          return NextResponse.json(
            { success: false, error: 'File and fileName are required for form data requests' },
            { status: 400 }
          );
        }
        
        console.log('📤 Server: Received file upload, filename:', fileName);
      } catch (error) {
        console.error('❌ Server: Error parsing form data:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid form data' },
          { status: 400 }
        );
      }
    } else {
      console.error('❌ Server: Unsupported content type:', contentType);
      return NextResponse.json(
        { success: false, error: 'Unsupported content type' },
        { status: 400 }
      );
    }
    
    console.log('📤 Server: Uploading file to Supabase Storage:', fileName);
    
    // Create a direct Supabase client if needed
    let client = supabaseAdmin;
    
    // If supabaseAdmin doesn't seem to be initialized correctly, create a direct client
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('⚠️ Server: SUPABASE_SERVICE_ROLE_KEY not found, using direct client creation');
      // Use environment variables directly
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtamhsd25vbGJvd2Viam14bHhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDg3NDU3NSwiZXhwIjoyMDU2NDUwNTc1fQ.H5TTIUPh2VKK8ugpH0ITEBwn7AMQZAahEBBCrEx2jgQ';
      
      if (!supabaseUrl) {
        console.error('❌ Server: NEXT_PUBLIC_SUPABASE_URL not found');
        return NextResponse.json(
          { success: false, error: 'Supabase URL not configured' },
          { status: 500 }
        );
      }
      
      console.log('🔄 Server: Creating direct Supabase client');
      client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    
    // Upload the file to Supabase Storage
    const { data, error } = await client.storage
      .from('emojis')
      .upload(fileName, file, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Server: Storage error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    // Get the public URL for the stored image
    const { data: publicUrlData } = client.storage
      .from('emojis')
      .getPublicUrl(data.path);
    
    console.log('✅ Server: Upload successful, path:', data.path);
    
    // Extract the prompt from the fileName (format: userId/timestamp.png)
    // If we don't have a prompt, use 'Generated Emoji' as default
    const prompt = request.headers.get('x-emoji-prompt') || 'Generated Emoji';
    console.log('💬 Server: Using prompt:', prompt);
    
    // Extract the Supabase UUID from the userId
    const supabaseUserId = generateUUIDFromString(userId);
    console.log('🔑 Server: Using Supabase UUID for database insert:', supabaseUserId);
    
    // Insert emoji metadata into the database
    console.log('📝 Server: Inserting emoji metadata into database');
    const { data: emojiData, error: dbError } = await client
      .from('emojis')
      .insert([
        {
          image_url: publicUrlData.publicUrl,
          prompt: prompt,
          creator_user_id: supabaseUserId
        }
      ])
      .select()
      .single();
    
    if (dbError) {
      console.error('❌ Server: Database error:', dbError);
      return NextResponse.json({
        success: true, // Still return success for the upload
        path: data.path,
        publicUrl: publicUrlData.publicUrl,
        dbError: dbError.message
      });
    }
    
    console.log('✅ Server: Emoji metadata inserted successfully:', emojiData);
    
    return NextResponse.json({
      success: true,
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
      emojiData
    });
  } catch (error: any) {
    console.error('❌ Server: Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
