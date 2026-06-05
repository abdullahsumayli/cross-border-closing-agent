// Story 3 [@WeekendMVP] [loop:money]
describe.skip('Story 3 — التسعير والاشتراك', () => {
  it('صفحة تسعير 2-3 شرائح بالريال @AC-3.1', async () => { /* TODO */ });
  it('Stripe checkout sandbox يكتمل @AC-3.2', async () => { /* TODO */ });
  it('webhook يتحقق من التوقيع، يرفض غير موقّع 401 @AC-3.3', async () => { /* TODO */ });
  it('دفع ناجح يحدّث subscriptions.status خلال 5s @AC-3.4', async () => { /* TODO */ });
  it('إيصال بريد عند payment_intent.succeeded @AC-3.5', async () => { /* TODO */ });
  it('webhook idempotent @AC-3.6', async () => { /* TODO */ });
});
