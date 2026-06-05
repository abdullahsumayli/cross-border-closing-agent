// AC-6.4: Initiate GHL OAuth flow
import { NextRequest, NextResponse } from 'next/server'
import { buildOAuthUrl } from '@/lib/ghl'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const state = crypto.randomUUID()
  const url = buildOAuthUrl(state)

  const response = NextResponse.redirect(url)
  // Store state in cookie for CSRF validation in callback
  response.cookies.set('ghl_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  })

  return response
}
