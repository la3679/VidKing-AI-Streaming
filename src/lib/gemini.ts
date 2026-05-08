import { GoogleGenAI } from "@google/genai";

// Use process.env.GEMINI_API_KEY as per instructions
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const MODELS = {
  flash: "gemini-3-flash-preview",
  pro: "gemini-3.1-pro-preview",
  embedding: "gemini-embedding-2-preview"
};

export async function generateAIPick(watchHistory: any[]) {
  if (!apiKey) return null;
  
  try {
    const response = await ai.models.generateContent({
      model: MODELS.flash,
      contents: `You are an expert movie recommender. Based on the following watch history: ${JSON.stringify(watchHistory)}, suggest 5 movies/shows with a brief reason why. Return as JSON array of objects with {title, reason, type}.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Pick Error:", error);
    return [];
  }
}
