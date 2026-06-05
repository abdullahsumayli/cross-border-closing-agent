# UX Reference Artifacts — Cross-Border Closing Agent

هذه مصادر الحقيقة للـ UX من EO-Brain Phase 5. استخدمها كـ target لأي عمل واجهة.
`/2-eo-dev-plan` يقرأها عند تخطيط الميزات البصرية.
`/4-eo-review` hat UX يقارن المكوّنات المُنشأة بهذه الـ artifacts.

**قاعدة:** مكوّن يُشحن لا يطابق الـ artifact → hat UX Q1 تنخفض إلى 6.

---

| Artifact | يغطي قصص BRD | ما يجب مطابقته |
|----------|-------------|----------------|
| `product-demo.jsx` | Story 1، Story 2 | تخطيط سير العمل الأساسي، الـ CTAs الرئيسية، الحالات الفارغة، بطاقة التأهيل |
| `onboarding-flow.jsx` | Story 1، Story 3 | شاشات التسجيل الأول، حقول النموذج، مؤشر التقدم، ربط واتساب |
| `admin-dashboard.jsx` | Story 2، Story 5 | تخطيط جدول البيانات، مواضع الفلتر، عرض بطاقات التأهيل |

---

## استخدام الـ Artifacts

```bash
# عرض artifact في المتصفح (Next.js dev server يجب أن يكون شُغّال)
# أو افتح الملف مباشرة في المتصفح:
open docs/ux-reference/product-demo.jsx
```

هذه ملفات JSX — ليست مجرد wireframes. تعكس التفاعل الحقيقي المتوقع.
