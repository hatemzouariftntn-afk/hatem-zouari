import { Resend } from 'resend';

/**
 * وظيفة إرسال بريد إلكتروني عند إضافة مستند جديد باستخدام Resend
 */
export async function sendNewDocumentNotification(docTitle: string, category: string) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    // في النسخة المجانية من Resend يجب أن ترسل الإشعارات إلى نفس إيميل حسابك في Resend
    const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL || process.env.NOTIFICATION_EMAIL;

    console.log('📧 محاولة إرسال بريد تنبيه عبر Resend...');
    console.log('📧 الإيميل المستلم:', RECEIVER_EMAIL);

    if (!RESEND_API_KEY) {
        console.error('❌ خطأ: مفتاح RESEND_API_KEY غير موجود في إعدادات البيئة');
        return;
    }

    if (!RECEIVER_EMAIL) {
        console.error('❌ خطأ: إيميل المستلم غير محدد. يرجى إضافة RECEIVER_EMAIL أو NOTIFICATION_EMAIL في المتغيرات.');
        return;
    }

    const resend = new Resend(RESEND_API_KEY);

    try {
        const data = await resend.emails.send({
            from: 'Document Archiver <onboarding@resend.dev>', // Resend يسمح بهذا الإيميل كمرسل في الخطة المجانية
            to: [RECEIVER_EMAIL as string],
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
        });

        console.log('✅ تم إرسال البريد بنجاح عبر Resend:', data);
    } catch (error) {
        console.error('❌ خطأ في إرسال البريد عبر Resend:', error);
    }
}
