# قائمة تدقيق سريعة للنشر على Render

## ✅ مكتمل
- [x] إصلاح أخطاء TypeScript
- [x] بناء ناجح للمشروع (npm run build)
- [x] تهيئة مستودع Git محلي
- [x] إنشاء ملفات النشر (render.yaml, deployment guides)

## 🔄 الخطوات التالية (نفذها بالترتيب)

### 1. GitHub (5 دقائق)
- [ ] إنشاء مستودع جديد: https://github.com/new
- [ ] الاسم: `document-archiver-ftn`
- [ ] Public (أفضل للنشر المجاني)
- [ ] تنفيذ أوامر Git من ملف `git-commands.txt`

### 2. MongoDB Atlas (10 دقائق)
- [ ] تسجيل دخول: https://www.mongodb.com/atlas
- [ ] إنشاء cluster جديد (M0 Sandbox مجاني)
- [ ] إنشاء مستخدم قاعدة بيانات
- [ ] الحصول على Connection String
- [ ] إعداد Network Access

### 3. Render (10 دقائق)
- [ ] تسجيل دخول: https://dashboard.render.com/
- [ ] New Web Service → Connect GitHub
- [ ] إعدادات البناء والبدء
- [ ] إضافة Environment Variables

### 4. الإعدادات النهائية (5 دقائق)
- [ ] تحديث MongoDB Network Access لـ Render IPs
- [ ] اختبار التطبيق
- [ ] التحقق من جميع الوظائف

## ⚠️ ملاحظات هامة

### Environment Variables المطلوبة:
```
NODE_ENV=production
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=generate-random-secret
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
```

### Render IP Addresses لم MongoDB:
- 18.224.0.0/14
- 44.224.0.0/14
- 52.44.0.0/14
- 54.208.0.0/14
- 54.212.0.0/14
- 54.236.0.0/14

## 🚀 بعد النشر
- [ ] اختبار تسجيل المستخدمين
- [ ] اختبار إضافة المستندات
- [ ] اختبار البحث والفلاتر
- [ ] اختبار النسخ الاحتياطي

## 🔧 مشاكل شائعة
- **Build fails**: تحقق من logs و Environment Variables
- **MongoDB connection**: تحقق من URI و Network Access
- **Auth issues**: تحقق من NEXTAUTH_URL و NEXTAUTH_SECRET

**الوقت المتوقع للنشر الكامل: 30-45 دقيقة**
