'use server';

import { z } from 'zod';
import { mongoDB } from '@/lib/mongodb-db';
import { Document } from '@/types';
import { revalidatePath } from 'next/cache';

const documentSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  content: z.string().min(1, 'المحتوى مطلوب'),
  tags: z.string().nullable(),
  category: z.string().nullable(),
  mimeType: z.string().nullable(),
  originalFileName: z.string().nullable(),
});

export async function createDocument(formData: FormData) {
  try {
    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      tags: formData.get('tags') as string,
      category: formData.get('category') as string,
      mimeType: formData.get('mimeType') as string,
      originalFileName: formData.get('originalFileName') as string,
    };

    const validatedData = documentSchema.parse(rawData);

    const tagsArray = validatedData.tags
      ? validatedData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    let finalContent = validatedData.content;
    
    // رفع الملف إلى السحابة أو الاحتفاظ به كنص
    if (validatedData.mimeType && validatedData.originalFileName && process.env.CLOUDINARY_API_SECRET) {
      console.log('☁️ جاري رفع الملف إلى Cloudinary...');
      try {
        const { uploadToCloudinary } = await import('@/lib/cloudinary-service');
        const uploadRes = await uploadToCloudinary(validatedData.content, validatedData.mimeType, validatedData.originalFileName);
        
        if (uploadRes.success && uploadRes.url) {
          finalContent = uploadRes.url; // استبدال الـ base64 بالرابط السريع والخفيف
          console.log('✅ تم رفع الملف بنجاح:', finalContent);
        } else {
          console.warn('⚠️ فشل الرفع للسحابة، سيتم الحفظ داخلياً:', uploadRes.error);
        }
      } catch (err) {
        console.error('⚠️ خطأ في التخاطب مع Cloudinary:', err);
      }
    }

    const newDocument = await mongoDB.insertDocument({
      title: validatedData.title,
      content: finalContent,
      tags: tagsArray.length > 0 ? tagsArray : null,
      category: validatedData.category || 'عام',
      mimeType: validatedData.mimeType || null,
      originalFileName: validatedData.originalFileName || null,
    });


    revalidatePath('/');

    // 📩 إرسال إشعار بالبريد الإلكتروني
    try {
      const { sendNewDocumentNotification } = await import('@/lib/email-service');
      // سننتظر الإرسال الآن لتجربة نجاح العملية
      await sendNewDocumentNotification(validatedData.title, validatedData.category || 'عام');
    } catch (emailError) {
      console.warn('⚠️ فشل في إرسال إشعار البريد (تحقق من الإعدادات):', emailError);
    }

    return { success: true, document: newDocument };
  } catch (error: any) {
    console.error('خطأ في إنشاء المستند:', error);
    return { success: false, error: error.message || 'فشل في إنشاء المستند' };
  }
}

export async function updateDocument(id: string, formData: FormData) {
  try {
    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      tags: formData.get('tags') as string,
      category: formData.get('category') as string,
      mimeType: formData.get('mimeType') as string,
      originalFileName: formData.get('originalFileName') as string,
    };

    const validatedData = documentSchema.parse(rawData);

    const tagsArray = validatedData.tags
      ? validatedData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    const updatedDocument = await mongoDB.updateDocument(id, {
      title: validatedData.title,
      content: validatedData.content,
      tags: tagsArray.length > 0 ? tagsArray : null,
      category: validatedData.category || 'عام',
      mimeType: validatedData.mimeType || null,
      originalFileName: validatedData.originalFileName || null,
    });

    revalidatePath('/');
    return { success: true, document: updatedDocument };
  } catch (error: any) {
    console.error('خطأ في تحديث المستند:', error);
    return { success: false, error: 'فشل في تحديث المستند' };
  }
}

export async function deleteDocument(id: string) {
  try {
    const result = await mongoDB.deleteDocument(id);
    revalidatePath('/');
    return { success: result };
  } catch (error) {
    console.error('خطأ في حذف المستند:', error);
    return { success: false, error: 'فشل في حذف المستند' };
  }
}

export async function getDocument(id: string) {
  try {
    const document = await mongoDB.getDocument(id);

    if (!document) {
      return { success: false, error: 'المستند غير موجود' };
    }

    return { success: true, document };
  } catch (error) {
    console.error('خطأ في جلب المستند:', error);
    return { success: false, error: 'فشل في جلب المستند' };
  }
}

export async function listDocuments() {
  try {
    const documents = await mongoDB.getAllDocuments();
    return { success: true, documents };
  } catch (error) {
    console.error('خطأ في جلب المستندات:', error);
    return { success: false, error: 'فشل في جلب المستندات' };
  }
}

export async function searchDocuments(query: string, category?: string) {
  try {
    let documents = await mongoDB.getAllDocuments();

    if (query) {
      documents = documents.filter(doc =>
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
      );
    }

    if (category) {
      documents = documents.filter(doc => doc.category === category);
    }

    return { success: true, documents };
  } catch (error) {
    console.error('خطأ في البحث:', error);
    return { success: false, error: 'فشل في البحث' };
  }
}

export async function bulkImportDocuments(documentsData: Array<{
  title: string;
  content: string;
  tags?: string;
  category?: string;
  mimeType?: string;
  originalFileName?: string;
}>) {
  try {
    const results = [];
    for (const docData of documentsData) {
      const formData = new FormData();
      formData.append('title', docData.title);
      formData.append('content', docData.content);
      if (docData.tags) formData.append('tags', docData.tags);
      if (docData.category) formData.append('category', docData.category);
      if (docData.mimeType) formData.append('mimeType', docData.mimeType);
      if (docData.originalFileName) formData.append('originalFileName', docData.originalFileName);

      const result = await createDocument(formData);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;

    return {
      success: errorCount === 0,
      message: `تم استيراد ${successCount} مستند بنجاح${errorCount > 0 ? `، وفشل ${errorCount}` : ''}`,
      results
    };
  } catch (error) {
    console.error('خطأ في الاستيراد الجماعي:', error);
    return { success: false, error: 'فشل في الاستيراد الجماعي' };
  }
}
