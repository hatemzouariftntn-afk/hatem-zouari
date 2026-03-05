'use client';

import React, { useState, useEffect } from 'react';
import { listDocuments, deleteDocument } from './documents/actions';
import { listCategories } from './categories/actions';
import UploadModal from '@/components/UploadModal';
import EditModal from '@/components/EditModal';
import DetailsModal from '@/components/DetailsModal';
import DownloadModal from '@/components/DownloadModal';
import { Document, Category } from '@/types';
import JSZip from 'jszip';

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load documents and categories
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [documentsResult, categoriesResult] = await Promise.all([
        listDocuments(),
        listCategories()
      ]);

      if (documentsResult.success) {
        setDocuments(documentsResult.documents || []);
      } else {
        setError(documentsResult.error || 'فشل في تحميل المستندات');
      }

      if (categoriesResult.success) {
        console.log('الفئات المحملة:', categoriesResult.categories);
        setCategories(categoriesResult.categories || []);
      } else {
        console.error('خطأ في تحميل الفئات:', categoriesResult.error);
        setError(prev => prev ? `${prev}, ${categoriesResult.error}` : categoriesResult.error || 'فشل في جلب الفئات');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل البيانات');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter documents based on search term and category
  const filteredDocuments = documents.filter(doc => {
    const matchesQuery = !searchTerm || 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === '' || doc.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'gregory'
    });
  };

  const getMimeTypeFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'txt': 'text/plain',
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

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    loadData(); // Refresh the document list
  };

  const handleViewDetails = (document: Document) => {
    setViewingDocument(document);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستند؟')) {
      try {
        const result = await deleteDocument(id);
        if (result.success) {
          loadData(); // Refresh the document list
        } else {
          setError(result.error || 'فشل في حذف المستند');
        }
      } catch (err) {
        setError('حدث خطأ في حذف المستند');
        console.error('Error deleting document:', err);
      }
    }
  };

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setEditingDocument(null);
    loadData(); // Refresh the document list
  };

  const handleExportFromModal = async (format: 'individual' | 'zip', selectedIds?: string[]) => {
    const docsToExport = selectedIds
      ? documents.filter(doc => selectedIds.includes(doc.id.toString()))
      : filteredDocuments;

    if (format === 'zip') {
      const zip = new JSZip();

      docsToExport.forEach((document) => {
        let fileName: string;
        let content: string | Uint8Array;

        if (document.originalFileName) {
          // Binary file - content is already base64 encoded
          fileName = document.originalFileName;
          let contentData: Uint8Array | string;
          try {
            // Decode base64 to Uint8Array
            const binaryString = atob(document.content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            contentData = bytes;
          } catch (e) {
            // If atob fails, treat as plain text
            contentData = document.content;
          }
          content = contentData;
        } else {
          // Plain text content (no file uploaded)
          fileName = `${document.title}.txt`;
          content = document.content;
        }

        zip.file(fileName, content);
      });

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);

      // Download the zip file
      const linkElement = window.document.createElement('a');
      linkElement.href = zipUrl;
      linkElement.download = `documents-export-${new Date().toISOString().split('T')[0]}.zip`;
      window.document.body.appendChild(linkElement);
      linkElement.click();
      window.document.body.removeChild(linkElement);

      // Clean up the URL object
      URL.revokeObjectURL(zipUrl);
    } else {
      // Individual files
      docsToExport.forEach((document) => {
        let fileName: string;
        let contentBlob: Blob;
        let mimeType = document.mimeType;

        if (document.originalFileName) {
          // Binary file - content is already base64 encoded
          fileName = document.originalFileName;
          if (!mimeType) {
            mimeType = getMimeTypeFromFilename(document.originalFileName);
          }
          try {
            const binaryString = atob(document.content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            contentBlob = new Blob([bytes], { type: mimeType });
          } catch (e) {
            // If atob fails for binary, treat as plain text
            contentBlob = new Blob([document.content], { type: 'text/plain;charset=utf-8' });
          }
        } else {
          // Plain text content (no file uploaded)
          fileName = `${document.title}.txt`;
          contentBlob = new Blob([document.content], { type: 'text/plain;charset=utf-8' });
        }

        const url = URL.createObjectURL(contentBlob);
        const linkElement = window.document.createElement('a');
        linkElement.href = url;
        linkElement.download = fileName;
        window.document.body.appendChild(linkElement);
        linkElement.click();
        window.document.body.removeChild(linkElement);
        URL.revokeObjectURL(url);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">جاري تحميل المستندات...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>أرشيف المستندات</h1>
        <p className="header-subtitle">
          إدارة وتنظيم مستنداتك بسهولة وأمان
        </p>
      </header>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="البحث في المستندات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
            aria-label="فلترة المستندات حسب الفئة"
          >
            <option value="">جميع الفئات</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="btn btn-secondary"
            disabled={documents.length === 0}
          >
            📁 تصدير المستندات
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-primary"
          >
            ➕ إضافة مستند جديد
          </button>
        </div>
      </div>

      <div className="document-list">
        {filteredDocuments.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📂</div>
            <h3 className="empty-title">
              {searchTerm || selectedCategory ? 'لا توجد نتائج مطابقة' : 'لا توجد مستندات بعد'}
            </h3>
            <p className="empty-description">
              {searchTerm || selectedCategory
                ? 'جرب تعديل معايير البحث أو الفلترة'
                : 'ابدأ بإضافة مستندك الأول لتنظيم أرشيفك'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="btn btn-primary empty-cta"
              >
                ➕ إضافة المستند الأول
              </button>
            )}
          </div>
        ) : (
          filteredDocuments.map(document => (
            <div key={document.id} className="document-item">
              <div className="document-info">
                <div className="document-title">{document.title}</div>
                <div className="document-meta">
                  الفئة: {document.category} |
                  تاريخ الإنشاء: {formatDate(document.createdAt)} |
                  آخر تحديث: {formatDate(document.updatedAt)}
                </div>
                {document.tags && (
                  <div className="document-tags">
                    {document.tags.map((tag: string, index: number) => (
                      <span key={index} className="tag">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="document-actions">
                <button
                  onClick={() => handleViewDetails(document)}
                  className="btn btn-secondary"
                  aria-label={`عرض تفاصيل المستند ${document.title}`}
                >
                  👁️ عرض التفاصيل
                </button>
                <button
                  onClick={() => handleEdit(document)}
                  className="btn btn-primary"
                  aria-label={`تعديل المستند ${document.title}`}
                >
                  ✏️ تعديل
                </button>
                <button
                  onClick={() => handleDelete(document.id)}
                  className="btn btn-danger"
                  aria-label={`حذف المستند ${document.title}`}
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateSuccess={handleUpdateSuccess}
        document={editingDocument}
      />

      <DetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        doc={viewingDocument}
      />

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        documents={filteredDocuments}
        onExport={(format, selectedIds) => handleExportFromModal(format, selectedIds)}
      />
    </div>
  );
}
