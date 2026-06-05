import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cross-Border Closing Agent',
  description: 'وكيل واتساب ذكي للاستفسارات العقارية الأجنبية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
