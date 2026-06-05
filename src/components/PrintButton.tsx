'use client'

// AC-8.2: Print button — Client Component wrapper (onClick needs browser context)
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        fontSize: 13,
        fontFamily: 'Cairo, Tajawal, sans-serif',
        background: '#1E293B',
        color: '#94A3B8',
        border: '1px solid #334155',
        cursor: 'pointer',
      }}
    >
      تصدير PDF
    </button>
  )
}
