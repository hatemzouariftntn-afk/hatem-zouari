// src/lib/workflow-service.ts
export { getDeadlineStatus, getDeadlineVisual, formatDeadline } from './workflow-utils';
export type { DeadlineStatus } from './workflow-utils';

import { getCollection } from './mongodb';
import { DocumentDocument } from './mongodb';
import { sendDeadlineReminderEmail } from './email-service';

export async function checkAndSendDeadlineReminders(): Promise<{ sent: number; failed: number; debugInfo: string[] }> {
  let sent = 0;
  let failed = 0;
  let debugInfo: string[] = [];

  try {
    const collection = await getCollection<DocumentDocument>('documents');
    
    // جلب كل الوثائق التي لديها موعد نهائي وحالتها ليست 'done'
    const docs = await collection.find({
      deadline: { $ne: null },
      status: { $ne: 'done' }
    }).toArray();

    debugInfo.push(`📊 إجمالي الوثائق المعثور عليها: ${docs.length}`);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in3Days = new Date(startOfToday.getTime() + 4 * 24 * 60 * 60 * 1000);

    for (const doc of docs) {
      if (!doc.deadline) {
        debugInfo.push(`⏭️ تخطي الوثيقة "${doc.title}": لا يوجد موعد.`);
        continue;
      }

      // تحويل الموعد للتنسيق الصحيح (ثواني إلى ميللي ثانية)
      let docDeadline = new Date(typeof doc.deadline === 'number' ? doc.deadline * 1000 : doc.deadline);
      
      const isUrgent = docDeadline <= in3Days;
      debugInfo.push(`📄 الوثيقة: "${doc.title}" | الموعد: ${docDeadline.toLocaleDateString('ar-TN')} | عاجل؟: ${isUrgent ? 'نعم' : 'لا'}`);

      if (isUrgent) {
        try {
          await sendDeadlineReminderEmail(
            doc.title,
            doc.category,
            docDeadline,
            doc.userId || 'admin'
          );
          sent++;
          debugInfo.push(`✅ تم إرسال الإيميل للوثيقة: ${doc.title}`);
        } catch (e: any) {
          failed++;
          debugInfo.push(`❌ فشل الإرسال للوثيقة "${doc.title}": ${e.message}`);
        }
      }
    }
  } catch (e: any) {
    debugInfo.push(`🚨 خطأ عام في قاعدة البيانات: ${e.message}`);
  }

  return { sent, failed, debugInfo };
}
