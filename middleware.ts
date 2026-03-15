import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Start with a plain next-response so we can attach refreshed cookies to it.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies onto both the mutated request and the response so that
          // subsequent server components in the same request see the fresh tokens.
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

  // IMPORTANT: Do NOT remove this call.
  // It refreshes the session if the access token has expired, writing the new
  // tokens into `supabaseResponse` so every server component that follows
  // receives a valid session in its cookie store.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes — redirect unauthenticated users to login.
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Return the response with the (potentially refreshed) auth cookies set.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run on every request except:
     * - Next.js internals (_next/static, _next/image)
     * - Static files (favicon, images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
