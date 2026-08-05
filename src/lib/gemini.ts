import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY must be set in environment variables.");
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

export async function draftNarrativeDisclosure(data: any, targetFramework: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          narrative: { type: SchemaType.STRING },
          citations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                dataPointId: { type: SchemaType.NUMBER },
                textSegment: { type: SchemaType.STRING },
              }
            }
          }
        }
      }
    }
  });

  const prompt = `
    Draft a professional narrative disclosure for ${targetFramework} based on the following ESG data.
    The narrative should be structured, citing specific data points inline.
    Only use quantitative values found in the provided data. If a value is missing, state that it is missing rather than estimating it.
    
    Data:
    ${JSON.stringify(data, null, 2)}
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

export async function performGapAnalysis(currentData: any, frameworkRequirements: any) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            requirementCode: { type: SchemaType.STRING },
            status: { type: SchemaType.STRING },
            gapDescription: { type: SchemaType.STRING },
            suggestedAction: { type: SchemaType.STRING },
          }
        }
      }
    }
  });

  const prompt = `
    Compare the current data against these ESG framework requirements. Identify gaps where data is missing or incomplete.
    Do not invent data availability, assurance status, or quantitative values.
    
    Current Data:
    ${JSON.stringify(currentData, null, 2)}
    
    Framework Requirements:
    ${JSON.stringify(frameworkRequirements, null, 2)}
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
