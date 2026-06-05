// AC-1.7: RTL layout shell, AC-1.8: Arabic font
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4"
      style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
