// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth' // Import NextAuth directly
import { authOptions } from '../../../../lib/auth' // Import your authOptions

// The `handler` variable will be the NextAuth.js API handler
const handler = NextAuth(authOptions)

// Export GET and POST handlers
export { handler as GET, handler as POST }
