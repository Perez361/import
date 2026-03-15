import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/dashboard/',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only check auth for protected routes
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // If not a protected route, just pass through
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // For protected routes, create response and check auth
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Get session - this will also refresh the session if needed
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // If no session or error, redirect to login
    if (error || !session) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    
  } catch (error) {
    // If there's any error, allow the request through
    // The server components will handle auth checks
    console.error('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
