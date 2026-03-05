"use client";

import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { listCategories } from '@/app/categories/actions';
import { createDocument, bulkImportDocuments } from '@/app/documents/actions';
import { Category } from '@/types';

interface CreateDocumentResult {
  success: boolean;
  error?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBulkImport, setIsBulkImport] = useState(false);
  const [bulkDocuments, setBulkDocuments] = useState<Array<{
    title: string;
    content: string;
    tags?: string;
    category?: string;
    mimeType?: string;
    originalFileName?: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const result = await listCategories();
          console.log('UploadModal - الفئات المحملة:', result);
          if (result.success) {
            setCategories(result.categories || []);
            if (result.categories && result.categories.length > 0) {
              setSelectedCategory(result.categories[0].name);
            }
          } else {
            console.error('UploadModal - خطأ في تحميل الفئات:', result.error);
            setError("فشل في تحميل الفئات: " + result.error);
          }
        } catch (err) {
          console.error('UploadModal - استثناء في تحميل الفئات:', err);
          setError("حدث خطأ في تحميل الفئات");
        }
      };
      fetchCategories();
      
      // Reset form state
      setSelectedFile(null);
      setTitle('');
      setContent('');
      setTags('');
      setError(null);
    }
  }, [isOpen]);

  // Update category for bulk documents when category changes
  useEffect(() => {
    if (isBulkImport && bulkDocuments.length > 0) {
      setBulkDocuments(prev => prev.map(doc => ({ ...doc, category: selectedCategory })));
    }
  }, [selectedCategory, isBulkImport, bulkDocuments.length]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      if (file.type === 'application/zip') {
        // Handle zip file
        setIsBulkImport(true);
        setIsLoading(true);
        setError(null);

        try {
          const zip = new JSZip();
          const zipData = await zip.loadAsync(file);
          const documents: Array<{
            title: string;
            content: string;
            tags?: string;
            category?: string;
            mimeType?: string;
            originalFileName?: string;
          }> = [];

          for (const [path, zipEntry] of Object.entries(zipData.files)) {
            if (!zipEntry.dir) {
              const fileData = await zipEntry.async('uint8array');
              const mimeType = getMimeType(path);
              const base64 = btoa(Array.from(fileData).map(byte => String.fromCharCode(byte)).join(''));
              const title = path.split('/').pop()?.replace(/\.[^/.]+$/, "") || path;

              documents.push({
                title,
                content: base64,
                category: selectedCategory,
                mimeType,
                originalFileName: path.split('/').pop() || path
              });
            }
          }

          setBulkDocuments(documents);
          setTitle(`استيراد ${documents.length} مستند من ${file.name}`);
        } catch (err) {
          setError('فشل في قراءة ملف الـ zip');
          console.error('Error reading zip:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Handle single file
        setIsBulkImport(false);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }

        // Read file as ArrayBuffer and convert to base64 for all file types
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          // Convert to base64
          const base64 = btoa(Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join(''));
          setContent(base64);
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isBulkImport) {
      if (bulkDocuments.length === 0) {
        setError('لا توجد مستندات للاستيراد');
        return;
      }
    } else {
      if (!title.trim()) {
        setError('العنوان مطلوب');
        return;
      }

      if (!content.trim()) {
        setError('المحتوى مطلوب');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isBulkImport) {
        const result = await bulkImportDocuments(bulkDocuments);

        if (result.success) {
          onUploadSuccess();
        } else {
          setError(result.message || result.error || 'فشل في الاستيراد الجماعي');
        }
      } else {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('content', content.trim());
        formData.append('tags', tags.trim());
        formData.append('category', selectedCategory);
        if (selectedFile) {
          formData.append('mimeType', selectedFile.type);
          formData.append('originalFileName', selectedFile.name);
        }

        const result = await createDocument(formData);

        if (result.success) {
          onUploadSuccess();
        } else {
          setError(result.error || 'فشل في إنشاء المستند');
        }
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">إضافة مستند جديد</h2>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="file" className="form-label">
              اختر ملف (اختياري)
            </label>
            <input
              type="file"
              id="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="form-control"
              accept=".txt,.pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.gif"
              disabled={isLoading}
            />
            {selectedFile && (
              <small>الملف المحدد: {selectedFile.name}</small>
            )}
          </div>

          {isBulkImport ? (
            <>
              <div className="form-group">
                <label className="form-label">
                  معلومات الاستيراد
                </label>
                <div className="bulk-info">
                  <p>عدد المستندات المراد استيرادها: {bulkDocuments.length}</p>
                  <div className="bulk-documents-list">
                    {bulkDocuments.slice(0, 5).map((doc, index) => (
                      <div key={index} className="bulk-document-item">
                        {doc.title} ({doc.originalFileName})
                      </div>
                    ))}
                    {bulkDocuments.length > 5 && (
                      <div>... و {bulkDocuments.length - 5} مستند آخر</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  الفئة لجميع المستندات
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-control"
                  disabled={isLoading}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  العنوان *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-control"
                  placeholder="أدخل عنوان المستند"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="content" className="form-label">
                  المحتوى *
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="form-control"
                  placeholder="أدخل محتوى المستند"
                  rows={6}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  الفئة
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-control"
                  disabled={isLoading}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tags" className="form-label">
                  الوسوم (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="form-control"
                  placeholder="مثال: مهم، عمل، شخصي"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (isBulkImport ? 'جاري الاستيراد...' : 'جاري الحفظ...') : (isBulkImport ? 'استيراد المستندات' : 'حفظ المستند')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;

