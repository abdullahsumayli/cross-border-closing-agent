import Link from 'next/link'

const TEAL = '#0D9488'
const TEAL_LIGHT = '#5EEAD4'
const BG = '#0F172A'
const CARD = '#1E293B'
const BORDER = '#334155'
const TEXT = '#E2E8F0'
const MUTED = '#94A3B8'

export default function LandingPage() {
  return (
    <div dir="rtl" style={{ background: BG, minHeight: '100vh', fontFamily: 'Cairo, Tajawal, sans-serif', color: TEXT }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: TEAL_LIGHT }}>Cross-Border Agent</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" style={{ color: MUTED, textDecoration: 'none', fontSize: 14, padding: '8px 16px' }}>
            دخول
          </Link>
          <Link href="/register" style={{ background: TEAL, color: '#fff', textDecoration: 'none', fontSize: 14, padding: '8px 20px', borderRadius: 8, fontWeight: 600 }}>
            ابدأ مجاناً
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
        <div style={{ display: 'inline-block', background: '#0B3B36', color: TEAL_LIGHT, fontSize: 13, padding: '6px 16px', borderRadius: 99, marginBottom: 24, border: `1px solid ${TEAL}` }}>
          🚀 وكيل واتساب ذكي للوسيط العقاري السعودي
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.3, margin: '0 auto 20px', maxWidth: 700 }}>
          حوّل كل استفسار أجنبي إلى<br />
          <span style={{ color: TEAL_LIGHT }}>صفقة مؤهَّلة خلال 60 ثانية</span>
        </h1>
        <p style={{ fontSize: 18, color: MUTED, maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.7 }}>
          المشتري يكتب بالإنجليزي أو الصيني أو الأردي — الوكيل يرد بلغته، يؤهّله بـ 5 أسئلة، ويصلك تقرير عربي كامل فوراً على واتساب.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ background: TEAL, color: '#fff', textDecoration: 'none', fontSize: 16, padding: '14px 32px', borderRadius: 10, fontWeight: 700 }}>
            ابدأ مجاناً الآن
          </Link>
          <Link href="/login" style={{ background: CARD, color: TEXT, textDecoration: 'none', fontSize: 16, padding: '14px 32px', borderRadius: 10, border: `1px solid ${BORDER}` }}>
            لديّ حساب
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: 'flex', justifyContent: 'center', gap: 0, padding: '0 24px 60px', flexWrap: 'wrap' }}>
        {[
          { num: '70%', label: 'من الاستفسارات الأجنبية تُضيَّع بدون رد مناسب' },
          { num: '60 ث', label: 'الوقت اللازم لتوصيل بطاقة التأهيل للوسيط' },
          { num: '5', label: 'أسئلة فقط لتأهيل المشتري الأجنبي كاملاً' },
        ].map(({ num, label }) => (
          <div key={num} style={{ flex: '1 1 200px', maxWidth: 260, textAlign: 'center', padding: '28px 20px', borderRight: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: TEAL_LIGHT, marginBottom: 8 }}>{num}</div>
            <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>{label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 24px', background: CARD, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, marginBottom: 48 }}>كيف يعمل؟</h2>
        <div style={{ display: 'flex', gap: 24, maxWidth: 900, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { step: '١', title: 'المشتري يرسل على واتساب', desc: 'بأي لغة — إنجليزية، صينية، أردية، ماليزية' },
            { step: '٢', title: 'الوكيل يرد بلغته', desc: 'ويسأله 5 أسئلة تأهيل: الميزانية، التوقيت، النوع، الأهلية القانونية' },
            { step: '٣', title: 'تقرير عربي فوري', desc: 'يصلك على واتساب خلال 60 ثانية مع درجة الجدية ونقاط العميل' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ flex: '1 1 240px', maxWidth: 280, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: TEAL, color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                {step}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 24px', maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, marginBottom: 48 }}>كل ما يحتاجه الوسيط</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { icon: '🌍', title: 'دعم متعدد اللغات', desc: 'إنجليزية · صينية · أردية · ماليزية · عربية — كلها مدعومة' },
            { icon: '⚡', title: 'رد فوري 24/7', desc: 'لا تضيّع استفساراً بسبب فارق التوقيت أو عطلة نهاية الأسبوع' },
            { icon: '📋', title: 'بطاقة تأهيل عربية', desc: 'ميزانية، توقيت، نوع العقار، الأهلية القانونية — في رسالة واحدة' },
            { icon: '📊', title: 'لوحة تحليلات', desc: 'تتبّع معدل التأهيل، درجات الجدية، أداء الاستفسارات شهرياً' },
            { icon: '🔗', title: 'تكامل CRM', desc: 'يُضيف العميل لـ GoHighLevel تلقائياً بمجرد إتمام التأهيل' },
            { icon: '🔒', title: 'بيانات محمية', desc: 'RLS على كل جدول — كل وسيط يرى بياناته فقط' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '60px 24px 80px', background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>جاهز تحوّل استفساراتك الأجنبية لصفقات؟</h2>
        <p style={{ color: MUTED, fontSize: 16, marginBottom: 32 }}>سجّل الآن وابدأ خلال دقائق</p>
        <Link href="/register" style={{ background: TEAL, color: '#fff', textDecoration: 'none', fontSize: 17, padding: '16px 40px', borderRadius: 10, fontWeight: 700, display: 'inline-block' }}>
          ابدأ مجاناً
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: `1px solid ${BORDER}`, color: MUTED, fontSize: 13 }}>
        Cross-Border Closing Agent — وكيل إغلاق الصفقات العقارية الدولية
      </footer>

    </div>
  )
}
