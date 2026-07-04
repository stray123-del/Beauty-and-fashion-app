import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const PORT = 3000;
const app = express();

// Set up JSON body parser with generous limit for face scan images (base64)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Initialize Gemini client with standard user agent header
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to convert base64 image parts
function fileToGenerativePart(base64Data: string) {
  // Extract content type and clean base64 string
  const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (matches && matches.length === 3) {
    return {
      inlineData: {
        data: matches[2],
        mimeType: matches[1]
      }
    };
  }
  
  // Fallback if raw base64 was passed directly
  return {
    inlineData: {
      data: base64Data,
      mimeType: "image/jpeg"
    }
  };
}

// Skincare Analysis API
app.post("/api/skincare/scan", async (req, res) => {
  try {
    const { image, concerns, additionalInfo } = req.body;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key is missing. Please set it in Settings > Secrets." });
    }

    let contents: any[] = [];
    
    // Add image if provided
    if (image) {
      try {
        const imagePart = fileToGenerativePart(image);
        contents.push(imagePart);
      } catch (err) {
        console.error("Error parsing image:", err);
      }
    }

    const promptText = `
      Analyze this user's skin profile.
      Self-reported primary skin concerns: ${concerns ? concerns.join(", ") : "None specified"}.
      User's additional notes: ${additionalInfo || "None provided"}.

      If an image is attached, inspect the face structure and skin surface to identify:
      1. Primary skin type (Oily, Dry, Normal, Sensitive, or Combination).
      2. Any signs of acne, congestion, dryness, redness, or barrier compromise.
      3. Acne localization zones (e.g. cheeks, forehead, chin, nose) and potential causes (e.g., pore clogging, dehydration, friction, hormonal indicators).

      If no image is attached, formulate the assessment based entirely on their selected concerns and symptoms.

      Provide practical product category advice, morning and night routines, key active ingredients to target, and realistic lifestyle choices.
      Ensure the tone is warm, highly professional, scientific, empathetic, and reassuring.
    `;
    
    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are an expert dermatological advisor and aesthetician specializing in skin barrier health, acne resolution, and personalized product formulation recommendations. Analyze inputs and provide science-backed, warm, helpful routines.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skinType: {
              type: Type.STRING,
              description: "The identified skin type (e.g. 'Combination', 'Oily', 'Dry', 'Sensitive', 'Normal')."
            },
            skinTypeDescription: {
              type: Type.STRING,
              description: "Brief scientific explanation of what this skin type means and how it behaves."
            },
            detectedConcerns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific issues seen or reported (e.g., 'Forehead Acne Congestion', 'Cheek Redness', 'Dehydrated Skin Barrier')."
            },
            concernAnalysis: {
              type: Type.STRING,
              description: "A detailed but clear breakdown of why these concerns are manifesting, especially related to breakouts or irritation, keeping explanations constructive and positive."
            },
            morningRoutine: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  category: { type: Type.STRING, description: "e.g., Cleanser, Toner, Treatment Serum, Moisturizer, Sunscreen" },
                  action: { type: Type.STRING, description: "Detailed description of how to apply and why it is being used" },
                  productsOrIngredients: { type: Type.STRING, description: "Active ingredients or product textures to look for" }
                },
                required: ["stepNumber", "category", "action", "productsOrIngredients"]
              },
              description: "Morning skincare sequence ordered chronologically."
            },
            nightRoutine: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  category: { type: Type.STRING, description: "e.g., Makeup Remover/Oil Cleanser, Water-based Cleanser, Treatment/Retinoid, Spot Treatment, Moisturizer" },
                  action: { type: Type.STRING, description: "Detailed description of the night routine application" },
                  productsOrIngredients: { type: Type.STRING, description: "Specific active ingredients, spot treatments, or moisturizing formulations" }
                },
                required: ["stepNumber", "category", "action", "productsOrIngredients"]
              },
              description: "Night skincare sequence ordered chronologically."
            },
            targetIngredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "e.g., Salicylic Acid, Zinc PCA, Niacinamide, Centella Asiatica, Ceramide NP" },
                  purpose: { type: Type.STRING, description: "How this ingredient targets their specific acne or skin concerns" },
                  howToUse: { type: Type.STRING, description: "Guidance on concentration, timing, or pairing warnings" }
                },
                required: ["name", "purpose", "howToUse"]
              },
              description: "Key skincare active ingredients recommended for their concerns."
            },
            recommendedProducts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "Product type, e.g. Cleanser, Treatment, Spot Gel" },
                  productName: { type: Type.STRING, description: "Literal generic recommendation, e.g., 'Gentle Salicylic Acid Cleanser (2%)', 'Squalane-based barrier moisturizer', 'Hydrocolloid acne patches'" },
                  activeIngredients: { type: Type.STRING, description: "Key actives inside" },
                  advice: { type: Type.STRING, description: "Why this specific formulation is perfect for their current breakouts/skin" }
                },
                required: ["category", "productName", "activeIngredients", "advice"]
              },
              description: "General, highly helpful product recommendations that target acne and support skin type without referencing proprietary gatekept brand formulations."
            },
            lifestyleTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Highly actionable everyday tips (e.g. 'Wash silk pillowcases weekly', 'Avoid physical face scrubs', 'Hydrate internally with 2L water', 'Avoid picking or popping active pustules')."
            }
          },
          required: [
            "skinType",
            "skinTypeDescription",
            "detectedConcerns",
            "concernAnalysis",
            "morningRoutine",
            "nightRoutine",
            "targetIngredients",
            "recommendedProducts",
            "lifestyleTips"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const result = JSON.parse(text);
    // Inject current date
    result.analysisDate = new Date().toLocaleDateString();
    
    return res.json(result);
  } catch (error: any) {
    console.error("Skincare scan failed:", error);
    return res.status(500).json({ error: error.message || "An unexpected error occurred during skin analysis." });
  }
});

// Fashion Styling API
app.post("/api/fashion/style", async (req, res) => {
  try {
    const { bodyType, styleVibe, occasion, weather, image, additionalNotes } = req.body;

    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key is missing. Please set it in Settings > Secrets." });
    }

    let contents: any[] = [];
    
    // Add image of clothing item if provided
    if (image) {
      try {
        const imagePart = fileToGenerativePart(image);
        contents.push(imagePart);
      } catch (err) {
        console.error("Error parsing clothing image:", err);
      }
    }

    const promptText = `
      You are a professional fashion stylist. Generate custom style recommendations based on:
      - Body Type: ${bodyType || "Not specified (General fit advice)"}
      - Chosen Style Vibe/Aesthetic: ${styleVibe || "Modern Classic"}
      - Occasion: ${occasion || "Casual Everyday"}
      - Current Weather/Season context: ${weather || "Transitional"}
      - Additional preferences: ${additionalNotes || "None"}

      ${image ? "An image of a specific clothing item is attached. Design outfits that integrate, highlight, or pair beautifully with this specific piece." : ""}

      Incorporate current high-street and couture trends (e.g. relaxed silhouettes, texture pairing, capsule pieces, retro elements, tonal layering).
      Explain what fits flatter their body structure, provide three complete curated looks (from main piece to layering, shoes, and accents), and practical Dos & Don'ts.
    `;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are an elite personal stylist and trend forecaster. You understand body shape geometry, color theory, aesthetic archetypes, and modern fashion trends.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bodyType: { type: Type.STRING },
            styleVibe: { type: Type.STRING },
            occasion: { type: Type.STRING },
            analysis: {
              type: Type.STRING,
              description: "A professional styling analysis of how to balance proportions and what structures suit the body type best for this specific occasion."
            },
            curatedLooks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "A creative name for the look (e.g. 'Relaxed Chic', 'Monochromatic Powerhouse')" },
                  description: { type: Type.STRING, description: "General vibe and styling intention of this look" },
                  pieces: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        item: { type: Type.STRING, description: "The clothing garment (e.g. 'High-waisted wide-leg tailored trousers in cream')" },
                        styleTip: { type: Type.STRING, description: "How to wear it, tucking, or rolling sleeves advice" }
                      },
                      required: ["item", "styleTip"]
                    }
                  },
                  accessories: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Bags, belts, jewelry, sunglasses, or hats that elevate the look."
                  },
                  colorPalette: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of 3-4 specific shades/colors in this outfit."
                  }
                },
                required: ["name", "description", "pieces", "accessories", "colorPalette"]
              },
              description: "Three tailored complete outfits designed for the user."
            },
            keyTrends: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Current fashion trends that this set of recommendations borrows or incorporates."
            },
            styleDos: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Practical tailoring and style choices that elevate their presence."
            },
            styleDonts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Proportions, fabrics, or accessories to avoid for this specific styling profile."
            }
          },
          required: [
            "bodyType",
            "styleVibe",
            "occasion",
            "analysis",
            "curatedLooks",
            "keyTrends",
            "styleDos",
            "styleDonts"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const result = JSON.parse(text);
    result.recommendationDate = new Date().toLocaleDateString();

    return res.json(result);
  } catch (error: any) {
    console.error("Style suggestion failed:", error);
    return res.status(500).json({ error: error.message || "An unexpected error occurred during style modeling." });
  }
});

// Vite Middleware & Static Asset serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
