// admin-dashboard.jsx — Cross-Border Closing Agent
// لوحة الإدارة الكاملة (MOCKUP لمرجع Claude Code) — v2
// يغطي BRD Story 5 (لوحة تحكم إدارية كاملة) + يعرض مقاييس Story 8
import { useState } from "react";
import { LayoutDashboard, Users, FileText, Settings, Globe, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TEAL = "#0D9488";
const BG = "#0F172A";
const CARD = "#1E293B";

const trend = [
  { d: "السبت", inq: 4, q: 3 }, { d: "الأحد", inq: 6, q: 4 }, { d: "الاثنين", inq: 5, q: 4 },
  { d: "الثلاثاء", inq: 8, q: 6 }, { d: "الأربعاء", inq: 7, q: 5 }, { d: "الخميس", inq: 9, q: 7 },
];
const langs = [
  { l: "إنجليزي", n: 14 }, { l: "صيني", n: 9 }, { l: "ملايو", n: 7 }, { l: "أردو", n: 5 },
];
const feed = [
  ["ليد جاهز", "مشترٍ ماليزي · 1.2M ريال · 86/100", "#5EEAD4"],
  ["تأهيل جديد", "مشترٍ تركي · قيد التقييم", "#FBBF24"],
  ["غير مؤهَّل", "مشترٍ باكستاني · خارج النطاق القانوني", "#94A3B8"],
  ["دفع ناجح", "اشتراك وسيط · 990 ريال", "#5EEAD4"],
];

export default function AdminDashboard() {
  const [nav, setNav] = useState("dashboard");
  return (
    <div dir="rtl" style={{ background: BG, fontFamily: "Cairo, Tajawal, sans-serif", color: "#E2E8F0", minHeight: 540, borderRadius: 16, display: "flex", overflow: "hidden" }}>
      {/* sidebar */}
      <div style={{ width: 180, background: "#0B1220", padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        <strong style={{ fontSize: 15, marginBottom: 14, color: "#5EEAD4" }}>لوحة الإدارة</strong>
        {[["dashboard", "نظرة عامة", LayoutDashboard], ["leads", "الاستفسارات", Users], ["cards", "البطاقات", FileText], ["settings", "الإعدادات", Settings]].map(([k, label, Icon]) => (
          <button key={k} onClick={() => setNav(k)} style={{
            display: "flex", alignItems: "center", gap: 9, background: nav === k ? CARD : "transparent",
            color: nav === k ? "#5EEAD4" : "#94A3B8", border: "none", borderRadius: 8, padding: "10px 12px", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", textAlign: "right",
          }}><Icon size={17} /> {label}</button>
        ))}
      </div>

      {/* main */}
      <div style={{ flex: 1, padding: 20, overflow: "auto" }}>
        <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>أداء المكتب — آخر 7 أيام</h2>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
          <Kpi label="الاستفسارات" value="39" />
          <Kpi label="نسبة التأهيل" value="74%" accent />
          <Kpi label="متوسط زمن الرد" value="27 ث" icon={Clock} />
          <Kpi label="ليدات جاهزة" value="12" accent />
        </div>

        {/* charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 18 }}>
          <Panel title="الاستفسارات مقابل المؤهَّلة">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={trend}>
                <XAxis dataKey="d" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} width={20} />
                <Tooltip contentStyle={{ background: CARD, border: "none", borderRadius: 8 }} />
                <Line type="monotone" dataKey="inq" stroke="#64748B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="q" stroke={TEAL} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="لغات المشترين">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={langs}>
                <XAxis dataKey="l" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} width={20} />
                <Tooltip contentStyle={{ background: CARD, border: "none", borderRadius: 8 }} />
                <Bar dataKey="n" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* feed */}
        <Panel title="النشاط الأخير">
          {feed.map(([t, sub, c], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < feed.length - 1 ? "1px solid #334155" : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
              <span style={{ fontSize: 13.5, minWidth: 90 }}>{t}</span>
              <span style={{ fontSize: 13, color: "#94A3B8" }}>{sub}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent, icon: Icon }) {
  return (
    <div style={{ background: CARD, borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 5 }}>{Icon && <Icon size={13} />}{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent ? "#5EEAD4" : "#E2E8F0", marginTop: 4 }}>{value}</div>
    </div>
  );
}
function Panel({ title, children }) {
  return (
    <div style={{ background: CARD, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13.5, color: "#94A3B8", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
