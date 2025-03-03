// This is a client-safe version that doesn't actually create a Supabase client
// All server components should import from supabase-admin.server.ts instead

// Create a dummy object that throws errors if any method is called
const createDummyHandler = () => {
  return new Proxy({}, {
    get: function(target, prop) {
      if (typeof prop === 'string') {
        // Return another proxy for nested properties
        return createDummyHandler();
      }
      return undefined;
    },
    apply: function() {
      throw new Error('supabaseAdmin methods cannot be called from client components');
    }
  });
};

// Export a dummy object that will throw errors if used
export const supabaseAdmin = createDummyHandler();