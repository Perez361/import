import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawState = searchParams.get('state')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  // Parse state param (set by GoogleButton with type + storeSlug + redirectTo)
  let stateType: 'importer' | 'customer' = 'importer'
  let storeSlug: string | null = null
  let redirectTo: string = next

  if (rawState) {
    try {
      const state = JSON.parse(rawState)
      stateType = state.type ?? 'importer'
      storeSlug = state.storeSlug ?? null
      redirectTo = state.redirectTo ?? next
    } catch {
      // malformed state — fall through with defaults
    }
  }

  if (stateType === 'customer' && storeSlug) {
    // ── Customer Google sign-in ──────────────────────────────────────────────
    // Find the store
    const { data: importer } = await supabase
      .from('importers')
      .select('id')
      .eq('store_slug', storeSlug)
      .single()

    if (!importer) {
      return NextResponse.redirect(`${origin}/store/${storeSlug}?error=store_not_found`)
    }

    // Check if customer record already exists for this store
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .eq('store_id', importer.id)
      .maybeSingle()

    if (!existingCustomer) {
      // Create customer row — use email prefix as fallback name/username
      const emailPrefix = (user.email ?? '').split('@')[0]
      await supabase.from('customers').insert({
        store_id: importer.id,
        user_id: user.id,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? emailPrefix,
        username: emailPrefix,
        contact: user.user_metadata?.phone ?? '',
        email: user.email ?? '',
        location: '',
        shipping_address: '',
      })
    }

    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  // ── Importer Google sign-in ────────────────────────────────────────────────
  // Block if this user is already a customer (not an importer)
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingCustomer) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=customer_account`)
  }

  // Check / create importer profile
  const { data: existingImporter } = await supabase
    .from('importers')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingImporter) {
    const emailPrefix = (user.email ?? '')
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30)

    const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? emailPrefix

    await supabase.from('importers').insert({
      id: user.id,
      user_id: user.id,
      email: user.email,
      business_name: name,
      full_name: name,
      username: emailPrefix,
      phone: '',
      location: '',
      store_slug: emailPrefix,
    })
  }

  return NextResponse.redirect(`${origin}${redirectTo}`)
}