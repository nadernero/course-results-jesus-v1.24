
import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  // 1. إعداد رؤوس CORS للسماح بالاتصال من أي مكان (حل مشاكل المتصفح)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // معالجة طلبات Preflight (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("SERVER ERROR: API Key is missing");
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration Error: API Key is missing on server.' }) };
  }

  try {
    // 2. تحليل الطلب
    const body = JSON.parse(event.body || '{}');
    const contentInput = body.contents;

    if (!contentInput) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request: "contents" is required.' }) };
    }

    // 3. تهيئة العميل
    const ai = new GoogleGenAI({ apiKey });
    
    // استخدام نموذج gemini-1.5-flash لضمان أقصى درجات الاستقرار والسرعة
    // (النماذج الأحدث قد تكون غير مستقرة أحياناً وتسبب 502)
    const modelId = 'gemini-1.5-flash'; 

    // 4. استدعاء النموذج
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contentInput,
      config: {
        // إعدادات أمان مرنة للسماح بالنصوص الدينية والروحية
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      }
    });

    // 5. استخراج النص بحذر شديد
    let text = null;
    try {
        text = response.text;
    } catch (e) {
        console.warn("Warning: Could not access response.text getter directly.", e);
    }

    // محاولة بديلة يدوية إذا فشل الـ Getter
    if (!text && response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content?.parts;
        if (parts && parts.length > 0) {
            text = parts.map(p => p.text).join('');
        }
    }

    if (!text) {
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason) {
             return { statusCode: 200, headers, body: JSON.stringify({ text: `(لم يتم توليد نص. السبب: ${finishReason})` }) };
        }
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI returned an empty response.' }) };
    }

    // 6. إرجاع النتيجة بنجاح
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Gemini Handler Error:', error);
    // إرجاع تفاصيل الخطأ للمساعدة في التصحيح
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
          error: 'حدث خطأ أثناء الاتصال بالخادم.', 
          details: error.message || error.toString() 
      }),
    };
  }
};

