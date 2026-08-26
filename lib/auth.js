import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Single-user credentials auth. `authorize` reads ONLY env vars (no db import)
// so this module stays edge-safe and can be imported by middleware.js.
// Both AUTH_SECRET and NEXTAUTH_SECRET are set in the environment; trustHost is
// required behind Vercel's proxy.
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize(credentials) {
        const username = credentials?.username
        const password = credentials?.password
        const okUser = process.env.OWNER_USERNAME
        const okPass = process.env.OWNER_PASSWORD
        if (username && password && username === okUser && password === okPass) {
          return { id: '1', name: username }
        }
        return null
      },
    }),
  ],
})
