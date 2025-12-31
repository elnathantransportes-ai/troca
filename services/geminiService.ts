import { GoogleGenAI, Type } from "@google/genai";
import { ModerationResult } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const analyzeContentWithGemini = async (
  title: string,
  description: string,
  base64Image?: string
): Promise<ModerationResult> => {
  if (!apiKey) {
    console.warn("API Key missing, skipping AI moderation (mock approve)");
    return { approved: true, confidence: 1.0 };
  }

  try {
    const model = 'gemini-3-flash-preview';
    const parts: any[] = [];
    
    let promptText = `
      You are a content moderation AI for a peer-to-peer trading app called "TROCA TROCA".
      Analyze the following item listing.
      Rules:
      1. No illegal items (drugs, weapons, stolen goods).
      2. No adult/NSFW content.
      3. No spam or gibberish.
      4. No hate speech or violence.
      
      Item Title: ${title}
      Item Description: ${description}
    `;

    if (base64Image) {
      promptText += "\nAnalyze the attached image as well for compliance.";
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            approved: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["approved", "confidence"],
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const result = JSON.parse(jsonText) as ModerationResult;
    return result;

  } catch (error) {
    console.error("Gemini Moderation Error:", error);
    return { approved: true, reason: "AI Service unavailable, auto-approved.", confidence: 0 };
  }
};

export const geminiService = {
  generateAIDescription: async (title: string, interest: string, draft: string) => {
    if (!apiKey) {
      return { titulo: title + " (Melhorado)", descricao: draft + "\n\n(Descrição melhorada automaticamente - Mock)" };
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Melhore o anúncio de um produto para o app de trocas.
            Produto: ${title}
            Interesse de troca: ${interest}
            Rascunho: ${draft}
            
            Gere um JSON com "titulo" (chamativo) e "descricao" (detalhada e vendedora).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    titulo: { type: Type.STRING },
                    descricao: { type: Type.STRING },
                  },
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Gemini improve error", e);
        return { titulo: title, descricao: draft };
    }
  },

  verifyDocumentQuality: async (base64Image: string) => {
    if (!apiKey) return { valid: true };

    try {
      const parts: any[] = [{
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image.split(',')[1] || base64Image
        }
      }, {
        text: `Analyze this image. Is it a valid identification document (ID card, Driver's License) and is the text legible?
               Respond with JSON: { "valid": boolean, "reason": string }`
      }];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
           responseMimeType: "application/json",
           responseSchema: {
             type: Type.OBJECT,
             properties: {
               valid: { type: Type.BOOLEAN },
               reason: { type: Type.STRING }
             }
           }
        }
      });
      return JSON.parse(response.text || '{"valid": false}');
    } catch (e) {
      console.error("Gemini Doc Verify Error", e);
      return { valid: true }; // Fallback
    }
  },

  verifyHumanFace: async (base64Image: string) => {
    if (!apiKey) return { isHuman: true }; // Fallback

    try {
      const parts: any[] = [{
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image.split(',')[1] || base64Image
        }
      }, {
        text: `Analyze this profile picture for a user account.
               1. Does it contain a visible human face? (Selfies, headshots are OK).
               2. Tolerate low quality, grain, or bad lighting, as long as a face is distinguishable.
               3. Reject objects, animals, cartoons, or landscape-only photos.
               
               Respond with JSON: { "isHuman": boolean, "reason": string }`
      }];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
           responseMimeType: "application/json",
           responseSchema: {
             type: Type.OBJECT,
             properties: {
               isHuman: { type: Type.BOOLEAN },
               reason: { type: Type.STRING }
             }
           }
        }
      });
      return JSON.parse(response.text || '{"isHuman": true}');
    } catch (e) {
      console.error("Gemini Face Verify Error", e);
      return { isHuman: true };
    }
  }
};