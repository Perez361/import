import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if importer profile already exists
        const { data: existingImporter } = await supabase
          .from('importers')
          .select('id')
          .eq('user_id', user.id)
          .single()

        // Create importer profile if it doesn't exist
        if (!existingImporter) {
          await supabase.from('importers').insert({
            user_id: user.id,
            email: user.email,
            business_name: user.user_metadata?.business_name ?? '',
            full_name: user.user_metadata?.full_name ?? '',
            username: user.user_metadata?.username ?? '',
            phone: user.user_metadata?.phone ?? '',
            location: user.user_metadata?.location ?? '',
          })
        }

        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Redirect to login with error flag if anything goes wrong
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
