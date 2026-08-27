// Edge-safe NextAuth config shared by the middleware (edge runtime) and the
// full server auth in lib/auth.js. Deliberately provider-less and DB-free so
// the middleware bundle never pulls in the libSQL client. lib/auth.js spreads
// this and adds the Credentials provider (whose authorize() reads the DB) for
// the Node route handler. Both AUTH_SECRET and NEXTAUTH_SECRET are set in the
// environment; trustHost is required behind Vercel's proxy.
export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
}
