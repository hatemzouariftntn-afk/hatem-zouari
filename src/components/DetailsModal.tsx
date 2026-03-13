"use client";

import React, { useState } from 'react';
import { Document } from '@/types';
import { getGeminiApiKeyAction } from '@/app/ai/actions';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: Document | null;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, onClose, doc }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  
  if (!isOpen || !doc) return null;

  const handleGenerateAIResponse = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGeneratingAI(true);
    setAiError('');
    setAiResponse('');
    
    try {
      // 1. Fetch API key securely from Server (bypassing Render EU server restrictions)
      const apiKey = await getGeminiApiKeyAction();
      if (!apiKey) {
        setAiError('مفتاح API مفقود.');
        setIsGeneratingAI(false);
        return;
      }

      // 2. Initialize Gemini on the CLIENT SIDE to use local Tunisian IP instead of Render's Germany IP
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Determine if we have a document to process (vision model) or just text (pro model)
      const hasImage = doc.content && (
        doc.content.startsWith('http') || 
        doc.content.startsWith('data:image') || 
        doc.content.includes('/9j/') || 
        doc.content.includes('iVBORw0K')
      );
      
      // Use the globally available 1.0 models instead of 1.5 which may be regionally restricted for this key
      const modelName = hasImage ? 'gemini-pro-vision' : 'gemini-pro';
      const model = genAI.getGenerativeModel({ model: modelName });

      const promptText = `
أنت الآن مساعد إداري ذكي متخصص في صياغة الردود الرسمية والمراسلات الإدارية في الجامعة التونسية للسباحة.

المعطيات المتوفرة للرد:
- عنوان الوثيقة/المراسلة الواردة: "${doc.title}"
- الفئة المستند: "${doc.category}"

طلب وتوجيهات المستخدم الدقيقة للرد:
"${aiPrompt}"

المطلوب:
1. اقرأ الوثيقة المرفقة (إن وُجدت) وحللها بعناية لتدعيم الرد.
2. قم بصياغة رد رسمي واحترافي باللغة العربية بناءً على توجيهات المستخدم.
3. استخدم لغة إدارية تونسية سليمة ولبقة.
4. اكتب نص المراسلة أو الرد مباشرة بدون مقدمات دردشة (لا تقل "بالتأكيد" أو "إليك الرد")، ليكون جاهزاً للنسخ والطباعة فوراً.
`;

      const parts: any[] = [promptText];

      // Fetch and attach the document inline
      if (doc.content) {
        try {
          if (doc.content.startsWith('http')) {
            const response = await fetch(doc.content);
            const blob = await response.blob();
            const reader = new FileReader();
            
            const base64Data = await new Promise<string>((resolve) => {
              reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]); // remove data:image/...;base64,
              };
              reader.readAsDataURL(blob);
            });
            
            let mimeType = blob.type || 'application/pdf';
            if (!blob.type) {
              if (doc.content.toLowerCase().endsWith('.png')) mimeType = 'image/png';
              else if (doc.content.toLowerCase().match(/\.(jpg|jpeg)$/)) mimeType = 'image/jpeg';
            }
            
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            });
          } else {
            // Direct base64 string
            const base64Data = doc.content.includes(',') ? Object.values(doc.content.split(','))[1] : doc.content;
            let mimeType = 'application/pdf'; // Default fallback
            if (base64Data.startsWith('/9j/')) mimeType = 'image/jpeg';
            else if (base64Data.startsWith('iVBORw0K')) mimeType = 'image/png';
            
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            });
          }
        } catch (e) {
          console.warn("Could not fetch document for AI context. Proceeding with text only. ", e);
        }
      }

      // Send Request directly to Google AI from Browser!
      const result = await model.generateContent(parts);
      const textResponse = result.response.text();
      setAiResponse(textResponse);
      
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'حدث خطأ في الاتصال بالمساعد الذكي.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

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
               
               {/* تحقق ما إذا كان المحتوى عبارة عن رابط سحابي (Cloudinary) أو Base64 قديم */}
               {doc.content.startsWith('http') ? (
                 <a href={doc.content} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-block', marginBottom: '15px' }}>
                   عرض / تحميل الملف من السحابة
                 </a>
               ) : (
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
                   style={{ marginBottom: '15px' }}
                 >
                   تحميل الملف المحلي
                 </button>
               )}

               {doc.mimeType.startsWith('image/') && (
                 <div>
                   <strong>معاينة:</strong>
                   <img
                     src={doc.content.startsWith('http') ? doc.content : `data:${doc.mimeType};base64,${doc.content}`}
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

      {/* منطقة المساعد الذكي AI Assistant */}
      <div className="ai-assistant-section" style={{ marginTop: '20px', padding: '15px', borderTop: '2px dashed #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✨ المساعد الذكي (صياغة الردود)
        </h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>توجيهات الرد / المعطيات المطلوبة:</label>
          <textarea 
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="مثال: أكتب ردا رسميا أؤكد فيه أن عدد النوادي هو 45 نادياً بمجموع 2000 سباح للموسم 2025-2026..."
            className="form-control"
            style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
            disabled={isGeneratingAI}
          />
        </div>

        <button 
          onClick={handleGenerateAIResponse} 
          className="btn btn-primary"
          style={{ width: '100%', background: 'linear-gradient(45deg, #2563eb, #8b5cf6)', border: 'none' }}
          disabled={isGeneratingAI || !aiPrompt.trim()}
        >
          {isGeneratingAI ? '⏳ جاري صياغة الرد بالذكاء الاصطناعي...' : '🚀 توليد الرد الآن'}
        </button>

        {aiError && (
          <div style={{ marginTop: '10px', color: '#ef4444', fontSize: '14px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
            {aiError}
          </div>
        )}

        {aiResponse && (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', position: 'relative' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#1e293b' }}>📝 الرد المقترح:</h4>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>
              {aiResponse}
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(aiResponse);
                alert('تم نسخ الرد إلى الحافظة بنجاح! 📋');
              }}
              className="btn btn-secondary"
              style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 8px', fontSize: '12px' }}
            >
              📋 نسخ
            </button>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button
          onClick={() => {
            setAiResponse('');
            setAiPrompt('');
            setAiError('');
            onClose();
          }}
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
