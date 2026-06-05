// Story 4 [@WeekendMVP] [loop:deploy] [loop:observability]: النشر للإنتاج + فحص الصحة
describe.skip('Story 4 — النشر للإنتاج + فحص الصحة', () => {
  it('AC-4.1 التطبيق منشور على ServerFast/Contabo؛ subdomain مخصص يُحَل بشهادة SSL صالحة @AC-4.1', async () => {
    // TODO: implement
  });

  it('AC-4.2 /api/health يرجّع 200 بجسم {"status":"ok","db":"ok"} @AC-4.2', async () => {
    // TODO: implement
  });

  it('AC-4.3 Sentry يلتقط خطأً مُطلَقاً عمداً في staging خلال 30 ثانية @AC-4.3', async () => {
    // TODO: implement
  });

  it('AC-4.4 uptime ping يفحص /api/health كل 5 دقائق @AC-4.4', async () => {
    // TODO: implement
  });

  it('AC-4.5 سكربت النشر idempotent — التشغيل مرتين لا ينتج diff @AC-4.5', async () => {
    // TODO: implement
  });

  it('AC-4.6 تحليلات أساسية (PostHog) تسجّل حدثي signup و payment @AC-4.6', async () => {
    // TODO: implement
  });
});
