import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cross-Border Closing Agent',
  description: 'وكيل واتساب ذكي للاستفسارات العقارية الأجنبية',
}

// AC-1.7: 375px viewport support
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // lang="ar" + dir="rtl": Arabic RTL, Cairo/Tajawal fonts activated globally
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
