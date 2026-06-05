// AC-6.4: Handle GHL OAuth callback — exchange code for tokens + store in ghl_connections
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/ghl'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect('/dashboard/settings?ghl=error&reason=no_code')
  }

  // CSRF: validate state matches cookie
  const storedState = req.cookies.get('ghl_oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect('/dashboard/settings?ghl=error&reason=state_mismatch')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect('/login')
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    await supabase.from('ghl_connections').upsert({
      broker_id: user.id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      location_id: tokens.locationId,
      expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'broker_id' })

    const response = NextResponse.redirect('/dashboard/settings?ghl=connected')
    response.cookies.delete('ghl_oauth_state')
    return response
  } catch (err) {
    console.error('[GHL callback] token exchange failed:', err)
    return NextResponse.redirect('/dashboard/settings?ghl=error&reason=token_exchange')
  }
}
