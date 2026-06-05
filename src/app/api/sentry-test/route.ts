import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

// AC-4.3: staging-only endpoint to verify Sentry integration
export async function GET() {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_SENTRY_TEST) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  Sentry.captureException(
    new Error('[SentryTest] AC-4.3 — intentional test error, ignore in production')
  )
  return NextResponse.json({ captured: true, message: 'Sentry test event sent' })
}
