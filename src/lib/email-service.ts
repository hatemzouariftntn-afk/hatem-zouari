import { Resend } from 'resend';

function getRecipientEmails(): string[] {
    const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL || process.env.NOTIFICATION_EMAIL;
    if (!RECEIVER_EMAIL) return [];
    return RECEIVER_EMAIL.split(',').map(e => e.trim()).filter(e => e.length > 0);
}

export async function sendNewDocumentNotification(docTitle: string, category: string) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const emails = getRecipientEmails();
    if (!RESEND_API_KEY || emails.length === 0) return;

    const resend = new Resend(RESEND_API_KEY);

    for (const email of emails) {
        try {
            const data = await resend.emails.send({
                from: 'Document Archiver <onboarding@resend.dev>',
                to: [email],
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
            </div>`,
            });
            if (data.error) console.error(`❌ فشل الإرسال إلى ${email}:`, data.error);
            else console.log(`✅ تم الإرسال بنجاح إلى ${email}`);
        } catch (err) {
            console.error(`🚨 خطأ غير متوقع أثناء الإرسال لـ ${email}:`, err);
        }
    }
}

export async function sendDeadlineReminderEmail(docTitle: string, category: string, deadline: Date, userId: string) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const emails = getRecipientEmails();
    if (!RESEND_API_KEY || emails.length === 0) return;

    const resend = new Resend(RESEND_API_KEY);
    const deadlineStr = deadline.toLocaleDateString('ar-TN-u-ca-gregory', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const now = Date.now();
    const diffDays = Math.ceil((deadline.getTime() - now) / (1000 * 60 * 60 * 24));
    const urgencyColor = diffDays <= 0 ? '#dc2626' : diffDays <= 1 ? '#ea580c' : '#ca8a04';
    const urgencyText = diffDays <= 0 ? '🔴 فات الموعد!' : diffDays === 1 ? '🟠 اليوم الأخير!' : `🟡 متبقي ${diffDays} أيام`;

    for (const email of emails) {
        try {
            const data = await resend.emails.send({
                from: 'Document Archiver <onboarding@resend.dev>',
                to: [email],
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
                        <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold;">الفئة:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${category}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold;">الموعد النهائي:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: ${urgencyColor}; font-weight: bold;">${deadlineStr}</td></tr>
                    </table>
                </div>
            </div>`,
            });
            if (data.error) console.error(`❌ فشل تنبيه الموعد لـ ${email}:`, data.error);
            else console.log(`✅ تم إرسال تنبيه الموعد بنجاح لـ ${email}`);
        } catch (err) {
            console.error(`🚨 خطأ في تنبيه الموعد لـ ${email}:`, err);
        }
    }
}
