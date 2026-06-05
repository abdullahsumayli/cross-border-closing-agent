// AC-6.4: Disconnect GHL integration — delete connection record
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('ghl_connections')
    .delete()
    .eq('broker_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
