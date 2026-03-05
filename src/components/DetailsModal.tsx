"use client";

import React from 'react';
import { Document } from '@/types';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: Document | null;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, onClose, doc }) => {
  if (!isOpen || !doc) return null;

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

  return (
    <div className="modal">
    <div className="modal-content">
      <div className="modal-header">
        <h2 className="modal-title">{doc.title}</h2>
        <button
          type="button"
          className="close-btn"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="modal-body">
        <div className="document-meta">
          <strong>الفئة:</strong> {doc.category} | 
          <strong> تاريخ الإنشاء:</strong> {formatDate(doc.createdAt)} |
          <strong> آخر تحديث:</strong> {formatDate(doc.updatedAt)}
        </div>

        {doc.tags && (
          <div className="document-tags">
            <strong>الوسوم:</strong>
            {doc.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {doc.mimeType && doc.originalFileName ? (
          <div className="document-file-info">
            <strong>معلومات الملف:</strong>
            <div>
              <p><strong>اسم الملف:</strong> {doc.originalFileName ?? ''}</p>
              <p><strong>نوع الملف:</strong> {doc.mimeType ?? ''}</p>
              <button
                onClick={() => {
                  const dataUri = `data:${doc.mimeType ?? ''};base64,${doc.content}`;
                  const linkElement = document.createElement('a');
                  linkElement.href = dataUri;
                  linkElement.download = doc.originalFileName ?? '';
                  document.body.appendChild(linkElement);
                  linkElement.click();
                  document.body.removeChild(linkElement);
                }}
                className="btn btn-primary"
              >
                تحميل الملف
              </button>
              {doc.mimeType.startsWith('image/') && (
                <div>
                  <strong>معاينة:</strong>
                  <img
                    src={`data:${doc.mimeType};base64,${doc.content}`}
                    alt={doc.originalFileName}
                    className="image-preview"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="document-content">
            <strong>المحتوى:</strong>
            <div>
              {(() => {
                try {
                  // Try to decode as binary first (for files that were uploaded as binary)
                  const binaryString = atob(doc.content);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const decodedText = new TextDecoder().decode(bytes);
                  // If the decoded text looks like binary data (contains non-printable characters), show as base64
                  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(decodedText)) {
                    return doc.content; // Show base64 for binary files
                  }
                  return decodedText; // Show decoded text for text files
                } catch (e) {
                  // If atob fails, treat as plain text
                  return doc.content;
                }
              })()}
            </div>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button
          onClick={onClose}
          className="btn btn-secondary"
        >
          إغلاق
        </button>
      </div>
    </div>
    </div>
  );
};

export default DetailsModal;
