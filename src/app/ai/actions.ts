'use server';

import { generateAIResponse } from '@/lib/gemini-service';

export async function createAIResponseAction(
  documentText: string,
  userPrompt: string,
  documentTitle: string,
  documentCategory: string
) {
  if (!userPrompt.trim()) {
    return { success: false, error: 'يرجى كتابة توجيهك للمساعد الذكي أولاً.' };
  }

  try {
    const aiResult = await generateAIResponse(
      documentText,
      userPrompt,
      documentTitle,
      documentCategory
    );

    return aiResult;
  } catch (error: any) {
    console.error('Error in createAIResponseAction:', error);
    return { success: false, error: 'فشل في توليد الرد، يرجى المحاولة لاحقاً.' };
  }
}
