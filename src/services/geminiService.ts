import { GoogleGenAI, Type } from "@google/genai";
import { Movie } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

const model = "gemini-3-flash-preview";

export async function getAiRecommendations(prompt: string, language: string = 'ar'): Promise<string[]> {
  const systemInstruction = `
    You are a professional movie expert for the "FalakPlay" app.
    Your task is to suggest 5-8 movies based on the user's mood or request.
    Only return a JSON array of movie titles (strings).
    Example: ["Inception", "Interstellar", "The Dark Knight"]
    Current language for interaction is ${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}

export async function getMovieDescription(movieTitle: string, language: string = 'ar'): Promise<string> {
  const systemInstruction = `
    Provide a short, cinematic description (max 2 sentences) for the movie: ${movieTitle}.
    Return only the text in ${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Describe this movie cinematically.",
      config: { systemInstruction }
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
}
