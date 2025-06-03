import NextAuth, { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string // Add your custom id property here
            // Add any other custom properties you want in the session.user object
        } & DefaultSession['user'] // This merges with the default user properties (name, email, image)
    }

    /**
     * The shape of the user object that is returned by the `authorize` callback
     * and passed to the `jwt` and `session` callbacks.
     */
    interface User {
        id: string // Add your custom id property here
        // Add any other custom properties you want to pass from the user object in authorize()
    }
}

declare module 'next-auth/jwt' {
    /**
     * The shape of the JWT token
     */
    interface JWT {
        id: string // Add your custom id property here
        // Add any other custom properties you want to store in the JWT token
    }
}
