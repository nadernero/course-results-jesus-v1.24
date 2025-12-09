// هذه الدالة تعمل على خوادم Netlify (بأمان) وليس في المتصفح
import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  // 1. السماح فقط بطلبات POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2. جلب المفتاح السري بأمان بالاسم الصحيح
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY is not set.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error: API key not configured.' }),
    };
  }

  // 3. قراءة "محتوى" الطلب القادم من المتصفح
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request: Invalid JSON.' }) };
  }

  const promptContents = requestBody.contents;
  if (!promptContents) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request: "contents" are required.' }) };
  }
  
  try {
    // 4. استخدام حزمة جوجل الرسمية للاتصال
    const ai = new GoogleGenAI({ apiKey });
    
    // استدعاء النموذج
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptContents,
    });

    // استخلاص النص من الرد المبسط
    const text = response.text;

    // 5. إرسال رد مبسط يحتوي على النص فقط إلى المتصفح
    return {
      statusCode: 200,
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Error in Netlify function with SDK:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error while calling Gemini.' }),
    };
  }
};
