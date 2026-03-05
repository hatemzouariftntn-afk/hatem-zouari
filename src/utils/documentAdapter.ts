// src/utils/documentAdapter.ts
// محول لتحويل المستندات بين قاعدة البيانات والواجهة الأمامية

import { Document as DbDocument } from '@/types';

// واجهة المستند في الواجهة الأمامية
export interface UiDocument {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  mimeType: string | null;
  originalFileName: string | null;
}

/**
 * تحويل مستند من قاعدة البيانات إلى الواجهة الأمامية
 * يحول التواريخ من timestamp (number) إلى كائن Date
 */
export function dbToUiDocument(dbDocument: DbDocument | null): UiDocument | null {
  if (!dbDocument) return null;
  
  return {
    id: dbDocument.id,
    title: dbDocument.title,
    content: dbDocument.content,
    tags: dbDocument.tags,
    category: dbDocument.category,
    createdAt: new Date(dbDocument.createdAt * 1000), // تحويل من ثواني إلى مللي ثواني
    updatedAt: new Date(dbDocument.updatedAt * 1000),
    mimeType: dbDocument.mimeType,
    originalFileName: dbDocument.originalFileName,
  };
}

/**
 * تحويل مصفوفة من مستندات قاعدة البيانات إلى مستندات الواجهة الأمامية
 */
export function dbToUiDocuments(dbDocuments: DbDocument[]): UiDocument[] {
  return dbDocuments.map(doc => dbToUiDocument(doc)!);
}

/**
 * تحويل مستند من الواجهة الأمامية إلى قاعدة البيانات
 * يحول التواريخ من كائن Date إلى timestamp (number)
 */
export function uiToDbDocument(uiDocument: UiDocument): DbDocument {
  return {
    id: uiDocument.id,
    title: uiDocument.title,
    content: uiDocument.content,
    tags: uiDocument.tags,
    category: uiDocument.category,
    createdAt: Math.floor(uiDocument.createdAt.getTime() / 1000), // تحويل من مللي ثواني إلى ثواني
    updatedAt: Math.floor(uiDocument.updatedAt.getTime() / 1000),
    mimeType: uiDocument.mimeType,
    originalFileName: uiDocument.originalFileName,
  };
}
