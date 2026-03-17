// قاعدة بيانات ديناميكية - تستخدم MongoDB إذا كانت متوفرة
import { performanceDB } from './performance-db'

// تحقق من وجود MongoDB URI صحيح
const useMongoDB = process.env.MONGODB_URI && 
  !process.env.MONGODB_URI.includes('example.com') &&
  !process.env.MONGODB_URI.includes('YOUR_PASSWORD');

if (useMongoDB) {
  console.log('🚀 استخدام MongoDB Atlas (قاعدة بيانات سحابية)');
} else {
  console.log('⚠️  MongoDB URI غير صحيح أو غير موجود');
  console.log('📝 الرجاء تحديث ملف .env.local ببيانات MongoDB الصحيحة');
}

// دائماً استخدم MongoDB المحسّن
export const db = performanceDB;
