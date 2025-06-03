// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const { nextUrl } = req
        const isLoggedIn = !!req.nextauth.token

        // Redirect authenticated users from auth pages (login/register)
        if (
            isLoggedIn &&
            (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register'))
        ) {
            return NextResponse.redirect(new URL('/', nextUrl))
        }

        // For all other routes, `withAuth`'s `authorized` callback will handle authentication check and redirection.
        // This function will only be called for paths that match `config.matcher`.
        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => {
                // This callback is called by `withAuth` to determine if the user is authorized to access the route.
                // It runs for all routes included in the `config.matcher`.
                return !!token // Allow if token exists. If false, redirects to `pages.signIn`.
            },
        },
        pages: {
            signIn: '/login',
        },
    }
)

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT for the ones starting with:
         * - /api/auth (NextAuth.js internal API routes like /api/auth/callback)
         * - /api/user/register (Our custom public registration API route)
         * - /login (Our custom login page)
         * - /register (Our custom registration page)
         * - /_next/ (Next.js internal files: _next/static, _next/image, _next/webpack, etc.)
         * - /favicon.ico (Favicon file)
         * - /cats/ (Our public static assets directory)
         *
         * The `.*` at the end means "match any characters following".
         * This regex effectively protects all routes that are NOT explicitly excluded here.
         */
        '/((?!api/auth|api/user/register|login|register|_next|favicon.ico|cats/).*)',
        //                   ^                                          ^    ^
        //                   |                                          |    |
        //                   |                                          |    This is the key: `cats/` ensures all subpaths are excluded.
        //                   |                                          `_next` covers all Next.js internal folders.
        //                   Added this specific API route
    ],
}
