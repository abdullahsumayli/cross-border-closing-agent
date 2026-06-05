import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { status: 'ok', db: 'pending' },
    { status: 200 }
  )
}
