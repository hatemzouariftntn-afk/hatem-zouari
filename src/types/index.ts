 // src/types/index.ts
// ملف مركزي لتوحيد جميع أنواع البيانات في المشروع

// تعريف نوع البيانات للوثائق
export interface Document {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  category: string;
  createdAt: number;
  updatedAt: number;
  mimeType: string | null;
  originalFileName: string | null;
  // Workflow Management Fields
  deadline: number | null;          // Unix timestamp للموعد النهائي للرد
  linkedDocumentIds: string[] | null; // معرّفات الوثائق المرتبطة (سلسلة المراسلات)
  status: 'pending' | 'in_progress' | 'done' | null; // حالة متابعة الوثيقة
}


// تعريف نوع البيانات للوسوم
export interface Tag {
  id: number;
  name: string;
  user_id?: string | null; // Changed to string for MongoDB
}

// تعريف نوع البيانات للفئات
export interface Category {
  id: string; // Changed to string for MongoDB
  name: string;
  user_id: string | null;
}

// تعريف نوع البيانات للمستخدمين (لـ NextAuth)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// تعريف نوع البيانات للنسخ الاحتياطي
export interface Backup {
  id: string;
  userId: string;
  data: any;
  backupType: 'full' | 'incremental';
  createdAt: Date;
  size: number;
}

// تعريف نوع البيانات لقاعدة البيانات (للاستخدام المحلي فقط)
export interface DatabaseSchema {
  documents: Document[];
  tags: Tag[];
  categories: Category[];
  lastId: number;
  timestampsUpdated?: boolean;
}

// تعريف نوع بيانات الإحصائيات
export interface Statistics {
  totalDocuments: number;
  totalCategories: number;
  totalTags: number;
  categoryStats: Array<{
    name: string;
    count: number;
  }>;
  tagStats: Array<{
    name: string;
    count: number;
  }>;
}

// تعريف أنواع NextAuth الموسعة
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role?: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
