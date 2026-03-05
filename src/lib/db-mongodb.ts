// قاعدة بيانات MongoDB محسّنة
import { performanceDB } from './performance-db'

// تصدير واجهة قاعدة البيانات المحسّنة
export const db = performanceDB;

// للتوافق مع الكود القديم
export default db;
