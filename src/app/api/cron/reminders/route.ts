// src/app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server';
import { checkAndSendDeadlineReminders } from '@/lib/workflow-service';

export const dynamic = 'force-dynamic'; // إجبار المتصفح على جلب بيانات جديدة دائماً وعدم التخزين

export async function GET(request: Request) {
  try {
    // التحقق من المفتاح السري لحماية النقطة من الاستدعاء العشوائي
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ محاولة استدعاء تنبيهات غير مصرح بها (Authorization failed)');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 بدء عملية فحص وإرسال المواعيد النهائية (Cron Job)...');
    const result = await checkAndSendDeadlineReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toLocaleString('ar-TN'),
      ...result
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
