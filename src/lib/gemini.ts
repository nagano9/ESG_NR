import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
    
    Current Data:
    ${JSON.stringify(currentData, null, 2)}
    
    Framework Requirements:
    ${JSON.stringify(frameworkRequirements, null, 2)}
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
