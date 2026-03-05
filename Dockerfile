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

# كشف المنفذ
EXPOSE 3000

# أمر التشغيل
CMD ["npm", "start"]
