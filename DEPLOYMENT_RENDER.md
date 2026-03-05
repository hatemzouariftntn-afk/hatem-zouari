# خطوات نشر تطبيق Document Archiver على Render مجاناً

## المتطلبات الأساسية
1. حساب على [Render](https://render.com)
2. مستودع GitHub للمشروع
3. حساب GitHub مع تمكين GitHub Pages (اختياري)

## الخطوات بالتفصيل

### الخطوة 1: رفع المشروع على GitHub
```bash
git init
git add .
git commit -m "Initial commit - Document Archiver for Render"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/document-archiver.git
git push -u origin main
```

### الخطوة 2: إنشاء حساب على Render
1. اذهب إلى [render.com](https://render.com)
2. سجل حساب جديد باستخدام GitHub
3. اختر الخطة المجانية (Free Plan)

### الخطوة 3: إنشاء Web Service جديد
1. بعد تسجيل الدخول، اضغط على "New +"
2. اختر "Web Service"
3. اختر مستودع GitHub الخاص بالمشروع
4. اضغط على "Connect"

### الخطوة 4: إعدادات Web Service
1. **Name**: document-archiver
2. **Environment**: Node
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`
5. **Node Version**: 18 (أو الأحدث)
6. **Instance Type**: Free
7. **Region**: اختر الأقرب لجمهورك المستهدف

### الخطوة 5: متغيرات البيئة (Environment Variables)
أضف المتغيرات التالية:
- `NODE_ENV`: `production`
- `PORT`: `3000`

### الخطوة 6: إعدادات متقدمة (Advanced Settings)
1. **Health Check Path**: `/`
2. **Auto-Deploy**: Yes (للتحديث التلقائي عند دفع كود جديد)
3. **HTTPS**: يتم تفعيله تلقائياً

### الخطوة 7: النشر
1. اضغط على "Create Web Service"
2. انتظر حتى يكتمل البناء والنشر (يستغرق 5-10 دقائق)
3. سيتم منحك رابط مثل: `https://document-archiver.onrender.com`

## ملاحظات هامة

### قيود الخطة المجانية
- **الوقت**: التطبيق يذهب للسكون بعد 15 دقيقة من عدم الاستخدام
- **الاستيقاظ**: يستغرق 30-60 ثانية للاستيقاظ عند أول طلب
- **البيانات**: البيانات تُخزن في `/tmp` وقد تُفقد عند إعادة التشغيل
- **النطاق الترددي**: 100GB شهرياً
- **وقت البناء**: 15 دقيقة شهرياً

### حل مشكلة البيانات
لحفظ البيانات بشكل دائم، يمكنك:
1. استخدام خدمات خارجية مثل MongoDB Atlas (خطة مجانية)
2. استخدام Render Disk Storage (مدفوع)
3. عمل نسخ احتياطية دورية

### تحديث التطبيق
عند إجراء أي تغييرات على الكود:
```bash
git add .
git commit -m "Update description"
git push origin main
```
سيقوم Render تلقائياً بإعادة بناء ونشر التطبيق.

### مراقبة الأداء
- راقب استخدام الموارد من لوحة تحكم Render
- تحقق من الـ logs لتشخيص المشاكل
- استخدم Health Checks للتأكد من أن التطبيق يعمل

## استكشاف الأخطاء

### مشاكل شائعة
1. **Build Failed**: تحقق من ملف `package.json` و `next.config.js`
2. **Application Error**: تحقق من الـ logs في لوحة تحكم Render
3. **Database Issues**: تأكد من مسار قاعدة البيانات في `/tmp`

### الحلول
1. تأكد من أن جميع التبعيات مذكورة في `package.json`
2. تحقق من أن التطبيق يعمل محلياً قبل النشر
3. استخدم `npm run build` محلياً للتأكد من عدم وجود أخطاء

## استضافة بديلة مجانية
إذا واجهت مشاكل مع Render، يمكنك استخدام:
- **Vercel**: أفضل لدعم Next.js
- **Netlify**: جيد للمواقع الثابتة
- **Railway**: بديل جيد لـ Render
- **Heroku**: خطة مجانية محدودة

## الخطوات التالية
1. إضافة نظام مصادقة المستخدمين
2. استخدام قاعدة بيانات سحابية دائمة
3. إضافة ميزات النسخ الاحتياطي
4. تحسين الأداء والذاكرة
