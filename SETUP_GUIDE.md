# دليل الإعداد والتثبيت - نسخة محسنة

## المتطلبات الأساسية
- Node.js 18+
- حساب MongoDB Atlas (خطة مجانية)
- حساب GitHub (للنشر)

## خطوات الإعداد

### 1. إعداد MongoDB Atlas
1. اذهب إلى [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. أنشئ حساب جديد (خطة مجانية M0)
3. أنشئ مجموعة جديدة (Cluster)
4. أنشئ مستخدم قاعدة بيانات
5. احصل على Connection String
6. أضف IP Address الخاص بك (أو 0.0.0.0 للوصول من أي مكان)

### 2. إعداد متغيرات البيئة
1. انسخ ملف `.env.example` إلى `.env.local`:
```bash
cp .env.example .env.local
```

2. عدل الملف التالي:
```env
# استبدل بالبيانات الخاصة بك
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/document-archiver?retryWrites=true&w=majority
MONGODB_DB=document-archiver

# أنشئ مفتاح سري عشوائي
NEXTAUTH_SECRET=your-very-secret-key-here-min-32-characters
NEXTAUTH_URL=http://localhost:3000

NODE_ENV=development
PORT=3000
```

### 3. تثبيت التبعيات
```bash
npm install
```

### 4. تشغيل التطبيق
```bash
npm run dev
```

### 5. إنشاء حساب مستخدم
1. اذهب إلى http://localhost:3000/auth/signup
2. أنشئ حساب جديد
3. سجل دخولك

## الميزات الجديدة

### 🔐 نظام المصادقة
- تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
- إنشاء حسابات جديدة تلقائياً
- جلسات آمنة باستخدام NextAuth.js

### 💾 قاعدة بيانات سحابية
- MongoDB Atlas للتخزين الدائم
- بيانات محمية لكل مستخدم
- قابلية التوسع

### 🔄 النسخ الاحتياطي
- نسخ احتياطي تلقائي
- استعادة البيانات
- أنواع مختلفة من النسخ (كامل/تزايدي)

### ⚡ تحسين الأداء
- نظام تخزين مؤقت (Cache)
- تحميل أسرع للبيانات
- بحث محسن

## النشر على Render

### 1. إعداد MongoDB للنشر
1. في MongoDB Atlas، أضف IP Address: `0.0.0.0/0`
2. تأكد من أن قاعدة البيانات متاحة للوصول من أي مكان

### 2. رفع الكود على GitHub
```bash
git add .
git commit -m "Upgrade to cloud version with auth and performance"
git push origin main
```

### 3. إعداد Render
1. اذهب إلى [Render](https://render.com)
2. أنشئ Web Service جديد
3. اربط مستودع GitHub
4. أضف متغيرات البيئة:
   - `MONGODB_URI`: (من MongoDB Atlas)
   - `MONGODB_DB`: `document-archiver`
   - `NEXTAUTH_SECRET`: (مفتاح سري عشوائي)
   - `NEXTAUTH_URL`: `https://your-app.onrender.com`
   - `NODE_ENV`: `production`

### 4. Build and Start Commands
- Build Command: `npm run build`
- Start Command: `npm start`

## استكشاف الأخطاء

### مشاكل شائعة
1. **فشل الاتصال بـ MongoDB**
   - تحقق من Connection String
   - تأكد من إضافة IP Address الصحيح
   - تحقق من اسم المستخدم وكلمة المرور

2. **مشاكل المصادقة**
   - تحقق من NEXTAUTH_SECRET
   - تأكد من NEXTAUTH_URL صحيح
   - تحقق من متغيرات البيئة

3. **مشاكل البناء**
   - تأكد من جميع التبعيات مثبتة
   - تحقق من أخطاء TypeScript
   - امسح مجلد `.next` وأعد البناء

### حلول سريعة
```bash
# مسح الكاش وإعادة البناء
rm -rf .next node_modules
npm install
npm run build

# إعادة تعيين قاعدة البيانات
# (احذف جميع المجموعات في MongoDB Atlas)
```

## الملاحظات الهامة

### الأمان
- استخدم كلمات مرور قوية
- لا تشارك متغيرات البيئة
- فعل المصادقة الثنائية على MongoDB

### الأداء
- النسخ الاحتياطي التلقائي كل 24 ساعة
- مسح الكاش تلقائياً كل 10 دقائق
- تحسين الفهرسة في MongoDB

### التوسع
- يمكن إضافة Redis للتخزين المؤقت الموزع
- يمكن إضافة نظام إشعارات عبر البريد
- يمكن إضافة نظام صلاحيات متقدم

## الدعم الفني
- راجع الـ logs في لوحة تحكم Render
- تحقق من MongoDB Atlas logs
- راجع وثائق NextAuth.js و MongoDB
