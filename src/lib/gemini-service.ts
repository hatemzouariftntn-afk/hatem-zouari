import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
// Make sure to add GOOGLE_GEMINI_API_KEY to your .env file or Render environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function generateAIResponse(
  documentText: string,
  userPrompt: string,
  documentTitle: string,
  documentCategory: string
) {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('مفتاح API الخاص بـ Google Gemini مفقود. يرجى إضافته في إعدادات البيئة.');
    }

    // Use Gemini Pro
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Constructing a detailed prompt that forces the AI to act as an assistant
    const prompt = `
أنت الآن مساعد إداري ذكي وخبير في صياغة الردود الرسمية والمراسلات الإدارية التونسية في الجامعة التونسية للسباحة.

المعطيات المتوفرة لديك:
- عنوان المستند أو المراسلة الواردة: "${documentTitle}"
- فئة المستند: "${documentCategory}"

النص المستخرج من المراسلة الأصلية (إن وجد):
"""
${documentText ? documentText : '(لم يتم استخراج نص أو المستند عبارة عن صورة/ملف غير مقروء حالياً)'}
"""

طلب المستخدم (توجيهات الرد):
"${userPrompt}"

المطلوب منك:
1. صياغة رد رسمي واحترافي باللغة العربية بناءً على طلب المستخدم والمراسلة الأصلية.
2. استخدم لغة إدارية سليمة ولبقة.
3. لا تكتب مقدمات مثل "بالتأكيد، إليك الرد"، بل اكتب نص الرد مباشرة ليكون جاهزاً للنسخ واللصق.
4. إذا طلب المستخدم معطيات أو إحصائيات معينة في توجيهاته، قم بتضمينها بشكل منظم في الرد.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { success: true, text };
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return { success: false, error: error.message || 'حدث خطأ غير متوقع أثناء الاتصال بالذكاء الاصطناعي.' };
  }
}
