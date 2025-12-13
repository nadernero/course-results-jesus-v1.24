
import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  // 1. السماح فقط بطلبات POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // 2. التحقق من وجود المفتاح
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('SERVER ERROR: API_KEY is not set.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'خطأ في إعدادات السيرفر: مفتاح API غير موجود.' }),
    };
  }

  try {
    // 3. قراءة البيانات
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Empty request body.' }) };
    }
    
    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }

    const promptContents = requestBody.contents;
    if (!promptContents) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Bad request: "contents" are required.' }) };
    }

    // 4. إعداد العميل
    const ai = new GoogleGenAI({ apiKey });

    // 5. استدعاء النموذج مع إعدادات الأمان (هام جداً للمحتوى الديني)
    // نستخدم 'BLOCK_NONE' لتجنب الفلترة الخاطئة للنصوص الروحية
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptContents,
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }
    });

    // 6. استخراج النص بأمان
    // الخاصية .text قد تسبب خطأ (throw error) إذا كان الرد محجوباً أو فارغاً
    let text = null;
    try {
        text = response.text;
    } catch (e) {
        console.warn("Could not extract text via .text getter:", e.message);
    }

    // محاولة بديلة للاستخراج أو فحص سبب التوقف
    if (!text) {
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            // التحقق مما إذا كان هناك محتوى في الأجزاء
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                text = candidate.content.parts.map(p => p.text).join('');
            } else if (candidate.finishReason) {
                console.warn(`Blocked. Finish reason: ${candidate.finishReason}`);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: `لم يتمكن المساعد من الرد. السبب: ${candidate.finishReason}` })
                };
            }
        }
    }

    if (!text) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'عاد المساعد برد فارغ. يرجى المحاولة مرة أخرى بصياغة مختلفة.' })
        };
    }
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Gemini API Integration Error:', error);
    
    let errorMessage = 'حدث خطأ غير متوقع أثناء التواصل مع المساعد الذكي.';
    const errString = error.toString().toLowerCase();

    if (errString.includes('api key')) errorMessage = 'مفتاح API غير صالح أو غير مفعل.';
    else if (errString.includes('quota') || errString.includes('429')) errorMessage = 'تم تجاوز حد الاستخدام المسموح به حالياً.';
    else if (errString.includes('network') || errString.includes('fetch')) errorMessage = 'خطأ في الاتصال بالشبكة.';

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: errorMessage, 
        details: error.message 
      }),
    };
  }
};
