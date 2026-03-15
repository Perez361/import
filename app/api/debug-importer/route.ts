import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // 1. Who is the current user?
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated', detail: userError?.message })
  }

  // 2. Does an importer record exist?
  const { data: importerData, error: selectError } = await supabase
    .from('importers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // 3. If no record, try inserting and capture the error
  let insertError = null
  if (!importerData) {
    const emailPrefix = (user.email || '').split('@')[0]
      .toLowerCase().replace(/[^a-z0-9]/g, '_')
    const { error: ie } = await supabase.from('importers').insert({
      user_id: user.id,
      email: user.email,
      business_name: user.user_metadata?.business_name || emailPrefix,
      full_name: user.user_metadata?.full_name || '',
      username: user.user_metadata?.username || emailPrefix,
      phone: user.user_metadata?.phone || '',
      location: user.user_metadata?.location || '',
      store_slug: emailPrefix,
    })
    insertError = ie
  }

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    metadata: user.user_metadata,
    importerFound: !!importerData,
    importer: importerData,
    selectError: selectError ? { code: selectError.code, message: selectError.message, details: selectError.details } : null,
    insertError: insertError ? { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint } : null,
  })
}
