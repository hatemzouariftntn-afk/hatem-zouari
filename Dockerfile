FROM node:18-alpine AS base

# إعدادات العمل
WORKDIR /app

# نسخ ملفات الحزمة
COPY package*.json ./

# تثبيت التبعيات
RUN npm install

# نسخ باقي الملفات
COPY . .

# تعطيل التحقق من قاعدة البيانات أثناء البناء
ENV MONGODB_URI="mongodb://localhost:27017/dummy"
RUN npm run build

# إعدادات التشغيل لـ Render
ENV PORT 10000
ENV NODE_ENV production

EXPOSE 10000

# أمر التشغيل المعياري لـ Next.js
CMD ["npm", "start"]
