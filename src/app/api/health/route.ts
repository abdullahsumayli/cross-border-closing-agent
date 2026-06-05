import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    // Light DB check — just verify connection
    const { error } = await supabase.from('brokers').select('count').limit(1)
    const dbStatus = error ? 'error' : 'ok'

    return NextResponse.json(
      { status: 'ok', db: dbStatus },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { status: 'ok', db: 'pending' },
      { status: 200 }
    )
  }
}
