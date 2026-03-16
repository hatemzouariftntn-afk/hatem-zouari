// src/lib/workflow-utils.ts
// دوال مساعدة PURE لا تعتمد على أي مكتبة خادم - آمنة للاستخدام في Client Components

export type DeadlineStatus = 'overdue' | 'today' | 'soon' | 'upcoming' | 'none';

/**
 * تحديد حالة الموعد النهائي بشكل بصري
 */
export function getDeadlineStatus(deadlineTimestamp: number | null): DeadlineStatus {
  if (!deadlineTimestamp) return 'none';

  const now = Date.now();
  const deadline = deadlineTimestamp * 1000;
  const diffMs = deadline - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'overdue';
  if (diffDays < 1) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'upcoming';
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
export function formatDeadline(deadlineTimestamp: number | null): string | null {
  if (!deadlineTimestamp) return null;
  const date = new Date(deadlineTimestamp * 1000);
  return date.toLocaleDateString('ar-TN-u-ca-gregory', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
