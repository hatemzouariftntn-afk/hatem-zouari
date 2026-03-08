import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// إعداد Cloudinary باستخدام المتغيرات البيئية
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(base64Data: string, mimeType: string, filename: string) {
  try {
    // تجهيز صيغة الملف لـ Cloudinary
    const dataURI = `data:${mimeType};base64,${base64Data}`;
    
    // تحديد نوع الملف لكي يتمكن Cloudinary من التعامل معه بشكل صحيح
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    
    const rawTypes = ['application/pdf', 'application/zip', 'text/plain', 'application/msword', 'application/vnd', 'application/octet-stream'];
    if (rawTypes.some(type => mimeType.includes(type))) {
      resourceType = 'raw';
    }

    // استخراج امتداد الملف
    const fileExtension = filename.split('.').pop()?.toLowerCase();

    // تنظيف اسم الملف من أي رموز غير مدعومة
    const safeFilename = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
    
    // تكوين المعرف السحابي مع إضافة الامتداد الأصلي (مهم جداً للتعرف على نوع الملفات بصيغة RAW مثل PDF)
    const publicId = fileExtension ? `${Date.now()}_${safeFilename}.${fileExtension}` : `${Date.now()}_${safeFilename}`;

    // رفع الملف بصيغة كود Promise
    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(dataURI, {
        resource_type: resourceType,
        folder: 'document-archiver',
        public_id: publicId,
        access_mode: 'public', // التأكد من أن الملف يمكن للجميع الوصول إليه لتسهيل التحميل
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadApiResponse);
      });
    });

    return { success: true, url: result.secure_url };
  } catch (error) {
    console.error('❌ خطأ في الرفع إلى Cloudinary:', error);
    return { success: false, error };
  }
}
