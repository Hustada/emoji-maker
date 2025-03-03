import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin.server'
import crypto from 'crypto'
import { generateUUIDFromString } from '@/lib/utils'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses } = evt.data
    const primaryEmail = email_addresses?.[0]?.email_address || `${id}@example.com`
    
    console.log('📝 Processing Clerk webhook for user:', id)
    
    // First, ensure user exists in Supabase Auth
    try {
      // Generate a UUID v4 from the Clerk user ID
      const supabaseUserId = generateUUIDFromString(id);
      console.log('📝 Generated Supabase UUID:', supabaseUserId, 'from Clerk ID:', id);
      
      // Check if the user already exists in Supabase Auth
      const { data: existingAuthUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId)
      
      if (getUserError || !existingAuthUser?.user) {
        console.log('🔄 Creating matching Supabase Auth user for Clerk user:', id)
        
        // Create a Supabase user with the UUID generated from Clerk ID
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: primaryEmail,
          password: crypto.randomUUID(), // Random password, won't be used
          user_metadata: { clerkId: id },
          email_confirm: true,
          id: supabaseUserId // Use the generated UUID instead of the Clerk ID
        })
        
        if (createUserError) {
          console.error('❌ Error creating Supabase Auth user:', createUserError)
          // Continue anyway to create the profile
        } else {
          console.log('✅ Successfully created Supabase Auth user:', newUser.user.id)
        }
      } else {
        console.log('✅ Supabase Auth user already exists:', existingAuthUser.user.id)
      }
    } catch (authError) {
      console.error('❌ Error in Supabase Auth operation:', authError)
      // Continue anyway to create the profile
    }

    // Check if user exists in profiles table
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', id)
      .single()

    if (!existingUser) {
      console.log('🔄 Creating user profile in Supabase for user:', id)
      // Create new user profile
      const { error } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: id,
          credits: 3,
          tier: 'free'
        })

      if (error) {
        console.error('❌ Error creating user profile:', error)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
      console.log('✅ Successfully created user profile')
    } else {
      console.log('✅ User profile already exists')
    }
  }

  return NextResponse.json({ success: true })
}
