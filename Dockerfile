# استخدام Node.js 18 LTS
FROM node:18-alpine AS base

# إعدادات العمل
WORKDIR /app

# نسخ ملفات الحزمة
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci --only=production

# نسخ باقي الملفات
COPY . .

# بناء التطبيق
RUN npm run build

# إعدادات المنفذ لـ Render
ENV PORT 10000
ENV HOSTNAME "0.0.0.0"

# أمر التشغيل (الأمثل لـ standalone)
CMD ["node", ".next/standalone/server.js"]
