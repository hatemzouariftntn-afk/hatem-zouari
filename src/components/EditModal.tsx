"use client";

import React, { useState, useEffect } from 'react';
import { listCategories } from '@/app/categories/actions';
import { updateDocument } from '@/app/documents/actions';
import { Category, Document } from '@/types';

interface UpdateDocumentResult {
  success: boolean;
  error?: string;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
  document: Document | null;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onUpdateSuccess, document }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && document) {
      const fetchCategories = async () => {
        const result = await listCategories();
        if (result.success) {
          setCategories(result.categories || []);
        } else {
          setError("فشل في تحميل الفئات: " + result.error);
        }
      };
      fetchCategories();

      // Populate form with document data
      setTitle(document.title);
      // For binary files, don't show content in edit form (show placeholder)
      if (document.mimeType && document.originalFileName) {
        setContent(`[ملف ثنائي: ${document.originalFileName}] - لا يمكن تعديل المحتوى مباشرة`); // Placeholder for binary files
      } else {
        // For text content, try to decode if it was stored as binary
        try {
          const binaryString = atob(document.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const decodedText = new TextDecoder().decode(bytes);
          // If the decoded text looks like binary data, show placeholder
          if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(decodedText)) {
            setContent('[محتوى ثنائي - لا يمكن تعديله كملف نصي]'); // Placeholder for binary content
          } else {
            setContent(decodedText); // Show decoded text
          }
        } catch (e) {
          // If atob fails, treat as plain text
          setContent(document.content);
        }
      }
      setSelectedCategory(document.category || 'عام');
      setTags(document.tags?.join(', ') || '');
      setError(null);
    }
  }, [isOpen, document]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!document) return;

    if (!title.trim()) {
      setError('العنوان مطلوب');
      return;
    }

    // For binary files, don't require content validation since it's not editable
    if (!(document.mimeType && document.originalFileName) && !content.trim()) {
      setError('المحتوى مطلوب');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());

      // For binary files, keep the original content
      if (document.mimeType && document.originalFileName) {
        formData.append('content', document.content);
        formData.append('mimeType', document.mimeType);
        formData.append('originalFileName', document.originalFileName);
      } else {
        formData.append('content', content.trim());
      }

      formData.append('tags', tags.trim());
      formData.append('category', selectedCategory);

      const result = await updateDocument(document.id.toString(), formData);

      if (result.success) {
        onUpdateSuccess();
      } else {
        setError(result.error || 'فشل في تحديث المستند');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
      console.error('Error updating document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">تعديل المستند</h2>
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
            <label htmlFor="edit-title" className="form-label">
              العنوان *
            </label>
            <input
              type="text"
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control"
              placeholder="أدخل عنوان المستند"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-content" className="form-label">
              المحتوى *
            </label>
            <textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-control"
              placeholder="أدخل محتوى المستند"
              rows={6}
              required={!(document?.mimeType && document?.originalFileName)}
              disabled={isLoading || !!(document?.mimeType && document?.originalFileName)}
            />
            {(document?.mimeType && document?.originalFileName) && (
              <small className="form-text text-muted">
                لا يمكن تعديل محتوى الملفات الثنائية (مثل PDF) مباشرة. يمكنك تعديل العنوان والفئة والوسوم فقط.
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="edit-category" className="form-label">
              الفئة
            </label>
            <select
              id="edit-category"
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
            <label htmlFor="edit-tags" className="form-label">
              الوسوم (مفصولة بفواصل)
            </label>
            <input
              type="text"
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="form-control"
              placeholder="مثال: مهم، عمل، شخصي"
              disabled={isLoading}
            />
          </div>

          <div className="modal-actions">
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
              {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
