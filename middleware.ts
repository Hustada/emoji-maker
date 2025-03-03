import { NextResponse } from 'next/server'
import { clerkMiddleware, auth } from '@clerk/nextjs/server'

// This function runs before Clerk middleware to sync with Supabase
async function supabaseSyncMiddleware(req: Request) {
  const { userId } = auth()
  
  // Only attempt to sync if user is logged in
  if (userId) {
    // Check if we need to sync with Supabase
    const url = new URL(req.url)
    
    // Don't sync on API routes to avoid infinite loops
    if (!url.pathname.startsWith('/api/')) {
      try {
        // Call our profile API endpoint
        await fetch(`${url.origin}/api/auth/profile`, {
          method: 'POST',
          headers: {
            // Forward the auth cookie
            cookie: req.headers.get('cookie') || ''
          }
        })
      } catch (error) {
        // Silently continue if sync fails
        console.error('Sync with Supabase failed:', error)
      }
    }
  }
  
  return NextResponse.next()
}

export default clerkMiddleware({
  beforeAuth: (req) => {
    return NextResponse.next()
  },
  afterAuth: async (auth, req) => {
    // Only run Supabase sync if user is authenticated
    if (auth.userId) {
      return await supabaseSyncMiddleware(req)
    }
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)', // Don't run middleware on static files
    '/', // Run middleware on index page
    '/(api|trpc)(.*)' // Run middleware on API routes
  ]
}
