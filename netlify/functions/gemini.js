
import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('SERVER: API_KEY missing');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Configuration Error: API_KEY is missing on server.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const promptContents = body.contents;

    if (!promptContents) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Bad Request: "contents" is missing.' }) };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // استخدام النموذج الأساسي بدون إعدادات معقدة لتقليل احتمالات الخطأ
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptContents,
    });

    // محاولة استخراج النص بطرق متعددة لضمان عدم الفشل
    let text = response.text; 
    
    if (!text && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            text = candidate.content.parts.map(p => p.text).join('');
        }
    }

    if (!text) {
        // التحقق من سبب التوقف (الحظر مثلاً)
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason) {
             return { statusCode: 500, body: JSON.stringify({ error: `AI response blocked. Reason: ${finishReason}` }) };
        }
        return { statusCode: 500, body: JSON.stringify({ error: 'AI returned an empty response.' }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Gemini Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};

