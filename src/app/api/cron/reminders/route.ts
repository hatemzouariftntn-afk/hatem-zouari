// src/app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server';
import { checkAndSendDeadlineReminders } from '@/lib/workflow-service';

export const dynamic = 'force-dynamic'; // إجبار المتصفح على جلب بيانات جديدة دائماً وعدم التخزين

export async function GET(request: Request) {
  try {
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
