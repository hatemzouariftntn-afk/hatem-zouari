import nodemailer from 'nodemailer';

/**
 * وظيفة إرسال بريد إلكتروني عند إضافة مستند جديد
 */
export async function sendNewDocumentNotification(docTitle: string, category: string) {
    // إعدادات البريد (تؤخذ من متغيرات البيئة في Render)
    const EMAIL_USER = process.env.NOTIFICATION_EMAIL;
    const EMAIL_PASS = process.env.NOTIFICATION_PASSWORD;
    const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL || EMAIL_USER;

    // التحقق من وجود الإعدادات
    console.log('📧 محاولة إرسال بريد تنبيه...');
    console.log('📧 الإيميل المرسل:', EMAIL_USER);
    console.log('📧 الإيميل المستلم:', RECEIVER_EMAIL);

    if (!EMAIL_USER || !EMAIL_PASS) {
        console.error('❌ خطأ: متغيرات NOTIFICATION_EMAIL أو NOTIFICATION_PASSWORD غير موجودة في إعدادات البيئة');
        return;
    }

    // إنشاء "ناقل" البريد باستخدام إعدادات Gmail الصريحة لتجنب الـ Timeout
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // استخدام SSL
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
        connectionTimeout: 10000, // 10 ثواني كحد أقصى للاتصال
    });

    const mailOptions = {
        from: `"أرشيف المستندات" <${EMAIL_USER}>`,
        to: RECEIVER_EMAIL,
        subject: `📄 مستند جديد: ${docTitle}`,
        html: `
      <div style="direction: rtl; font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">تمت إضافة مستند جديد بنجاح</h2>
        <p>تفاصيل المستند:</p>
        <ul style="list-style: none; padding: 0;">
          <li><strong>العنوان:</strong> ${docTitle}</li>
          <li><strong>الفئة:</strong> ${category}</li>
          <li><strong>الوقت:</strong> ${new Date().toLocaleString('ar')}</li>
        </ul>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8rem; color: #666;">تم إرسال هذا التنبيه تلقائياً من نظام الأرشفة الخاص بك.</p>
      </div>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ تم إرسال البريد بنجاح:', info.messageId);
    } catch (error) {
        console.error('❌ خطأ في إرسال البريد:', error);
    }
}
