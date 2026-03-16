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

    const now = new Date();
    // ضبط الوقت لبداية اليوم الحالي (00:00:00) لضمان شمول مواعيد اليوم بالكامل
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in3Days = new Date(startOfToday.getTime() + 3 * 24 * 60 * 60 * 1000);

    // البحث عن الوثائق التي موعدها فات (Overdue) أو اليوم (Today) أو خلال 3 أيام
    // وحالتها ليست "مكتملة"
    const urgentDocs = await collection.find({
      deadline: {
        $lte: in3Days,
        $ne: null
      },
      status: { $ne: 'done' }
    }).toArray();

    for (const doc of urgentDocs) {
      try {
        if (doc.deadline) {
          await sendDeadlineReminderEmail(
            doc.title,
            doc.category,
            doc.deadline,
            doc.userId
          );
          sent++;
        }
      } catch (e) {
        console.error(`فشل إرسال التنبيه للوثيقة ${doc._id}:`, e);
        failed++;
      }
    }
  } catch (e) {
    console.error('خطأ في فحص التنبيهات:', e);
  }

  return { sent, failed };
}
