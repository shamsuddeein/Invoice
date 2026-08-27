import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

// Edge-safe: middleware runs on the edge runtime, so it uses the provider-less,
// DB-free authConfig — NOT lib/auth.js, which imports the libSQL client. The JWT
// session cookie is all that's needed to gate routes here.
const { auth } = NextAuth(authConfig)

// Gate every page/API route behind the single-user session. Logged-out users
// are bounced to /login; logged-in users hitting /login are sent to /dashboard.
export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/dashboard', req.nextUrl))
    }
    return
  }

  if (!isLoggedIn) {
    const url = new URL('/login', req.nextUrl)
    return Response.redirect(url)
  }
})

// Run on everything except NextAuth's own endpoints, Next internals, and static files.
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)'],
}
