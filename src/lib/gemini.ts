import { GoogleGenAI, Type } from "@google/genai";
import { RoomDimensions, AISuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getTileSuggestions(room: RoomDimensions): Promise<AISuggestion[]> {
  const prompt = `Suggest 3 suitable floor and wall tile designs for a ${room.type} that is ${room.width}m x ${room.length}m with a height of ${room.height}m. 
  Consider the specific needs of a ${room.type} (e.g., kitchen needs durable, non-slip; hall needs aesthetic appeal).
  Patterns available: 'square', 'checker', 'diagonal', 'offset', 'herringbone', 'basketweave', 'mosaic', 'windmill', 'hopscotch', 'chevron', 'random-mix', 'modular-3', 'pinwheel', 'versailles', '3d-cube', 'medallion'.
  Provide the suggestion in JSON format with pattern, floor tile size (width, length in cm), wall tile size (width, length in cm), floor tile color (hex), wall color (hex), and a brief reasoning.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pattern: { type: Type.STRING, description: "One of: square, checker, diagonal, offset, herringbone, basketweave, mosaic, windmill, hopscotch, chevron, random-mix, modular-3, pinwheel, versailles, 3d-cube, medallion" },
              tileSize: {
                type: Type.OBJECT,
                properties: {
                  width: { type: Type.NUMBER },
                  length: { type: Type.NUMBER }
                },
                required: ["width", "length"]
              },
              wallTileSize: {
                type: Type.OBJECT,
                properties: {
                  width: { type: Type.NUMBER },
                  length: { type: Type.NUMBER }
                },
                required: ["width", "length"]
              },
              color: { type: Type.STRING, description: "Hex color code for the floor tile" },
              wallColor: { type: Type.STRING, description: "Hex color code for the walls" },
              reasoning: { type: Type.STRING }
            },
            required: ["pattern", "tileSize", "wallTileSize", "color", "wallColor", "reasoning"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching AI suggestions:", error);
    return [
      {
        pattern: 'square',
        tileSize: { width: 60, length: 60 },
        color: '#ffffff',
        wallColor: '#e2e8f0',
        reasoning: "Standard 60x60 tiles are versatile for most room sizes."
      }
    ];
  }
}
