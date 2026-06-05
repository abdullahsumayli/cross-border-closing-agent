// product-demo.jsx — Cross-Border Closing Agent
// سير العمل الأساسي (MOCKUP لمرجع Claude Code، ليس كود إنتاج)
// يغطي BRD Story 1 (auth/ربط واتساب) + Story 2 (domain: استقبال→رد→تأهيل→بطاقة)
import { useState } from "react";
import { MessageCircle, Globe, CheckCircle2, FileText, Clock, ChevronLeft } from "lucide-react";

const TEAL = "#0D9488";
const BG = "#0F172A";
const CARD = "#1E293B";

export default function ProductDemo() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: MessageCircle,
      title: "استفسار أجنبي يصل واتساب المكتب",
      body: "مشترٍ ماليزي يكتب بالإنجليزية الساعة 2 فجراً. الوسيط نائم.",
      chat: [{ from: "buyer", lang: "EN", text: "Hi, is the Riyadh project open for foreign ownership? My budget is around 1.2M SAR." }],
    },
    {
      icon: Globe,
      title: "الوكيل يرد خلال 30 ثانية بلغته",
      body: "كشف اللغة تلقائي. رد فوري — لا انتظار، لا ترجمة يدوية.",
      chat: [
        { from: "buyer", lang: "EN", text: "Is the Riyadh project open for foreign ownership?" },
        { from: "agent", lang: "EN", text: "Yes — under the Jan 2026 law, this zone is open to foreign buyers. May I ask 5 quick questions to match you with the right unit?" },
      ],
    },
    {
      icon: CheckCircle2,
      title: "تأهيل بـ5 أسئلة محددة",
      body: "الميزانية · الجدول · الجنسية/الأهلية · نوع العقار · الجدية.",
      qa: [
        ["الميزانية", "1.2M ريال ✓"],
        ["الجدول الزمني", "خلال 3 أشهر ✓"],
        ["الجنسية / الأهلية", "ماليزي — مؤهَّل قانونياً ✓"],
        ["نوع العقار", "شقة سكنية ✓"],
        ["الجدية", "جاهز للشراء — 86/100 ✓"],
      ],
    },
    {
      icon: FileText,
      title: "بطاقة تأهيل عربية تصل الوسيط",
      body: "يصحى على فرصة مرتّبة — لا على رسالة لا يفهمها.",
      card: true,
    },
  ];

  const s = steps[step];
  const Icon = s.icon;

  return (
    <div dir="rtl" style={{ background: BG, fontFamily: "Cairo, Tajawal, sans-serif", color: "#E2E8F0", minHeight: 520, padding: 20, borderRadius: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: TEAL }} />
        <strong style={{ fontSize: 18 }}>Cross-Border Closing Agent</strong>
        <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 4, color: "#94A3B8", fontSize: 13 }}>
          <Clock size={14} /> رد خلال 30 ثانية
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, margin: "14px 0" }}>
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? TEAL : "#334155" }} />
        ))}
      </div>

      <div style={{ background: CARD, borderRadius: 14, padding: 18, minHeight: 320 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Icon size={22} color={TEAL} />
          <h2 style={{ fontSize: 17, margin: 0 }}>{s.title}</h2>
        </div>
        <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 0 }}>{s.body}</p>

        {s.chat && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {s.chat.map((m, i) => (
              <div key={i} dir={m.lang === "EN" ? "ltr" : "rtl"} style={{
                alignSelf: m.from === "agent" ? "flex-start" : "flex-end",
                background: m.from === "agent" ? TEAL : "#334155",
                color: m.from === "agent" ? "#fff" : "#E2E8F0",
                padding: "10px 14px", borderRadius: 12, maxWidth: "85%", fontSize: 13.5,
              }}>
                <span style={{ opacity: 0.7, fontSize: 11, display: "block" }}>{m.from === "agent" ? "الوكيل" : "المشتري"} · {m.lang}</span>
                {m.text}
              </div>
            ))}
          </div>
        )}

        {s.qa && (
          <div style={{ marginTop: 12 }}>
            {s.qa.map(([q, a], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #334155", fontSize: 14 }}>
                <span style={{ color: "#94A3B8" }}>{q}</span>
                <span style={{ color: "#5EEAD4" }}>{a}</span>
              </div>
            ))}
          </div>
        )}

        {s.card && (
          <div style={{ marginTop: 12, background: "#0B3B36", border: `1px solid ${TEAL}`, borderRadius: 12, padding: 16 }}>
            <strong style={{ color: "#5EEAD4", fontSize: 15 }}>🟢 بطاقة تأهيل — ليد جاهز</strong>
            <div style={{ fontSize: 14, marginTop: 10, lineHeight: 1.9 }}>
              <div>الاسم: مشترٍ ماليزي (EN)</div>
              <div>الميزانية: <b>1.2M ريال</b></div>
              <div>الجدول: خلال 3 أشهر</div>
              <div>الأهلية القانونية: <b style={{ color: "#5EEAD4" }}>مؤهَّل ✓</b></div>
              <div>درجة الجدية: <b>86/100</b></div>
              <div style={{ marginTop: 8, color: "#94A3B8" }}>📲 وصلت على واتساب المكتب · اتصل أولاً</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
          style={{ background: "transparent", color: "#94A3B8", border: "1px solid #334155", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>السابق</button>
        <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1}
          style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          التالي <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}
