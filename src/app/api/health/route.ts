import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// AC-4.2: service client avoids cookie dependency — works outside request context
export async function GET() {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('brokers').select('id').limit(1)
    return NextResponse.json({ status: 'ok', db: error ? 'error' : 'ok' })
  } catch {
    return NextResponse.json({ status: 'ok', db: 'pending' })
  }
}
