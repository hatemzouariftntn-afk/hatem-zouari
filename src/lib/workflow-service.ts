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

    const msg = `📊 إجمالي الوثائق المعثور عليها: ${docs.length}`;
    debugInfo.push(msg);
    console.log(msg);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in3Days = new Date(startOfToday.getTime() + 5 * 24 * 60 * 60 * 1000); // زيادة أيام الفحص للاختبار

    for (const doc of docs) {
      if (!doc.deadline) continue;

      let docDeadline = new Date(typeof doc.deadline === 'number' ? doc.deadline * 1000 : doc.deadline);
      const isUrgent = docDeadline <= in3Days;
      
      const statusMsg = `📄 الوثيقة: "${doc.title}" | الموعد: ${docDeadline.toLocaleDateString('ar-TN')} | عاجل؟: ${isUrgent ? 'نعم' : 'لا'}`;
      debugInfo.push(statusMsg);
      console.log(statusMsg);

      if (isUrgent) {
        try {
          await sendDeadlineReminderEmail(
            doc.title,
            doc.category,
            docDeadline,
            doc.userId || 'admin'
          );
          sent++;
          console.log(`✅ نداء إرسال الإيميل للوثيقة: ${doc.title}`);
        } catch (e: any) {
          failed++;
          console.error(`❌ فشل استدعاء الإرسال للوثيقة "${doc.title}":`, e.message);
        }
      }
    }
  } catch (e: any) {
    const errMsg = `🚨 خطأ عام في قاعدة البيانات: ${e.message}`;
    debugInfo.push(errMsg);
    console.error(errMsg);
  }

  return { sent, failed, debugInfo };
}
