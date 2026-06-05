// Story 3 [@WeekendMVP] [loop:money]: التسعير والاشتراك
describe.skip('Story 3 — التسعير والاشتراك', () => {
  it('AC-3.1 صفحة التسعير تعرض 2-3 شرائح (وسيط / مطوّر) بأسعار بالريال وعناوين عربية + إنجليزية @AC-3.1', async () => {
    // TODO: implement
  });

  it('AC-3.2 إعادة التوجيه لصفحة Stripe المستضافة تكتمل بنجاح (sandbox) @AC-3.2', async () => {
    // TODO: implement
  });

  it('AC-3.3 نقطة الـ webhook تتحقق من التوقيع وترفض الـ payloads غير الموقّعة بـ 401 @AC-3.3', async () => {
    // TODO: implement
  });

  it('AC-3.4 الدفع الناجح يحدّث subscriptions.status خلال 5 ثوانٍ @AC-3.4', async () => {
    // TODO: implement
  });

  it('AC-3.5 إيصال بالبريد يُرسَل عند حدث payment_intent.succeeded @AC-3.5', async () => {
    // TODO: implement
  });

  it('AC-3.6 الـ webhook idempotent — آمن عند الاستقبال مرتين (Stripe يعيد المحاولة) @AC-3.6', async () => {
    // TODO: implement
  });
});
