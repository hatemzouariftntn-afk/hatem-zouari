import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function generateAIResponse(
  documentContent: string,
  userPrompt: string,
  documentTitle: string,
  documentCategory: string
) {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('مفتاح API الخاص بـ Google Gemini مفقود. يرجى إضافته في إعدادات البيئة.');
    }

    // Use Gemini 1.5 Flash (Now available after API activation for multimodal analysis)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const promptText = `
أنت الآن مساعد إداري ذكي متخصص في صياغة الردود الرسمية والمراسلات الإدارية في الجامعة التونسية للسباحة.

المعطيات المتوفرة للرد:
- عنوان الوثيقة/المراسلة الواردة: "${documentTitle}"
- الفئة المستند: "${documentCategory}"

طلب وتوجيهات المستخدم الدقيقة للرد:
"${userPrompt}"

المطلوب:
1. اقرأ الوثيقة المرفقة (إن وُجدت) وحللها بعناية لتدعيم الرد.
2. قم بصياغة رد رسمي واحترافي باللغة العربية بناءً على توجيهات المستخدم.
3. استخدم لغة إدارية تونسية سليمة ولبقة.
4. اكتب نص المراسلة أو الرد مباشرة بدون مقدمات دردشة (لا تقل "بالتأكيد" أو "إليك الرد")، ليكون جاهزاً للنسخ والطباعة فوراً.
`;

    const parts: any[] = [{ text: promptText }];

    // Handle Document injection so the AI can actually READ the file
    if (documentContent) {
      try {
        if (documentContent.startsWith('http')) {
          // Fetch Cloudinary URL document
          const response = await fetch(documentContent);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          
          let mimeType = 'application/pdf'; // Default guessing
          if (documentContent.toLowerCase().endsWith('.png')) mimeType = 'image/png';
          else if (documentContent.toLowerCase().endsWith('.jpg') || documentContent.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
          
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        } else {
          // Direct base64 content
          let mimeType = 'application/pdf'; // Default fallback
          if (documentContent.startsWith('/9j/')) mimeType = 'image/jpeg';
          else if (documentContent.startsWith('iVBORw0K')) mimeType = 'image/png';
          
          parts.push({
            inlineData: {
              data: documentContent,
              mimeType: mimeType
            }
          });
        }
      } catch (e) {
        console.error("Warning: Failed to process document for AI context", e);
      }
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    return { success: true, text };
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return { success: false, error: error.message || 'حدث خطأ غير متوقع أثناء الاتصال بالذكاء الاصطناعي. قد يكون المفتاح غير صالح للنماذج الجديدة.' };
  }
}
