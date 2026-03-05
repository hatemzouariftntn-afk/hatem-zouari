import { mongoDB } from '@/lib/mongodb-db';

export async function listCategories() {
  try {
    const categories = await mongoDB.getAllCategories();
    return { success: true, categories };
  } catch (error) {
    console.error('خطأ في جلب الفئات:', error);
    return { success: false, error: 'فشل في جلب الفئات' };
  }
}

export async function addCategory(name: string) {
  try {
    if (!name || name.trim() === '') {
      return { success: false, error: 'اسم الفئة مطلوب' };
    }

    const category = await mongoDB.insertCategory(name);
    return { success: true, category };
  } catch (error) {
    console.error('خطأ في إضافة الفئة:', error);
    return { success: false, error: 'فشل في إضافة الفئة' };
  }
}
