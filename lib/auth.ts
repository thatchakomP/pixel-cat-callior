// lib/auth.ts
import { NextAuthOptions } from 'next-auth' // Import NextAuthOptions type
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from './prisma' // Import your Prisma client
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    // Explicitly type as NextAuthOptions
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                })

                if (!user || !user.password) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    return null
                }

                // Return user object. NextAuth handles session creation.
                // Only return properties you want in the token and session for security.
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.email = user.email
                token.name = user.name
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                // Ensure that session.user matches the shape expected by useSession()
                // and add custom properties like 'id'.
                session.user = {
                    id: token.id as string,
                    email: token.email as string,
                    name: token.name as string,
                }
            }
            return session
        },
    },
    pages: {
        signIn: '/login', // Custom login page (relative to your app/ folder)
    },
    secret: process.env.NEXTAUTH_SECRET,
}

// No `export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)` here for v4.
// `NextAuth` is called in `app/api/auth/[...nextauth]/route.ts`.
// `signIn`/`signOut` helpers are imported directly from `next-auth/react` (client) or `next-auth` (server/API).
