// src/lib/workflow-service.ts
// دوال خادم فقط (Server-Only) - لا تستوردها في Client Components

// Re-export utilities for server-side convenience
export { getDeadlineStatus, getDeadlineVisual, formatDeadline } from './workflow-utils';
export type { DeadlineStatus } from './workflow-utils';

import { getCollection } from './mongodb';
import { DocumentDocument } from './mongodb';
import { sendDeadlineReminderEmail } from './email-service';

/**
 * المسح الدوري للوثائق التي اقترب موعد ردها — يُستدعى من نقطة النهاية /api/cron/reminders
 */
export async function checkAndSendDeadlineReminders(): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    const collection = await getCollection<DocumentDocument>('documents');

    // جلب كل الوثائق التي لديها موعد نهائي ولم تكتمل بعد
    console.log('🔍 جاري البحث عن مواعيد تقترب...');
    const urgentDocs = await collection.find({
      deadline: { $ne: null },
      status: { $ne: 'done' }
    }).toArray();

    console.log(`📊 تم العثور على ${urgentDocs.length} وثيقة لديها موعد نهائي وقيد الانتظار.`);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in3Days = new Date(startOfToday.getTime() + 4 * 24 * 60 * 60 * 1000); // زيادة النطاق لـ 4 أيام للأمان

    for (const doc of urgentDocs) {
      if (!doc.deadline) continue;
      
      const docDeadline = new Date(doc.deadline);
      
      // إذا كان الموعد فات أو اليوم أو خلال الـ 3 أيام القادمة
      if (docDeadline <= in3Days) {
        console.log(`✉️ جاري إرسال تنبيه للوثيقة: ${doc.title} (الموعد: ${docDeadline.toLocaleDateString()})`);
        try {
          await sendDeadlineReminderEmail(
            doc.title,
            doc.category,
            doc.deadline,
            doc.userId || 'admin'
          );
          sent++;
        } catch (e) {
          console.error(`❌ فشل إرسال التنبيه للوثيقة ${doc._id}:`, e);
          failed++;
        }
      } else {
        console.log(`⏭️ تخطي الوثيقة ${doc.title}: الموعد بعيد جداً (${docDeadline.toLocaleDateString()})`);
      }
    }
  } catch (e) {
    console.error('خطأ عام في فحص التنبيهات:', e);
  }

  return { sent, failed };
}
