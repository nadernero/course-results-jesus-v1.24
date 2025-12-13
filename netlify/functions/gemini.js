
import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  // إعداد رؤوس CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // معالجة طلبات OPTIONS (Preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // السماح فقط بطلبات POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("SERVER ERROR: API Key is missing");
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server Configuration Error: API Key is missing.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const contentInput = body.contents;

    if (!contentInput) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request: "contents" is required.' }) };
    }

    // تهيئة العميل
    const ai = new GoogleGenAI({ apiKey });
    
    // استخدام نموذج gemini-1.5-flash لضمان الاستقرار والسرعة
    const modelId = 'gemini-1.5-flash'; 

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contentInput,
      config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      }
    });

    let text = null;
    
    // محاولة استخراج النص بأمان
    try {
        text = response.text;
    } catch (e) {
        console.warn("Could not get text via property:", e);
    }

    // محاولة بديلة إذا فشلت الطريقة الأولى
    if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
    }

    if (!text) {
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason) {
             return { statusCode: 200, headers, body: JSON.stringify({ text: `(لم يتم توليد نص. السبب: ${finishReason})` }) };
        }
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI returned an empty response.' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Gemini Handler Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
          error: 'حدث خطأ أثناء معالجة الطلب في السيرفر.', 
          details: error.message 
      }),
    };
  }
};

