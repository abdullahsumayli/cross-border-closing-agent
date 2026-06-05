export type LeadStatus = 'in_progress' | 'qualified' | 'unqualified'
export type LeadLanguage = 'en' | 'zh' | 'ms' | 'ur' | 'ar'

export interface LeadFilter {
  status?: LeadStatus
  lang?: LeadLanguage
  from?: string
  to?: string
  page?: number
}

export interface CsvLead {
  buyer_name: string | null
  buyer_phone: string
  detected_language: string | null
  status: string
  budget_sar: number | null
  seriousness_score: number | null
  created_at: string
}

export const PAGE_SIZE = 20

const VALID_STATUSES: LeadStatus[] = ['in_progress', 'qualified', 'unqualified']
const VALID_LANGS: LeadLanguage[] = ['en', 'zh', 'ms', 'ur', 'ar']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseLeadFilter(params: URLSearchParams): LeadFilter {
  const filter: LeadFilter = {}

  const status = params.get('status')
  if (status && VALID_STATUSES.includes(status as LeadStatus)) {
    filter.status = status as LeadStatus
  }

  const lang = params.get('lang')
  if (lang && VALID_LANGS.includes(lang as LeadLanguage)) {
    filter.lang = lang as LeadLanguage
  }

  const from = params.get('from')
  if (from && DATE_RE.test(from)) filter.from = from

  const to = params.get('to')
  if (to && DATE_RE.test(to)) filter.to = to

  const rawPage = parseInt(params.get('page') ?? '1', 10)
  filter.page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  return filter
}

const STATUS_AR: Record<string, string> = {
  qualified: 'مؤهَّل',
  unqualified: 'غير مؤهَّل',
  in_progress: 'قيد التأهيل',
}

const LANG_AR: Record<string, string> = {
  en: 'إنجليزي',
  zh: 'صيني',
  ms: 'ملايو',
  ur: 'أردو',
  ar: 'عربي',
}

export function formatLeadStatus(status: string): string {
  return STATUS_AR[status] ?? status
}

export function formatLanguage(lang: string): string {
  return LANG_AR[lang] ?? lang
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function buildCsvRows(leads: CsvLead[]): string {
  const header = 'الاسم,الهاتف,اللغة,الحالة,الميزانية (ريال),درجة الجدية,التاريخ'
  if (leads.length === 0) return header

  const rows = leads.map(l => [
    csvCell(l.buyer_name ?? ''),
    csvCell(l.buyer_phone),
    csvCell(formatLanguage(l.detected_language ?? '')),
    csvCell(formatLeadStatus(l.status)),
    csvCell(l.budget_sar != null ? l.budget_sar.toLocaleString('en-US') : ''),
    csvCell(l.seriousness_score?.toString() ?? ''),
    csvCell(new Date(l.created_at).toLocaleDateString('en-GB')),
  ].join(','))

  return [header, ...rows].join('\n')
}
