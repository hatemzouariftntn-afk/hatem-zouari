import { Resend } from 'resend';

/**
 * وظيفة إرسال بريد إلكتروني عند إضافة مستند جديد باستخدام Resend
 */
export async function sendNewDocumentNotification(docTitle: string, category: string) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL || process.env.NOTIFICATION_EMAIL;

    if (!RESEND_API_KEY || !RECEIVER_EMAIL) return;

    const resend = new Resend(RESEND_API_KEY);

    try {
        await resend.emails.send({
            from: 'Document Archiver <onboarding@resend.dev>',
            to: [RECEIVER_EMAIL as string],
            subject: `📄 مستند جديد: ${docTitle}`,
            html: `
        <div style="direction: rtl; font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">تمت إضافة مستند جديد بنجاح</h2>
          <ul style="list-style: none; padding: 0;">
            <li><strong>العنوان:</strong> ${docTitle}</li>
            <li><strong>الفئة:</strong> ${category}</li>
            <li><strong>الوقت:</strong> ${new Date().toLocaleString('ar-TN-u-ca-gregory')}</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8rem; color: #666;">تم إرسال هذا التنبيه تلقائياً من نظام الأرشفة الخاص بك.</p>
        </div>
      `,
        });
    } catch (error) {
        console.error('❌ خطأ في إرسال البريد عبر Resend:', error);
    }
}

/**
 * وظيفة إرسال تنبيه بريدي عند اقتراب الموعد النهائي للرد على وثيقة
 */
export async function sendDeadlineReminderEmail(
    docTitle: string,
    category: string,
    deadline: Date,
    userId: string
) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL || process.env.NOTIFICATION_EMAIL;

    if (!RESEND_API_KEY || !RECEIVER_EMAIL) return;

    const resend = new Resend(RESEND_API_KEY);

    const deadlineStr = deadline.toLocaleDateString('ar-TN-u-ca-gregory', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const now = Date.now();
    const diffDays = Math.ceil((deadline.getTime() - now) / (1000 * 60 * 60 * 24));
    const urgencyColor = diffDays <= 0 ? '#dc2626' : diffDays <= 1 ? '#ea580c' : '#ca8a04';
    const urgencyText = diffDays <= 0 ? '🔴 فات الموعد!' : diffDays === 1 ? '🟠 اليوم الأخير!' : `🟡 متبقي ${diffDays} أيام`;

    try {
        await resend.emails.send({
            from: 'Document Archiver <onboarding@resend.dev>',
            to: [RECEIVER_EMAIL as string],
            subject: `⏰ تنبيه موعد نهائي: ${docTitle}`,
            html: `
        <div style="direction: rtl; font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${urgencyColor}; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 1.5rem;">⏰ تنبيه موعد نهائي</h1>
            <p style="margin: 8px 0 0; font-size: 1.2rem;">${urgencyText}</p>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #111827; margin: 0 0 16px;">${docTitle}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #374151;">الفئة:</td>
                <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${category}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #374151;">الموعد النهائي:</td>
                <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: ${urgencyColor}; font-weight: bold;">${deadlineStr}</td>
              </tr>
            </table>
            <div style="margin-top: 24px; padding: 16px; background: #fef9c3; border-radius: 8px; border-right: 4px solid #ca8a04;">
              <p style="margin: 0; color: #92400e;">⚠️ هذه الوثيقة تتطلب رداً قبل الموعد المحدد. يرجى مراجعة نظام الأرشفة واتخاذ الإجراء اللازم.</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 0.8rem; color: #9ca3af; text-align: center;">تم إرسال هذا التنبيه تلقائياً من نظام الأرشفة — الجامعة التونسية للسباحة</p>
          </div>
        </div>
      `,
        });
        console.log('✅ تم إرسال تنبيه الموعد النهائي بنجاح');
    } catch (error) {
        console.error('❌ خطأ في إرسال تنبيه الموعد النهائي:', error);
    }
}
