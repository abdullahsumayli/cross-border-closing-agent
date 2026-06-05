'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'نظرة عامة' },
  { href: '/dashboard/leads', label: 'الاستفسارات' },
  { href: '/dashboard/pricing', label: 'الاشتراك' },
  { href: '/dashboard/settings', label: 'الإعدادات' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: 'Cairo, Tajawal, sans-serif',
        minHeight: '100vh',
        background: '#0F172A',
        color: '#E2E8F0',
        display: 'flex',
      }}
    >
      {/* sidebar */}
      <nav
        style={{
          width: 180,
          background: '#0B1220',
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}
      >
        <strong style={{ fontSize: 14, color: '#5EEAD4', marginBottom: 16, display: 'block' }}>
          Cross-Border
        </strong>
        {NAV.map(({ href, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 14,
                textDecoration: 'none',
                background: active ? '#1E293B' : 'transparent',
                color: active ? '#5EEAD4' : '#94A3B8',
                fontFamily: 'inherit',
              }}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* main */}
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
