// src/app/api/cron/reminders/route.ts
// نقطة نهاية تُستدعى بشكل دوري (يومياً) للتحقق من الوثائق التي اقترب موعد ردها

import { NextResponse } from 'next/server';
import { checkAndSendDeadlineReminders } from '@/lib/workflow-service';

export async function GET(request: Request) {
  // التحقق من المفتاح السري لحماية النقطة من الاستدعاء العشوائي
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret';

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkAndSendDeadlineReminders();
    return NextResponse.json({
      success: true,
      message: `تم فحص التنبيهات: ${result.sent} مُرسل، ${result.failed} فشل`,
      ...result
    });
  } catch (error: any) {
    console.error('خطأ في cron التنبيهات:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
