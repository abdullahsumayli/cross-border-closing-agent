// Story 5 [@Phase2]: لوحة تحكم إدارية كاملة
// TDD: هذا الملف هو مصدر الحقيقة — الكود يخدم هذه الاختبارات

import * as fs from 'fs'
import * as path from 'path'
import {
  parseLeadFilter,
  buildCsvRows,
  formatLeadStatus,
  formatLanguage,
  PAGE_SIZE,
  type CsvLead,
} from '../src/lib/leads'

const ROOT = path.resolve(__dirname, '..')

// ─── AC-5.4: RLS — وسيط يرى بياناته فقط ────────────────────────────────────

describe('AC-5.4 — RLS policies on leads + conversations + cards', () => {
  it('migration 003 تحتوي على RLS وسياسة select_own على leads @AC-5.4', () => {
    const sql = fs.readFileSync(
      path.join(ROOT, 'supabase/migrations/003_leads.sql'),
      'utf8'
    )
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('select_own')
    expect(sql).toContain('broker_id = auth.uid()')
  })

  it('migration 004 تحتوي على RLS وسياسة select_own على conversations @AC-5.4', () => {
    const sql = fs.readFileSync(
      path.join(ROOT, 'supabase/migrations/004_conversations.sql'),
      'utf8'
    )
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('select_own')
    expect(sql).toContain('broker_id = auth.uid()')
  })

  it('migration 005 تحتوي على RLS وسياسة select_own على qualification_cards @AC-5.4', () => {
    const sql = fs.readFileSync(
      path.join(ROOT, 'supabase/migrations/005_qualification_cards.sql'),
      'utf8'
    )
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('select_own')
    expect(sql).toContain('broker_id = auth.uid()')
  })

  it('API leads route يستخدم cookie client (RLS مُفعَّل) لا service client @AC-5.4', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/leads/route.ts'),
      'utf8'
    )
    expect(content).toContain('createClient')
    expect(content).not.toContain('createServiceClient')
  })

  it('API leads/export route يستخدم cookie client (RLS مُفعَّل) @AC-5.4', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/leads/export/route.ts'),
      'utf8'
    )
    expect(content).toContain('createClient')
  })
})

// ─── AC-5.1: filter parsing ────────────────────────────────────────────────

describe('AC-5.1 — leads filter parsing', () => {
  it('يُعيد filter فارغ بدون params (page=1 افتراضي) @AC-5.1', () => {
    const f = parseLeadFilter(new URLSearchParams())
    expect(f.status).toBeUndefined()
    expect(f.lang).toBeUndefined()
    expect(f.from).toBeUndefined()
    expect(f.to).toBeUndefined()
    expect(f.page).toBe(1)
  })

  it('يقبل status=qualified @AC-5.1', () => {
    expect(parseLeadFilter(new URLSearchParams('status=qualified')).status).toBe('qualified')
  })

  it('يقبل status=unqualified @AC-5.1', () => {
    expect(parseLeadFilter(new URLSearchParams('status=unqualified')).status).toBe('unqualified')
  })

  it('يقبل status=in_progress @AC-5.1', () => {
    expect(parseLeadFilter(new URLSearchParams('status=in_progress')).status).toBe('in_progress')
  })

  it('يتجاهل status غير صالح @AC-5.1', () => {
    expect(parseLeadFilter(new URLSearchParams('status=hacked')).status).toBeUndefined()
  })

  it('يقبل lang=en | zh | ms | ur | ar @AC-5.1', () => {
    for (const lang of ['en', 'zh', 'ms', 'ur', 'ar']) {
      expect(parseLeadFilter(new URLSearchParams(`lang=${lang}`)).lang).toBe(lang)
    }
  })

  it('يتجاهل lang غير صالح @AC-5.1', () => {
    expect(parseLeadFilter(new URLSearchParams('lang=fr')).lang).toBeUndefined()
  })

  it('يقبل from + to بتنسيق YYYY-MM-DD @AC-5.1', () => {
    const f = parseLeadFilter(new URLSearchParams('from=2026-01-01&to=2026-06-30'))
    expect(f.from).toBe('2026-01-01')
    expect(f.to).toBe('2026-06-30')
  })

  it('يتجاهل from بتنسيق خاطئ @AC-5.1', () => {
    expect(parseLeadFilter(new URLSearchParams('from=01/01/2026')).from).toBeUndefined()
  })

  it('page=2 يُعيد 2 @AC-5.1', () => {
    expect(parseLeadFilter(new URLSearchParams('page=2')).page).toBe(2)
  })

  it('page سلبي أو صفر يُعيد 1 @AC-5.1', () => {
    expect(parseLeadFilter(new URLSearchParams('page=-1')).page).toBe(1)
    expect(parseLeadFilter(new URLSearchParams('page=0')).page).toBe(1)
  })

  it('PAGE_SIZE = 20 @AC-5.1', () => {
    expect(PAGE_SIZE).toBe(20)
  })
})

// ─── AC-5.1: status + language Arabic labels ──────────────────────────────

describe('AC-5.1 — Arabic status and language labels', () => {
  it('qualified → مؤهَّل @AC-5.1', () => expect(formatLeadStatus('qualified')).toBe('مؤهَّل'))
  it('unqualified → غير مؤهَّل @AC-5.1', () => expect(formatLeadStatus('unqualified')).toBe('غير مؤهَّل'))
  it('in_progress → قيد التأهيل @AC-5.1', () => expect(formatLeadStatus('in_progress')).toBe('قيد التأهيل'))
  it('en → إنجليزي @AC-5.1', () => expect(formatLanguage('en')).toBe('إنجليزي'))
  it('zh → صيني @AC-5.1', () => expect(formatLanguage('zh')).toBe('صيني'))
  it('ms → ملايو @AC-5.1', () => expect(formatLanguage('ms')).toBe('ملايو'))
  it('ur → أردو @AC-5.1', () => expect(formatLanguage('ur')).toBe('أردو'))
  it('ar → عربي @AC-5.1', () => expect(formatLanguage('ar')).toBe('عربي'))
})

// ─── AC-5.2: lead detail API + page ────────────────────────────────────────

describe('AC-5.2 — lead detail API + page', () => {
  it('API route /api/leads/[id]/route.ts موجود @AC-5.2', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/app/api/leads/[id]/route.ts'))).toBe(true)
  })

  it('API route يستعلم عن conversations + qualification_cards @AC-5.2', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/leads/[id]/route.ts'),
      'utf8'
    )
    expect(content).toContain('conversations')
    expect(content).toContain('qualification_cards')
  })

  it('API route يُعيد 404 لـ lead غير موجود @AC-5.2', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/leads/[id]/route.ts'),
      'utf8'
    )
    expect(content).toContain('404')
  })

  it('صفحة تفصيل lead موجودة @AC-5.2', () => {
    expect(
      fs.existsSync(path.join(ROOT, 'src/app/(dashboard)/leads/[id]/page.tsx'))
    ).toBe(true)
  })

  it('صفحة التفصيل تعرض card_summary_ar @AC-5.2', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/(dashboard)/leads/[id]/page.tsx'),
      'utf8'
    )
    expect(content).toContain('card_summary_ar')
  })

  it('صفحة التفصيل تُميّز الرسائل الواردة والصادرة @AC-5.2', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/(dashboard)/leads/[id]/page.tsx'),
      'utf8'
    )
    expect(content).toContain('inbound')
    expect(content).toContain('outbound')
  })
})

// ─── AC-5.3: CSV export ────────────────────────────────────────────────────

describe('AC-5.3 — CSV export', () => {
  const sampleLeads: CsvLead[] = [
    {
      buyer_name: 'John Smith',
      buyer_phone: '+60123456789',
      detected_language: 'en',
      status: 'qualified',
      budget_sar: 1200000,
      seriousness_score: 86,
      created_at: '2026-06-01T10:00:00Z',
    },
    {
      buyer_name: null,
      buyer_phone: '+8613900000000',
      detected_language: 'zh',
      status: 'in_progress',
      budget_sar: null,
      seriousness_score: null,
      created_at: '2026-06-02T12:00:00Z',
    },
  ]

  it('يُنتج header عربي كأول سطر @AC-5.3', () => {
    const header = buildCsvRows(sampleLeads).split('\n')[0]
    expect(header).toContain('الاسم')
    expect(header).toContain('الهاتف')
    expect(header).toContain('الحالة')
    expect(header).toContain('الميزانية')
  })

  it('عدد الصفوف = leads + header @AC-5.3', () => {
    const lines = buildCsvRows(sampleLeads).split('\n')
    expect(lines.length).toBe(3) // header + 2 rows
  })

  it('يحوّل status إلى عربي @AC-5.3', () => {
    const csv = buildCsvRows(sampleLeads)
    expect(csv).toContain('مؤهَّل')
    expect(csv).toContain('قيد التأهيل')
  })

  it('يحوّل اللغة إلى عربي @AC-5.3', () => {
    const csv = buildCsvRows(sampleLeads)
    expect(csv).toContain('إنجليزي')
    expect(csv).toContain('صيني')
  })

  it('buyer_name=null يكون فارغاً لا كلمة null @AC-5.3', () => {
    const csv = buildCsvRows(sampleLeads)
    expect(csv).not.toContain('"null"')
    expect(csv).not.toContain(',null,')
  })

  it('التاريخ بتنسيق DD/MM/YYYY (MENA) @AC-5.3', () => {
    const csv = buildCsvRows(sampleLeads)
    expect(csv).toContain('01/06/2026')
  })

  it('قائمة فارغة تُعيد header فقط @AC-5.3', () => {
    expect(buildCsvRows([]).split('\n').length).toBe(1)
  })

  it('export route يُعيد Content-Type text/csv + attachment @AC-5.3', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/leads/export/route.ts'),
      'utf8'
    )
    expect(content).toContain('text/csv')
    expect(content).toContain('attachment')
  })
})

// ─── AC-5.1: UI — pages + RTL + sidebar ──────────────────────────────────

describe('AC-5.1 — leads page UI (RTL + filters)', () => {
  it('صفحة leads موجودة @AC-5.1', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/app/(dashboard)/leads/page.tsx'))).toBe(true)
  })

  it('صفحة leads تحتوي على فلتر الحالة (status) @AC-5.1', () => {
    const c = fs.readFileSync(path.join(ROOT, 'src/app/(dashboard)/leads/page.tsx'), 'utf8')
    expect(c).toContain('status')
    expect(c).toContain('مؤهَّل')
  })

  it('صفحة leads تحتوي على فلتر اللغة @AC-5.1', () => {
    const c = fs.readFileSync(path.join(ROOT, 'src/app/(dashboard)/leads/page.tsx'), 'utf8')
    expect(c).toContain('lang')
    expect(c).toContain('إنجليزي')
  })

  it('صفحة leads تحتوي على زر تصدير CSV @AC-5.1 @AC-5.3', () => {
    const c = fs.readFileSync(path.join(ROOT, 'src/app/(dashboard)/leads/page.tsx'), 'utf8')
    expect(c).toContain('export')
    expect(c).toContain('CSV')
  })

  it('layout يحتوي على dir="rtl" @AC-5.1', () => {
    const c = fs.readFileSync(path.join(ROOT, 'src/app/(dashboard)/layout.tsx'), 'utf8')
    expect(c).toContain('dir="rtl"')
  })

  it('layout يحتوي على sidebar nav بروابط عربية @AC-5.1', () => {
    const c = fs.readFileSync(path.join(ROOT, 'src/app/(dashboard)/layout.tsx'), 'utf8')
    expect(c).toContain('الاستفسارات')
    expect(c).toContain('نظرة عامة')
  })
})
