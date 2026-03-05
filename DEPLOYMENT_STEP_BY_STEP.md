# خطوات نشر Document Archiver على Render

## المتطلبات الأساسية
- حساب GitHub
- حساب Render (https://render.com/)
- حساب MongoDB Atlas (https://www.mongodb.com/atlas)
- Git مثبت على جهازك

## الخطوة 1: إنشاء مستودع GitHub

1. اذهب إلى https://github.com/new
2. أدخل اسم المستودع: `document-archiver-ftn`
3. اختر Public أو Private (Public أفضل للنشر المجاني على Render)
4. لا تحدد README, .gitignore, أو license (لدينا بالفعل)
5. اضغط على "Create repository"

## الخطوة 2: رفع الكود إلى GitHub

بعد إنشاء المستودع، نفذ الأوامر التالية في مجلد المشروع:

```bash
git remote add origin https://github.com/YOUR_USERNAME/document-archiver-ftn.git
git branch -M main
git push -u origin main
```

## الخطوة 3: إعداد MongoDB Atlas

1. سجل دخولك إلى MongoDB Atlas
2. أنشئ cluster جديد (M0 Sandbox مجاني)
3. في "Database Access"، أنشئ مستخدم جديد:
   - Username: `document-archiver-user`
   - Password: أنشئ كلمة مرور قوية
4. في "Network Access"، أضف IP Address: `0.0.0.0/0` (مؤقتاً)
5. احصل على Connection String من "Connect" → "Drivers"

## الخطوة 4: إنشاء Web Service على Render

1. سجل دخولك إلى https://dashboard.render.com/
2. اضغط على "New +" → "Web Service"
3. اختر "Connect a repository"
4. اختر مستودع GitHub document-archiver-ftn
5. اضبط الإعدادات التالية:

### الإعدادات الأساسية:
- **Name**: `document-archiver`
- **Region**: اختر الأقرب لك
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### Environment Variables:
اضغط "Add Environment Variable" وأضف التالي:

```
NODE_ENV=production
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=your-random-secret-here
MONGODB_URI=mongodb+srv://document-archiver-user:PASSWORD@cluster.mongodb.net/document-archiver?retryWrites=true&w=majority
```

**ملاحظات هامة:**
- استبدل `your-app-name` باسم التطبيق الفعلي على Render
- أنشئ NEXTAUTH_SECRET عشوائي: https://generate-secret.vercel.app/
- استبدل `PASSWORD` بكلمة مرور مستخدم MongoDB
- استبدل `cluster` باسم cluster الفعلي

## الخطوة 5: فحص Network Access لـ MongoDB

بعد نشر التطبيق على Render:

1. في MongoDB Atlas، اذهب إلى "Network Access"
2. احذف IP `0.0.0.0/0`
3. أضف IP Addresses التالية لـ Render:
   - `18.224.0.0/14`
   - `44.224.0.0/14`
   - `52.44.0.0/14`
   - `54.208.0.0/14`
   - `54.212.0.0/14`
   - `54.236.0.0/14`

## الخطوة 6: التحقق من النشر

1. انتظر حتى يكتمل البناء والنشر (5-10 دقائق)
2. افتح الرابط المقدم من Render
3. جرب تسجيل حساب جديد
4. تحقق من إضافة المستندات والفئات

## مشاكل شائعة وحلولها

### مشكلة: Build يفشل
- تحقق من logs في Render
- تأكد أن جميع Environment Variables صحيحة

### مشكلة: Cannot connect to MongoDB
- تحقق من MONGODB_URI
- تأكد أن Network Access صحيح في MongoDB Atlas

### مشكلة: NextAuth لا يعمل
- تحقق من NEXTAUTH_URL (يجب أن يكون رابط التطبيق الفعلي)
- تأكد من NEXTAUTH_SECRET موجود

### مشكلة: الصفحة لا تتحمل
- تحقق من Start Command: يجب أن يكون `npm start`
- تأكد أن Build Command: يجب أن يكون `npm run build`

## الخطوة 7: النشر التلقائي (اختياري)

Render يدعم النشر التلقائي عند كل دفع إلى GitHub:
- في إعدادات Web Service، تأكد أن "Auto-Deploy" مفعّل
- سيتم إعادة بناء التطبيق تلقائياً مع كل push إلى branch main

## ملخص Environment Variables

```
NODE_ENV=production
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=random-secret-here
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
```

## الخطوات التالية

بعد النشر الناجح:
1. اختبر جميع وظائف التطبيق
2. تحقق من إضافة المستندات والبحث
3. تأكد من عمل النسخ الاحتياطي
4. راقب أداء التطبيق في لوحة تحكم Render
