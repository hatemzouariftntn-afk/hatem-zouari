"use client";

import React, { useState } from 'react';
import { Document } from '@/types';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onExport: (format: 'individual' | 'zip', selectedIds: string[]) => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ 
  isOpen, 
  onClose, 
  documents, 
  onExport 
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'individual' | 'zip'>('zip');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]); // IDs of selected documents
  const [isExporting, setIsExporting] = useState(false);

  const handleFormatChange = (format: 'individual' | 'zip') => {
    setSelectedFormat(format);
  };

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocuments(prev =>
      prev.includes(id)
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedDocuments.length === 0 && documents.length > 0) {
      // Export all if none selected
      const allIds = documents.map(doc => doc.id);
      onExportWithIds(allIds, selectedFormat);
    } else if (selectedDocuments.length > 0) {
      onExportWithIds(selectedDocuments, selectedFormat);
    } else {
      alert('يرجى اختيار مستندات للتصدير أو اختيار جميعها');
    }
  };

  const onExportWithIds = (ids: string[], format: 'individual' | 'zip') => {
    setIsExporting(true);
    onExport(format, ids);
    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 1000); // Simulate export time
  };

  if (!isOpen) return null;

  const exportableDocuments = selectedDocuments.length > 0 
    ? documents.filter(doc => selectedDocuments.includes(doc.id))
    : documents;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>تصدير المستندات</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>نوع التصدير:</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="zip"
                  checked={selectedFormat === 'zip'}
                  onChange={() => handleFormatChange('zip')}
                />
                ملف ZIP (جميع المستندات في ملف واحد)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="individual"
                  checked={selectedFormat === 'individual'}
                  onChange={() => handleFormatChange('individual')}
                />
                ملفات منفصلة (كل مستند ملف منفصل)
              </label>
            </div>
          </div>

          {documents.length > 0 && (
            <div className="form-group">
              <label>اختر المستندات (اترك فارغاً لتصدير الكل):</label>
              <div className="checkbox-list">
                {documents.map(doc => (
                  <label key={doc.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => toggleDocumentSelection(doc.id)}
                    />
                    {doc.title}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isExporting}
            >
              إلغاء
            </button>
            <button
              onClick={handleExport}
              className="btn btn-primary"
              disabled={isExporting || exportableDocuments.length === 0}
            >
              {isExporting ? 'جاري التصدير...' : `تصدير (${exportableDocuments.length} مستند)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
