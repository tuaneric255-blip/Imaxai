
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

// Key for LocalStorage
export const USER_API_KEY_STORAGE = 'user_gemini_api_key';

// Helper to get a fresh AI client instance with the latest API KEY
// PRIORITY: LocalStorage (User Key) > process.env (System Key)
const getAiClient = () => {
  const userKey = localStorage.getItem(USER_API_KEY_STORAGE);
  const rawKey = userKey || process.env.API_KEY;

  // SANITIZATION FIX:
  // "String contains non ISO-8859-1 code point" error happens if the API Key contains
  // non-ASCII characters (like invisible spaces, accents, or smart quotes).
  // We strictly replace anything that is not a standard printable ASCII character.
  const apiKey = rawKey ? rawKey.replace(/[^\x20-\x7E]/g, '').trim() : '';

  if (!apiKey) {
    throw new Error("MISSING_API_KEY: Vui lòng nhập API Key trong phần Cài đặt để sử dụng.");
  }

  return new GoogleGenAI({ apiKey: apiKey });
}

export interface ImageAnalysisResult {
  prompt: string;
  negativePrompt: string;
  tags: string[];
  camera: string;
  lighting: string;
}

export interface LookbookConsultation {
    product_type: string;
    material_analysis: string;
    lighting_suggestion: string;
    recommended_shots: {
        shot_name: string;
        rationale: string;
        technical_prompt: string;
    }[];
}

// --- Retry Logic Helper ---
// Increased default retries to 5 and initial delay to 5000ms (5s)
// Backoff strategy: 5s -> 10s -> 20s -> 40s -> 80s
const callWithRetry = async <T>(fn: () => Promise<T>, retries = 5, initialDelay = 5000): Promise<T> => {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error: any) {
      const isQuotaError = 
        error.status === 429 || 
        error.status === 503 || // Service Unavailable (often due to overload)
        (error.message && error.message.includes('429')) || 
        (error.message && error.message.includes('503')) ||
        (error.toString() && error.toString().toLowerCase().includes('quota')) ||
        (error.toString() && error.toString().toLowerCase().includes('exhausted')) ||
        (error.toString() && error.toString().toLowerCase().includes('overloaded'));
      
      if (isQuotaError && attempt < retries) {
        const delay = initialDelay * Math.pow(2, attempt); 
        console.warn(`Gemini API Busy/Quota (Attempt ${attempt + 1}/${retries}). Waiting ${delay/1000}s...`);
        // We can't easily notify the UI from here without a complex context, 
        // so we rely on the console and the long await time.
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Hệ thống Google đang quá tải (Max Retries). Vui lòng thử lại sau ít phút hoặc dùng API Key trả phí.");
};

// Helper to extract image data from a Gemini response
const handleImageResponse = async (response: GenerateContentResponse): Promise<string> => {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error('No image data found in the response.');
};

export const generateFaceSafeImage = async (
  prompt: string,
  negativePrompt: string,
  base64Image: string,
  mimeType: string,
  faceLock: number
): Promise<string> => {
  return callWithRetry(async () => {
      const ai = getAiClient();
      const fullPrompt = `${prompt}, with a face that strongly resembles the person in the provided image. Face lock strength at ${faceLock}%. Negative prompt: ${negativePrompt}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: mimeType } },
            { text: fullPrompt },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
      });
      return handleImageResponse(response);
  });
};

export const getImageDescription = async (base64Image: string, mimeType: string): Promise<ImageAnalysisResult> => {
    return callWithRetry(async () => {
        const ai = getAiClient();
        const prompt = "Analyze this image and generate a detailed prompt for a text-to-image model to recreate it. Also provide a negative prompt, relevant tags, and describe the camera and lighting setup. Respond in JSON format.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prompt: { type: Type.STRING },
                        negativePrompt: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        camera: { type: Type.STRING },
                        lighting: { type: Type.STRING },
                    }
                }
            }
        });

        return JSON.parse(response.text);
    });
};


export const extractOutfitFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    return callWithRetry(async () => {
        const ai = getAiClient();
        const prompt = "From the person in this image, precisely extract their complete outfit (clothing, shoes, accessories). The output must be an image with a transparent background containing only the extracted items.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ inlineData: { data: base64Image, mimeType: mimeType } }, { text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return handleImageResponse(response);
    });
};

export const swapBackground = async (
  subjectBase64: string,
  subjectMimeType: string,
  backgroundBase64: string,
  backgroundMimeType: string
): Promise<string> => {
  return callWithRetry(async () => {
      const ai = getAiClient();
      const prompt = "Take the primary subject from the first image and place them realistically onto the second image, which is the new background. Ensure lighting, shadows, and perspective are consistent.";
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: subjectBase64, mimeType: subjectMimeType } },
            { inlineData: { data: backgroundBase64, mimeType: backgroundMimeType } },
            { text: prompt },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
      });
      return handleImageResponse(response);
  });
};

export const restorePhoto = async (base64Image: string, mimeType: string): Promise<string> => {
    return callWithRetry(async () => {
        const ai = getAiClient();
        const prompt = "Restore this old, damaged, or low-quality photo. Improve clarity, fix scratches, remove noise, enhance details, and realistically colorize it if it's black and white.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ inlineData: { data: base64Image, mimeType: mimeType } }, { text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return handleImageResponse(response);
    });
};

export const inpaintImage = async (
  sourceBase64: string,
  mimeType: string,
  maskBase64: string,
  prompt: string
): Promise<string> => {
  return callWithRetry(async () => {
      const ai = getAiClient();
      const fullPrompt = `Use the second image as a mask. In the first image, replace the white area defined by the mask with: "${prompt}". The result should be seamless and photorealistic.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: sourceBase64, mimeType: mimeType } },
            { inlineData: { data: maskBase64, mimeType: 'image/png' } },
            { text: fullPrompt },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
      });
      return handleImageResponse(response);
  });
};

export const generatePromptsFromBrief = async (brief: string): Promise<string[]> => {
    return callWithRetry(async () => {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following brief, generate 4 creative, detailed, and distinct text-to-image prompts. Brief: "${brief}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prompts: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        const parsed = JSON.parse(response.text);
        return parsed.prompts || [];
    });
};

export const generateIdPhoto = async (
    base64Image: string,
    mimeType: string,
    backgroundColor: string,
    addAttire: boolean
): Promise<string> => {
    return callWithRetry(async () => {
        const ai = getAiClient();
        const attirePrompt = addAttire ? 'Add professional business attire (like a suit or blouse) suitable for an ID photo.' : '';
        const prompt = `Convert this image into a standard, high-quality ID photo. The background must be a solid, uniform color: ${backgroundColor}. The subject should be centered and facing forward. ${attirePrompt} Ensure the final image has a 3:4 aspect ratio.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ inlineData: { data: base64Image, mimeType: mimeType } }, { text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return handleImageResponse(response);
    });
};

export const generateTravelPhoto = async (
  subjectBase64: string,
  mimeType: string,
  location: string,
  style: string,
  timeOfDay: string
): Promise<string> => {
  return callWithRetry(async () => {
      const ai = getAiClient();
      const prompt = `Place the person from the provided image into this scene: "${location}". The final image should have a "${style}" style, set during "${timeOfDay}". The composition must be photorealistic, with accurate lighting, shadows, and perspective.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: subjectBase64, mimeType: mimeType } },
            { text: prompt },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
      });
      return handleImageResponse(response);
  });
};

export const tryOnFashion = async (
  modelBase64: string,
  modelMimeType: string,
  productBase64: string,
  productMimeType: string,
  category: string = 'clothing'
): Promise<string> => {
    return callWithRetry(async () => {
        const ai = getAiClient();
        
        let specificInstructions = "";

        if (category === 'watch') {
            specificInstructions = "The product is a wrist watch. Place it naturally on the model's wrist. Ensure the watch face is clearly visible, facing outward/upward, and oriented correctly (12 o'clock at the top). The strap should wrap realistically around the wrist. Do not distort the watch dial.";
        } else if (category === 'jewelry') {
            specificInstructions = "The product is jewelry. Place it on the appropriate body part (neck, ears, or finger). Ensure high reflection and realistic metal texture.";
        } else if (category === 'shoes') {
            specificInstructions = "The product is footwear. Replace the model's shoes with this product. Ensure realistic ground contact and perspective.";
        } else if (category === 'bag') {
            specificInstructions = "The product is a bag. Have the model hold the bag naturally or wear it on their shoulder. Ensure the scale is correct.";
        } else {
            specificInstructions = "The product is clothing. Drape it naturally on the model. Match the pose and lighting. Ensure folds and fabric texture look realistic.";
        }

        const negativePrompt = "Negative prompt: bad anatomy, distorted hands, missing fingers, extra limbs, blurry, low quality, watermark, text, distorted face, bad eyes, unnatural pose, mannequin, plastic skin, wrong orientation, upside down watch, distorted dial.";

        const prompt = `Virtual Try-On Task.
        Image 1: The Model.
        Image 2: The Product (${category}).
        Goal: Generate a photorealistic image of the model wearing the product.
        Instructions: ${specificInstructions}
        Maintain the model's identity, pose, and the lighting of the original scene. High quality, 8k resolution.
        ${negativePrompt}`;

        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
            { inlineData: { data: modelBase64, mimeType: modelMimeType } },
            { inlineData: { data: productBase64, mimeType: productMimeType } },
            { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
        });
        return handleImageResponse(response);
    });
}

export const consultLookbookShots = async (
    productBase64: string,
    productMimeType: string,
    additionalInfo: string
): Promise<LookbookConsultation> => {
    return callWithRetry(async () => {
        const ai = getAiClient();
        const prompt = `You are an Expert Fashion Photography Consultant (15+ years experience in E-commerce & Luxury).
        
        Analyze the provided product image and the additional context: "${additionalInfo}".
        
        Your goal is to provide a "Must-Have Shot List" to maximize conversion rates and showcase the product's best features (Material, Fit, Detail).
        
        Return a JSON object with:
        1. product_type: Specific type (e.g., Silk Dress, Leather Tote).
        2. material_analysis: Description of material properties (sheen, texture, weight).
        3. lighting_suggestion: Best lighting setup (e.g., Softbox for soft shadows, Hard light for texture).
        4. recommended_shots: An array of objects, each containing:
        - shot_name: Title of the shot (e.g., "Texture Macro", "Waist Tie Detail", "Dynamic Spin").
        - rationale: Why this shot sells the product.
        - technical_prompt: A specific instruction for the photographer/AI generator (e.g., "Macro lens, focus on stitching, f/8").

        Prioritize shots like "Texture Macro" for fabrics, "Hardware Detail" for bags, etc.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: productBase64, mimeType: productMimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        product_type: { type: Type.STRING },
                        material_analysis: { type: Type.STRING },
                        lighting_suggestion: { type: Type.STRING },
                        recommended_shots: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    shot_name: { type: Type.STRING },
                                    rationale: { type: Type.STRING },
                                    technical_prompt: { type: Type.STRING },
                                }
                            }
                        }
                    }
                }
            }
        });

        return JSON.parse(response.text);
    });
};

export const generateLookbookAsset = async (
    productBase64: string,
    productMimeType: string,
    shotType: string,
    bgContext: { type: 'prompt' | 'image', value: string, mimeType?: string },
    modelContext: { type: 'prompt' | 'image', value: string, mimeType?: string },
    settings: { modelLock: number, bgLock: number },
    expertGuidance?: string,
    productDetails?: { name: string, features: string }
): Promise<string> => {
    return callWithRetry(async () => {
        const ai = getAiClient();
        
        const parts: any[] = [];
        
        // Add Product Image (Primary Reference)
        parts.push({ inlineData: { data: productBase64, mimeType: productMimeType } });

        // Add Contexts if they are images
        if (bgContext.type === 'image' && bgContext.mimeType) {
            parts.push({ inlineData: { data: bgContext.value, mimeType: bgContext.mimeType } });
        }
        if (modelContext.type === 'image' && modelContext.mimeType) {
            parts.push({ inlineData: { data: modelContext.value, mimeType: modelContext.mimeType } });
        }

        let contextPrompt = "";
        if (bgContext.type === 'prompt') {
            contextPrompt += `Background context: ${bgContext.value}. `;
        } else {
            contextPrompt += `Use the provided background image as context (lock strength ${settings.bgLock}%). `;
        }

        if (modelContext.type === 'prompt') {
            contextPrompt += `Model description: ${modelContext.value}. `;
        } else {
            contextPrompt += `Use the provided model image as reference (lock strength ${settings.modelLock}%). `;
        }

        let productPrompt = "";
        if (productDetails?.name) {
            productPrompt += `Product Name: ${productDetails.name}. `;
        }
        if (productDetails?.features) {
            productPrompt += `Key Features/Highlights: ${productDetails.features}. `;
        }

        let specificInstruction = "";
        // Check for specific functional keywords
        if (shotType.includes("Detail Circle") || shotType.includes("Magnified")) {
            specificInstruction = "Create a high-quality product shot. IMPORTANT: Overlay a magnified circular inset (loupe style) in one corner that zooms in on the material texture or a specific detail.";
        } else if (shotType.includes("Texture Macro")) {
            specificInstruction = "MACRO PHOTOGRAPHY. Extreme close-up on the material/fabric texture. Focus on weaving, stitching, grain, or surface details. High sharpness, tactile feel. Do not show the full object.";
        } else if (shotType.includes("Functional Detail")) {
            // Extract the specific detail requested from the string string "Functional Detail: [Detail]"
            const detailName = shotType.split(":")[1]?.trim() || "detail";
            specificInstruction = `MACRO/CLOSE-UP SHOT. Focus specifically on this functional element: "${detailName}". Shallow depth of field to isolate the ${detailName}. Ensure high clarity on the hardware/stitching. Do not show the full model.`;
        } else if (shotType.includes("Brand Tag")) {
            specificInstruction = "MACRO PHOTOGRAPHY. Extreme close-up shot of the Brand Tag, Label, or Internal Lining. Ensure the text/logo on the tag is sharp and legible. Shallow depth of field.";
        } else if (shotType.includes("Variation")) {
            specificInstruction = `Create a unique variation of the product lookbook shot. High fashion style. Change the angle slightly to add variety.`;
        } else {
            specificInstruction = `Generate a photorealistic fashion lookbook shot. Camera Angle/Type: ${shotType}. The model should be wearing/using the product naturally in the scene.`;
        }

        // Incorporate Expert Guidance if available (e.g., "Use Rim Light to sculpt folds")
        let guidancePrompt = "";
        if (expertGuidance) {
            guidancePrompt = `EXPERT PHOTOGRAPHY RULES: ${expertGuidance}`;
        }

        const negativePrompt = "Negative prompt: bad anatomy, distorted hands, missing fingers, extra limbs, blurry, low quality, watermark, text, distorted face, bad eyes, unnatural pose, mannequin, plastic skin.";

        const fullPrompt = `Professional Fashion Lookbook Photography. 8k resolution, highly detailed.
        Product: See first image. ${productPrompt}
        ${contextPrompt}
        Task: ${specificInstruction}
        ${guidancePrompt}
        Ensure high quality, correct lighting, and realistic textures.
        ${negativePrompt}`;

        parts.push({ text: fullPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        return handleImageResponse(response);
    });
};
