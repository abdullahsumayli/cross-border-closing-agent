// onboarding-flow.jsx — Cross-Border Closing Agent
// تجربة أول تشغيل (MOCKUP لمرجع Claude Code)
// يغطي BRD Story 1 (auth: تسجيل بريد+OTP) + Story 3 (money: تسعير+checkout)
import { useState } from "react";
import { Mail, Smartphone, MessageCircle, CreditCard, Check } from "lucide-react";

const TEAL = "#0D9488";
const BG = "#0F172A";
const CARD = "#1E293B";

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [tier, setTier] = useState("broker");

  const stepsMeta = ["التسجيل", "تأكيد الهاتف", "ربط واتساب", "الاشتراك"];

  return (
    <div dir="rtl" style={{ background: BG, fontFamily: "Cairo, Tajawal, sans-serif", color: "#E2E8F0", minHeight: 520, padding: 20, borderRadius: 16 }}>
      <strong style={{ fontSize: 18 }}>إعداد حسابك — Cross-Border Closing Agent</strong>

      {/* wizard progress */}
      <div style={{ display: "flex", gap: 8, margin: "16px 0 22px" }}>
        {stepsMeta.map((m, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", margin: "0 auto 6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: i < step ? TEAL : i === step ? "#0B3B36" : "#334155",
              border: i === step ? `2px solid ${TEAL}` : "none", fontSize: 13,
            }}>{i < step ? <Check size={16} /> : i + 1}</div>
            <span style={{ fontSize: 11.5, color: i === step ? "#5EEAD4" : "#94A3B8" }}>{m}</span>
          </div>
        ))}
      </div>

      <div style={{ background: CARD, borderRadius: 14, padding: 20, minHeight: 290 }}>
        {step === 0 && (
          <Field icon={Mail} title="أنشئ حسابك">
            <Input ph="البريد الإلكتروني" />
            <Input ph="رقم الجوال (�‎+966)" />
            <Input ph="اسم المكتب العقاري" />
            <small style={{ color: "#94A3B8" }}>الأسماء العربية مدعومة بالكامل (UTF-8).</small>
          </Field>
        )}
        {step === 1 && (
          <Field icon={Smartphone} title="تأكيد الهاتف">
            <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 0 }}>أدخل رمز OTP المُرسَل عبر Unifonic (ينتهي خلال 10 دقائق).</p>
            <div style={{ display: "flex", gap: 8, direction: "ltr" }}>
              {[...Array(6)].map((_, i) => (
                <input key={i} maxLength={1} style={{ width: 38, height: 46, textAlign: "center", fontSize: 20, background: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "#fff" }} />
              ))}
            </div>
          </Field>
        )}
        {step === 2 && (
          <Field icon={MessageCircle} title="اربط واتساب المكتب">
            <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 0 }}>الوكيل يستقبل الاستفسارات من هذا الرقم ويرد تلقائياً.</p>
            <Input ph="رقم واتساب Business" />
            <div style={{ background: "#0B3B36", border: `1px solid ${TEAL}`, borderRadius: 10, padding: 12, fontSize: 13, marginTop: 8 }}>
              ✓ سيُختبَر برسالة تجريبية بالأردو قبل التفعيل
            </div>
          </Field>
        )}
        {step === 3 && (
          <Field icon={CreditCard} title="اختر اشتراكك">
            <div style={{ display: "flex", gap: 10 }}>
              <Plan name="وسيط" price="990" active={tier === "broker"} onClick={() => setTier("broker")} />
              <Plan name="مطوّر" price="1,500" active={tier === "developer"} onClick={() => setTier("developer")} />
            </div>
            <button style={{ width: "100%", marginTop: 14, background: TEAL, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, cursor: "pointer" }}>
              ادفع عبر Stripe — ريال/شهر
            </button>
            <small style={{ color: "#94A3B8", display: "block", marginTop: 8 }}>دفع آمن · إيصال بالبريد فوراً · إلغاء في أي وقت</small>
          </Field>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
          style={{ background: "transparent", color: "#94A3B8", border: "1px solid #334155", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>رجوع</button>
        <button onClick={() => setStep(Math.min(3, step + 1))}
          style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", cursor: "pointer" }}>
          {step === 3 ? "ابدأ" : "متابعة"}
        </button>
      </div>
    </div>
  );
}

function Field({ icon: Icon, title, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Icon size={22} color="#0D9488" /><h2 style={{ fontSize: 17, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}
function Input({ ph }) {
  return <input placeholder={ph} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: "11px 14px", color: "#fff", fontSize: 14, fontFamily: "inherit" }} />;
}
function Plan({ name, price, active, onClick }) {
  return (
    <div onClick={onClick} style={{ flex: 1, cursor: "pointer", borderRadius: 12, padding: 16, textAlign: "center",
      background: active ? "#0B3B36" : "#0F172A", border: active ? "2px solid #0D9488" : "1px solid #334155" }}>
      <div style={{ fontSize: 14, color: "#94A3B8" }}>{name}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: active ? "#5EEAD4" : "#E2E8F0" }}>{price}</div>
      <div style={{ fontSize: 12, color: "#94A3B8" }}>ريال / شهر</div>
    </div>
  );
}
