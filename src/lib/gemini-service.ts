import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Models to try in order of preference (fallback chain)
const MODEL_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
];

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1500; // 1.5 seconds base delay

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is a retryable transient error (503, 429, etc.)
 */
function isRetryableError(error: any): boolean {
  const message = error?.message || '';
  const status = error?.status || error?.httpStatusCode;
  return (
    status === 503 ||
    status === 429 ||
    message.includes('503') ||
    message.includes('Service Unavailable') ||
    message.includes('overloaded') ||
    message.includes('high demand') ||
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED')
  );
}

/**
 * Try generating content with a specific model, with retry logic
 */
async function tryGenerateWithRetry(
  modelName: string,
  parts: any[],
  retries: number = MAX_RETRIES
): Promise<{ success: boolean; text?: string; retryable?: boolean; error?: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Gemini] Attempting model "${modelName}" (attempt ${attempt}/${retries})...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();
      console.log(`[Gemini] Success with model "${modelName}" on attempt ${attempt}.`);
      return { success: true, text };
    } catch (error: any) {
      console.error(`[Gemini] Error with model "${modelName}" (attempt ${attempt}):`, error.message);

      if (isRetryableError(error) && attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`[Gemini] Retryable error detected. Waiting ${delay}ms before retry...`);
        await sleep(delay);
        continue;
      }

      return {
        success: false,
        retryable: isRetryableError(error),
        error: error.message
      };
    }
  }
  return { success: false, retryable: true, error: 'استُنفذت جميع المحاولات.' };
}

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

    // Try each model in the fallback chain
    for (const modelName of MODEL_CHAIN) {
      const result = await tryGenerateWithRetry(modelName, parts);
      if (result.success) {
        return { success: true, text: result.text };
      }
      // If error is not retryable (e.g., auth error), stop trying other models
      if (!result.retryable) {
        return {
          success: false,
          error: result.error || 'حدث خطأ غير متوقع أثناء الاتصال بالذكاء الاصطناعي.'
        };
      }
      console.log(`[Gemini] Model "${modelName}" unavailable, trying next fallback...`);
    }

    // All models exhausted
    return {
      success: false,
      error: 'خوادم الذكاء الاصطناعي Google Gemini تعاني حالياً من ضغط عالٍ. تم تجربة عدة نماذج بديلة دون جدوى. يرجى إعادة المحاولة بعد بضع دقائق.'
    };
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return { success: false, error: error.message || 'حدث خطأ غير متوقع أثناء الاتصال بالذكاء الاصطناعي.' };
  }
}

