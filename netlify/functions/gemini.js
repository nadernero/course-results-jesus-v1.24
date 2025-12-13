
import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  // 1. السماح فقط بطلبات POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2. التحقق من وجود المفتاح
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY is not set.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error: API key not configured.' }),
    };
  }

  try {
    // 3. قراءة البيانات القادمة من الواجهة الأمامية
    const requestBody = JSON.parse(event.body);
    const promptContents = requestBody.contents;

    if (!promptContents) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Bad request: "contents" are required.' }) };
    }

    // 4. إعداد العميل باستخدام المكتبة الجديدة
    const ai = new GoogleGenAI({ apiKey });

    // 5. استدعاء النموذج الحديث (Flash 2.5)
    // هذا الموديل هو الأسرع والأكثر توافقاً حالياً مع المكتبة الجديدة
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptContents,
    });

    // 6. إرجاع النتيجة
    const text = response.text;
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate content.', 
        details: error.message 
      }),
    };
  }
};

