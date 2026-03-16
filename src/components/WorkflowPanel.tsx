'use client';

import React, { useState } from 'react';
import { Document } from '@/types';
import { getDeadlineStatus, getDeadlineVisual, formatDeadline } from '@/lib/workflow-utils';
import { updateDocumentWorkflow } from '@/app/documents/actions';
import { listDocuments } from '@/app/documents/actions';

interface WorkflowPanelProps {
  document: Document;
  allDocuments?: Document[];
  onUpdate?: () => void;
  lang?: 'ar' | 'fr' | 'en';
}

const STATUS_OPTIONS = [
  { value: 'pending',     label: { ar: '⏳ قيد الانتظار',  fr: '⏳ En attente',   en: '⏳ Pending'     }, color: '#ca8a04' },
  { value: 'in_progress', label: { ar: '🔄 جارٍ العمل',    fr: '🔄 En cours',      en: '🔄 In Progress' }, color: '#2563eb' },
  { value: 'done',        label: { ar: '✅ مكتمل',         fr: '✅ Terminé',       en: '✅ Done'        }, color: '#16a34a' },
];

const t = {
  ar: {
    workflowTitle: '📋 متابعة سير العمل',
    deadlineLabel: 'الموعد النهائي للرد',
    noDeadline: 'لا يوجد موعد محدد',
    statusLabel: 'حالة الوثيقة',
    noStatus: 'لا توجد حالة',
    linkedDocsLabel: '🔗 الوثائق المرتبطة (سلسلة المراسلات)',
    noLinked: 'لا توجد وثائق مرتبطة',
    setDeadline: 'تحديد الموعد',
    clearDeadline: 'إلغاء الموعد',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    saved: '✅ تم الحفظ',
    searchDocs: 'ابحث عن وثيقة لربطها...',
    linkDoc: 'ربط',
    unlinkDoc: 'فك الربط',
  },
  fr: {
    workflowTitle: '📋 Suivi du flux',
    deadlineLabel: 'Date limite de réponse',
    noDeadline: 'Aucune date limite',
    statusLabel: 'Statut du document',
    noStatus: 'Aucun statut',
    linkedDocsLabel: '🔗 Documents liés (fil de correspondance)',
    noLinked: 'Aucun document lié',
    setDeadline: 'Définir',
    clearDeadline: 'Effacer',
    saveChanges: 'Enregistrer',
    saving: 'Enregistrement...',
    saved: '✅ Enregistré',
    searchDocs: 'Rechercher un document...',
    linkDoc: 'Lier',
    unlinkDoc: 'Délier',
  },
  en: {
    workflowTitle: '📋 Workflow Tracking',
    deadlineLabel: 'Response Deadline',
    noDeadline: 'No deadline set',
    statusLabel: 'Document Status',
    noStatus: 'No status',
    linkedDocsLabel: '🔗 Linked Documents (Correspondence Thread)',
    noLinked: 'No linked documents',
    setDeadline: 'Set Deadline',
    clearDeadline: 'Clear',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    saved: '✅ Saved',
    searchDocs: 'Search for a document...',
    linkDoc: 'Link',
    unlinkDoc: 'Unlink',
  }
};

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  document,
  allDocuments = [],
  onUpdate,
  lang = 'ar'
}) => {
  const tx = t[lang];
  const [deadline, setDeadline] = useState<string>(
    document.deadline ? new Date(document.deadline * 1000).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState<string>(document.status || '');
  const [linkedIds, setLinkedIds] = useState<string[]>(document.linkedDocumentIds || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const deadlineTs = deadline ? Math.floor(new Date(deadline).getTime() / 1000) : null;
  const deadlineStatus = getDeadlineStatus(deadlineTs);
  const deadlineVisual = getDeadlineVisual(deadlineStatus);
  const deadlineFormatted = formatDeadline(deadlineTs);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const result = await updateDocumentWorkflow(document.id, {
      deadline: deadlineTs,
      linkedDocumentIds: linkedIds.length > 0 ? linkedIds : null,
      status: status ? (status as 'pending' | 'in_progress' | 'done') : null,
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      onUpdate?.();
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const toggleLink = (docId: string) => {
    setLinkedIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const otherDocs = allDocuments.filter(d =>
    d.id !== document.id &&
    (searchQuery === '' ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const linkedDocs = allDocuments.filter(d => linkedIds.includes(d.id));

  const currentStatus = STATUS_OPTIONS.find(s => s.value === status);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '20px',
      marginTop: '20px',
      direction: lang === 'ar' ? 'rtl' : 'ltr',
    }}>
      <h3 style={{ margin: '0 0 20px', color: '#1e293b', fontSize: '1rem', fontWeight: 700 }}>
        {tx.workflowTitle}
      </h3>

      {/* ===== قسم الموعد النهائي ===== */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '8px', fontSize: '0.875rem' }}>
          📅 {tx.deadlineLabel}
        </label>

        {/* شارة الموعد الحالي */}
        {deadlineTs && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: deadlineVisual.bg, color: deadlineVisual.color,
            padding: '6px 14px', borderRadius: '20px', marginBottom: '10px',
            border: `1px solid ${deadlineVisual.color}30`, fontWeight: 600, fontSize: '0.85rem'
          }}>
            <span>{deadlineVisual.icon}</span>
            <span>{deadlineVisual.label}</span>
            <span style={{ opacity: 0.7, fontWeight: 400 }}>— {deadlineFormatted}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
              fontSize: '0.875rem', background: 'white', flex: 1,
            }}
          />
          {deadline && (
            <button
              onClick={() => setDeadline('')}
              style={{
                padding: '8px 12px', borderRadius: '8px', border: '1px solid #fca5a5',
                background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              }}
            >
              {tx.clearDeadline}
            </button>
          )}
        </div>
      </div>

      {/* ===== قسم حالة الوثيقة ===== */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '8px', fontSize: '0.875rem' }}>
          🏷️ {tx.statusLabel}
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(status === opt.value ? '' : opt.value)}
              style={{
                padding: '6px 16px', borderRadius: '20px', border: `2px solid ${opt.color}`,
                background: status === opt.value ? opt.color : 'white',
                color: status === opt.value ? 'white' : opt.color,
                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
              }}
            >
              {opt.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* ===== قسم الوثائق المرتبطة ===== */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '8px', fontSize: '0.875rem' }}>
          {tx.linkedDocsLabel}
        </label>

        {/* الوثائق المرتبطة حالياً */}
        {linkedDocs.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {linkedDocs.map(doc => (
              <div key={doc.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: '#eff6ff', borderRadius: '8px',
                border: '1px solid #bfdbfe', marginBottom: '6px',
              }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1d4ed8' }}>📎 {doc.title}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginRight: '8px', marginLeft: '8px' }}>{doc.category}</span>
                </div>
                <button
                  onClick={() => toggleLink(doc.id)}
                  style={{
                    padding: '2px 10px', borderRadius: '6px', border: '1px solid #fca5a5',
                    background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem',
                  }}
                >
                  {tx.unlinkDoc}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* بحث لربط وثيقة */}
        <input
          type="text"
          placeholder={tx.searchDocs}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: '8px',
            border: '1px solid #d1d5db', fontSize: '0.875rem',
            background: 'white', boxSizing: 'border-box', marginBottom: '8px',
          }}
        />
        {searchQuery && (
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
            {otherDocs.slice(0, 10).map(doc => (
              <div key={doc.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderBottom: '1px solid #f3f4f6',
                background: linkedIds.includes(doc.id) ? '#f0fdf4' : 'white',
              }}>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>{doc.title} <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>({doc.category})</span></span>
                <button
                  onClick={() => toggleLink(doc.id)}
                  style={{
                    padding: '2px 10px', borderRadius: '6px',
                    border: `1px solid ${linkedIds.includes(doc.id) ? '#fca5a5' : '#6ee7b7'}`,
                    background: linkedIds.includes(doc.id) ? '#fef2f2' : '#f0fdf4',
                    color: linkedIds.includes(doc.id) ? '#dc2626' : '#16a34a',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                  }}
                >
                  {linkedIds.includes(doc.id) ? tx.unlinkDoc : tx.linkDoc}
                </button>
              </div>
            ))}
            {otherDocs.length === 0 && (
              <p style={{ padding: '12px', color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
                لا توجد نتائج
              </p>
            )}
          </div>
        )}
      </div>

      {/* زر الحفظ */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
          background: saved ? '#16a34a' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'wait' : 'pointer',
          transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
        }}
      >
        {saving ? tx.saving : saved ? tx.saved : tx.saveChanges}
      </button>
    </div>
  );
};

// ===== مكون شارة الموعد النهائي (للاستخدام في قوائم الوثائق) =====
interface DeadlineBadgeProps {
  deadline: number | null;
  status?: string | null;
  compact?: boolean;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({ deadline, status, compact = false }) => {
  const deadlineStatus = getDeadlineStatus(deadline);
  if (deadlineStatus === 'none' && !status) return null;

  const visual = getDeadlineVisual(deadlineStatus);
  const formatted = formatDeadline(deadline);

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
      {deadline && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: visual.bg, color: visual.color,
          padding: compact ? '2px 8px' : '3px 10px',
          borderRadius: '12px', fontSize: compact ? '0.7rem' : '0.75rem',
          fontWeight: 600, border: `1px solid ${visual.color}30`,
        }}>
          {visual.icon} {compact ? visual.label : formatted}
        </span>
      )}
      {status && (() => {
        const statusColors: Record<string, { bg: string; color: string; label: string }> = {
          pending:     { bg: '#fef9c3', color: '#ca8a04', label: '⏳ قيد الانتظار' },
          in_progress: { bg: '#eff6ff', color: '#2563eb', label: '🔄 جارٍ العمل' },
          done:        { bg: '#f0fdf4', color: '#16a34a', label: '✅ مكتمل' },
        };
        const s = statusColors[status];
        if (!s) return null;
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: s.bg, color: s.color,
            padding: compact ? '2px 8px' : '3px 10px',
            borderRadius: '12px', fontSize: compact ? '0.7rem' : '0.75rem',
            fontWeight: 600, border: `1px solid ${s.color}30`,
          }}>
            {s.label}
          </span>
        );
      })()}
    </div>
  );
};
