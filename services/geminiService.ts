
import { GoogleGenAI } from "@google/genai";

export const processWithAI = async (input: string, prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a text processing expert. Transform the following input text according to these instructions: "${prompt}". Return ONLY the transformed text output.
      
      Input:
      ${input}`,
    });

    return response.text || "AI produced no output.";
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw error;
  }
};
