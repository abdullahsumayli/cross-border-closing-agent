# Deploy Runbook — Cross-Border Closing Agent

> AC-4.1 (subdomain + SSL) و AC-4.4 (uptime monitor) يتطلبان إجراءً بشرياً.
> الكود الجاهز في `main`. هذا الملف يُرشدك خطوة بخطوة.

---

## AC-4.1 — النشر على ServerFast/Contabo

### المتطلبات المسبقة

- VPS يعمل بـ Ubuntu 22.04
- نطاق مُسجَّل (مثال: `crossborder.sa`)
- أوامر: `git`, `node` v22، `npm`, `pm2`, `nginx`, `certbot`

### الخطوات

#### 1. أول وصول للخادم

```bash
ssh root@your-server-ip
```

#### 2. تثبيت Node.js 22 + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2
```

#### 3. استنساخ المشروع

```bash
cd /var/www
git clone https://github.com/abdullahsumayli/cross-border-closing-agent.git
cd cross-border-closing-agent
cp .env.example .env.local
# ← افتح .env.local واملأ جميع المتغيرات الحقيقية
nano .env.local
```

#### 4. البناء الأول

```bash
npm ci
npm run build
```

#### 5. تشغيل PM2

```bash
pm2 start npm --name cross-border-agent -- start
pm2 save
pm2 startup   # اتبع التعليمات المُعادة
```

#### 6. Nginx reverse proxy

```bash
apt-get install -y nginx
```

أنشئ `/etc/nginx/sites-available/crossborder`:

```nginx
server {
    listen 80;
    server_name app.crossborder.sa;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/crossborder /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

#### 7. SSL عبر Certbot

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d app.crossborder.sa
```

#### 8. DNS — سجل A في مسجّل النطاق

```
Type: A
Name: app
Value: your-server-ip
TTL: 3600
```

#### 9. تحقق من الصحة

```bash
curl https://app.crossborder.sa/api/health
# يجب أن يعود: {"status":"ok","db":"ok"}
```

---

## AC-4.3 — تحقق من Sentry في staging

```bash
# على الخادم (مع ENABLE_SENTRY_TEST=1 في .env.local)
curl https://app.crossborder.sa/api/sentry-test
# يجب أن يُرسل خطأً لـ Sentry Dashboard خلال 30 ثانية
```

---

## AC-4.4 — Uptime Monitor (كل 5 دقائق)

### خيار 1: Better Stack (مجاني)

1. سجّل على betterstack.com
2. اضغط **New Monitor**
3. URL: `https://app.crossborder.sa/api/health`
4. Check Frequency: **5 minutes**
5. Alert via: Email أو SMS
6. Expected status: `200`
7. Expected keyword: `"status":"ok"`

### خيار 2: Uptime Kuma (self-hosted)

```bash
docker run -d --restart=always -p 3001:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1
```

أضف monitor:
- URL: `http://localhost:3000/api/health`
- Interval: 5 دقائق
- Keyword: `ok`

---

## سكربت النشر اليومي (AC-4.5)

```bash
cd /var/www/cross-border-closing-agent
npm run deploy
```

أو مباشرةً:

```bash
git pull origin main && npm ci --omit=dev && npm run build && pm2 reload cross-border-agent --update-env
```

**Idempotent:** التشغيل مرتين = نفس النتيجة (pm2 reload لا restart).

---

## التراجع عن نشر خاطئ

```bash
git log --oneline -5          # ابحث عن الـ SHA الجيد
git checkout <good-sha>
npm ci && npm run build
pm2 reload cross-border-agent --update-env
curl http://localhost:3000/api/health
```

---

## متغيرات البيئة الضرورية على الخادم

أضف هذه في `.env.local` (انظر `.env.example` للأسماء الكاملة):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BROKER_ID
STRIPE_PRICE_DEVELOPER_ID
WHATSAPP_API_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_WEBHOOK_VERIFY_TOKEN
UNIFONIC_API_KEY
UNIFONIC_SENDER_ID
MAILGUN_API_KEY
MAILGUN_DOMAIN
NEXT_PUBLIC_SENTRY_DSN
POSTHOG_API_KEY
POSTHOG_HOST
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL=https://app.crossborder.sa
```
