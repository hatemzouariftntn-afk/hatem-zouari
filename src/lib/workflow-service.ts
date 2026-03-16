// src/lib/workflow-service.ts
// خدمة إدارة سير العمل والتنبيهات الذكية

import { getCollection } from './mongodb';
import { DocumentDocument } from './mongodb';
import { sendDeadlineReminderEmail } from './email-service';

export type DeadlineStatus = 'overdue' | 'today' | 'soon' | 'upcoming' | 'none';

/**
 * تحديد حالة الموعد النهائي بشكل بصري
 */
export function getDeadlineStatus(deadlineTimestamp: number | null): DeadlineStatus {
  if (!deadlineTimestamp) return 'none';

  const now = Date.now();
  const deadline = deadlineTimestamp * 1000; // تحويل من Unix timestamp
  const diffMs = deadline - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'overdue';       // فات الموعد
  if (diffDays < 1) return 'today';          // اليوم
  if (diffDays <= 3) return 'soon';          // خلال 3 أيام
  return 'upcoming';                         // بعيد
}

/**
 * الحصول على لون وأيقونة الموعد النهائي
 */
export function getDeadlineVisual(status: DeadlineStatus): { color: string; bg: string; icon: string; label: string } {
  switch (status) {
    case 'overdue': return { color: '#dc2626', bg: '#fef2f2', icon: '🔴', label: 'فات الموعد' };
    case 'today':   return { color: '#ea580c', bg: '#fff7ed', icon: '🟠', label: 'اليوم الأخير' };
    case 'soon':    return { color: '#ca8a04', bg: '#fefce8', icon: '🟡', label: 'قريباً' };
    case 'upcoming':return { color: '#16a34a', bg: '#f0fdf4', icon: '🟢', label: 'ضمن الموعد' };
    case 'none':    return { color: '#6b7280', bg: '#f9fafb', icon: '⚪', label: 'لا يوجد موعد' };
  }
}

/**
 * تنسيق الموعد النهائي للعرض بالعربية
 */
export function formatDeadline(deadlineTimestamp: number | null, locale: string = 'ar-TN'): string | null {
  if (!deadlineTimestamp) return null;
  const date = new Date(deadlineTimestamp * 1000);
  return date.toLocaleDateString('ar-TN-u-ca-gregory', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * المسح الدوري للوثائق التي اقترب موعد ردها — يُستدعى من نقطة النهاية /api/cron/reminders
 */
export async function checkAndSendDeadlineReminders(): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    const collection = await getCollection<DocumentDocument>('documents');

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // البحث عن الوثائق التي موعدها خلال 3 أيام القادمة ولم يتم إرسال تنبيه لها اليوم
    const urgentDocs = await collection.find({
      deadline: {
        $gte: now,
        $lte: in3Days
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
