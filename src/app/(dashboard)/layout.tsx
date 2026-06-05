// Dashboard shell — AC-1.5 redirect target
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{ fontFamily: 'Cairo, Tajawal, sans-serif', minHeight: '100vh', background: '#0F172A', color: '#E2E8F0' }}>
      {children}
    </div>
  )
}
