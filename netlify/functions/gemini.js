
import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  // 1. CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // 2. Handle Preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 3. Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    console.log("Gemini Function Invoked");

    // 4. API Key Validation
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("SERVER ERROR: API Key is missing in environment variables.");
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'Configuration Error: API Key is missing.' }) 
      };
    }

    // 5. Parse Body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const contentInput = body.contents;
    if (!contentInput) {
        console.warn("Missing 'contents' in request body");
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request: "contents" is required.' }) };
    }

    // 6. Initialize AI Client
    const ai = new GoogleGenAI({ apiKey });
    const modelId = 'gemini-2.5-flash'; 

    console.log(`Calling Gemini Model: ${modelId}`);

    // 7. Call AI Model
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contentInput, // Pass string directly, SDK handles it
      config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      }
    });

    console.log("Gemini Response Received");

    // 8. Extract Text
    let text = null;
    
    // Attempt standard property access
    if (response && typeof response.text === 'string') {
        text = response.text;
    } else if (response && response.text && typeof response.text === 'function') {
        // Fallback just in case, though prohibited by guidelines, some mocks might use it
        text = response.text(); 
    } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        // Fallback to deep path
        text = response.candidates[0].content.parts[0].text;
    } else {
        // Log the full response to debug structure if text is missing
        console.warn("Unexpected Response Structure:", JSON.stringify(response, null, 2));
    }

    if (!text) {
        const finishReason = response?.candidates?.[0]?.finishReason;
        if (finishReason) {
             return { statusCode: 200, headers, body: JSON.stringify({ text: `(لم يتم توليد نص. السبب: ${finishReason})` }) };
        }
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI returned an empty response.', raw: response }) };
    }

    // 9. Success Response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    // 10. Global Error Handler (Prevents 502 crashes)
    console.error('Gemini Handler Fatal Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
          error: 'حدث خطأ أثناء معالجة الطلب في السيرفر.', 
          details: error.message || String(error)
      }),
    };
  }
};

