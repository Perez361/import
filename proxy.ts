import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/dashboard']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only check auth for protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // If not a protected route, just pass through
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // For protected routes, create response and check auth.
  // Must use NextResponse.next({ request }) — not just headers — so Supabase
  // can forward updated cookies (e.g. refreshed tokens) on the response.
  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          // When Supabase refreshes a token it calls setAll.
          // Rebuild supabaseResponse so refreshed cookies are forwarded on
          // both the mutated request and the outgoing response.
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // getUser() validates the JWT server-side — more reliable than getSession()
    // for auth gating because it cannot return a stale/cached result.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // If no user or error, redirect to login
    if (error || !user) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } catch (err) {
    // If there's any error, allow the request through.
    // The server components will handle auth checks.
    console.error('Proxy error:', err)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
