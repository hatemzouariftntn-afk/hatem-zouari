'use server';

import { db } from '@/lib/db';

export async function listCategories() {
  try {
    const categories = await db.getAllCategories();
    return { success: true, categories };
  } catch (error) {
    console.error('خطأ في جلب الفئات:', error);
    return { success: false, error: 'فشل في جلب الفئات' };
  }
}

export async function addCategory(name: string) {
  try {
    // هذه الوظيفة يمكن تطويرها لاحقًا لإضافة فئات جديدة
    return { success: false, error: 'إضافة الفئات غير مدعومة حاليًا' };
  } catch (error) {
    console.error('خطأ في إضافة الفئة:', error);
    return { success: false, error: 'فشل في إضافة الفئة' };
  }
}

