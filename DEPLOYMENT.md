# دليل النشر - Deployment Guide

## خيارات النشر

### 1. النشر على Vercel (الأسهل)

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# نشر التطبيق
vercel --prod
```

### 2. النشر على Netlify

1. ادفع الكود إلى GitHub
2. اربط المستودع بـ Netlify
3. إعدادات البناء:
   - Build command: `npm run build`
   - Publish directory: `.next`

### 3. النشر على خادم VPS

#### متطلبات الخادم
- Ubuntu 20.04+ أو CentOS 7+
- Node.js 18+
- PM2 (لإدارة العمليات)
- Nginx (كخادم وكيل)

#### خطوات النشر

1. **تحضير الخادم**
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PM2
sudo npm install -g pm2

# تثبيت Nginx
sudo apt install nginx -y
```

2. **رفع الملفات**
```bash
# نسخ الملفات إلى الخادم
scp -r document-archiver-project/ user@server:/var/www/

# أو استخدام Git
git clone https://github.com/your-repo/document-archiver.git /var/www/document-archiver
```

3. **تثبيت التبعيات وبناء التطبيق**
```bash
cd /var/www/document-archiver
npm install
npm run build
```

4. **إعداد PM2**
```bash
# إنشاء ملف ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'document-archiver',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/document-archiver',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# تشغيل التطبيق
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. **إعداد Nginx**
```bash
# إنشاء ملف إعداد Nginx
sudo cat > /etc/nginx/sites-available/document-archiver << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/document-archiver /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. النشر باستخدام Docker

#### إنشاء Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### إنشاء docker-compose.yml
```yaml
version: '3.8'
services:
  document-archiver:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./db:/app/db
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

#### تشغيل التطبيق
```bash
docker-compose up -d
```

## إعدادات الإنتاج

### متغيرات البيئة
```bash
NODE_ENV=production
PORT=3000
DB_PATH=./db/local.json
```

### النسخ الاحتياطية
```bash
# إنشاء نسخة احتياطية من قاعدة البيانات
cp /var/www/document-archiver/db/local.json /backup/db-$(date +%Y%m%d).json

# أتمتة النسخ الاحتياطية (crontab)
0 2 * * * cp /var/www/document-archiver/db/local.json /backup/db-$(date +\%Y\%m\%d).json
```

### مراقبة الأداء
```bash
# مراقبة PM2
pm2 monit

# عرض السجلات
pm2 logs document-archiver

# إعادة تشغيل التطبيق
pm2 restart document-archiver
```

## الأمان

### SSL/TLS (Let's Encrypt)
```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com

# تجديد تلقائي
sudo crontab -e
# إضافة: 0 12 * * * /usr/bin/certbot renew --quiet
```

### جدار الحماية
```bash
# إعداد UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## استكشاف الأخطاء

### مشاكل شائعة
1. **خطأ في الاتصال بقاعدة البيانات**
   - تأكد من وجود مجلد `db`
   - تحقق من صلاحيات الكتابة

2. **خطأ في تحميل الصفحة**
   - تحقق من سجلات PM2: `pm2 logs`
   - تأكد من تشغيل Nginx: `sudo systemctl status nginx`

3. **بطء في الأداء**
   - زيادة ذاكرة PM2
   - تحسين إعدادات Nginx

### أوامر مفيدة
```bash
# حالة الخدمات
sudo systemctl status nginx
pm2 status

# إعادة تشغيل الخدمات
sudo systemctl restart nginx
pm2 restart document-archiver

# عرض استخدام الموارد
htop
df -h
```

## التحديثات

### تحديث التطبيق
```bash
cd /var/www/document-archiver
git pull origin main
npm install
npm run build
pm2 restart document-archiver
```

### تحديث Node.js
```bash
# تحديث Node.js
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
```

---

للحصول على مساعدة إضافية، راجع الوثائق الرسمية لكل منصة أو اتصل بفريق الدعم.

