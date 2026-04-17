import { createAdminClient } from '@/lib/supabase/admin-client'

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  sound?: 'default'
  data?: Record<string, unknown>
  badge?: number
}

// Look up Expo push tokens for a list of auth user IDs (server-side, bypasses RLS)
export async function getTokensForUsers(userIds: string[]): Promise<string[]> {
  if (!userIds.length) return []
  const admin = createAdminClient()
  const { data } = await admin
    .from('push_tokens')
    .select('token')
    .in('user_id', userIds)
  return (data ?? []).map((r: { token: string }) => r.token)
}

// Send push notifications via Expo's push API (batched at 100 per request)
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const valid = tokens.filter(t => t.startsWith('ExponentPushToken['))
  if (!valid.length) return

  const messages: ExpoPushMessage[] = valid.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }))

  // Expo Push API accepts up to 100 messages per request
  for (let i = 0; i < messages.length; i += 100) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    }).catch(() => {}) // non-blocking — don't fail the action if push fails
  }
}
