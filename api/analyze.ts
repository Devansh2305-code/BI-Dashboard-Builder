import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

function sanitizeApiKey(value?: string) {
  if (!value) return "";
  return value.replace(/[\r\n\t]/g, "").trim().replace(/^["']|["']$/g, "");
}

function getGenAIClient(req?: VercelRequest): GoogleGenAI {
  const headerKeyRaw = req?.headers?.["x-gemini-api-key"];
  const headerKey = Array.isArray(headerKeyRaw) ? headerKeyRaw[0] : (headerKeyRaw as string | undefined);
  const bodyKey = req?.body?.userApiKey as string | undefined;
  const envKey = process.env.GEMINI_API_KEY;

  const apiKey = sanitizeApiKey(headerKey || bodyKey || envKey);

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not defined. Please configure GEMINI_API_KEY in Vercel Environment Variables, or supply your custom key in the dashboard settings."
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { data, role, measures, columns } = req.body || {};

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "No data provided for analysis." });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGenAIClient(req);
    } catch (e: any) {
      return res.status(503).json({
        error:
          e?.message ||
          "AI analysis is currently unavailable (Gemini API key is not configured). Please check your Environment Variables.",
      });
    }

    const sampleSize = Math.min(data.length, 80);
    const dataSample = data.slice(0, sampleSize);

    const prompt = `
      You are a world-class Business Intelligence & Analytics consultant.
      You are analyzing a raw dataset to provide tailored insights for the following role: ${role || "General Business User"}.
      
      Here is metadata about the dataset:
      - Columns available: ${JSON.stringify(columns || Object.keys(data[0] || {}))}
      - Total records in dataset: ${data.length}
      - Current measures configured by user: ${JSON.stringify(measures || [])}
      
      Here is a sample of ${sampleSize} rows from the dataset:
      ${JSON.stringify(dataSample, null, 2)}
      
      Please perform deep analytical inspection. Specially focus on identifying:
      1. Any decreases, drops, underperformance, downward trends, or negative anomalies.
      2. If a decrease or negative trend/underperformance is found, set "decreaseDetected" to true, explain EXACTLY why it is happening (rootCause analysis), and suggest precise actionable solutions (how can it be resolved).
      3. Even if a major decrease is not explicitly found, analyze performance bottlenecks, cost challenges, operational risks, or growth barriers, and provide a clear "rootCause" (explaining the drivers) and "resolution" (actionable strategy) for every single insight.
      
      Provide a highly professional and structured JSON response that complies EXACTLY with this JSON Schema:
      
      {
        "insights": [
          {
            "title": "Short descriptive title of the insight",
            "description": "Deep analytical description containing numeric details, percentages, and trends. Focus on what this means for a ${role || "General Business User"}.",
            "impact": "high" | "medium" | "low",
            "metricAffected": "The KPI or column this insight touches (e.g. ROAS, Revenue, Churn)",
            "decreaseDetected": true,
            "rootCause": "Deep business context explaining: Why is this value declining or behaving this way? Identify internal or external triggers, drivers, or correlations in the data.",
            "resolution": "Actionable, precise business recommendations explaining: How can this decline/challenge be resolved? Provide practical tactics, operational improvements, or strategies."
          }
        ],
        "suggestedKPIs": [
          {
            "name": "Suggested KPI Name",
            "formula": "Human readable math formula based on existing columns (e.g. (Revenue - Cost) / Revenue)",
            "description": "Why this KPI is essential for ${role || "General Business User"} and what business action it drives."
          }
        ],
        "recommendedCharts": [
          {
            "title": "Chart Title",
            "chartType": "bar" | "line" | "area" | "pie",
            "xAxis": "The field name to use on X axis (must be one of the dataset columns)",
            "yAxis": "The field name to use on Y axis (must be one of the dataset columns or measures)",
            "reason": "Why this visualization is effective for the ${role || "General Business User"}."
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["insights", "suggestedKPIs", "recommendedCharts"],
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "impact", "metricAffected", "decreaseDetected", "rootCause", "resolution"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  metricAffected: { type: Type.STRING },
                  decreaseDetected: { type: Type.BOOLEAN },
                  rootCause: { type: Type.STRING },
                  resolution: { type: Type.STRING },
                },
              },
            },
            suggestedKPIs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "formula", "description"],
                properties: {
                  name: { type: Type.STRING },
                  formula: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
              },
            },
            recommendedCharts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "chartType", "xAxis", "yAxis", "reason"],
                properties: {
                  title: { type: Type.STRING },
                  chartType: { type: Type.STRING, enum: ["bar", "line", "area", "pie"] },
                  xAxis: { type: Type.STRING },
                  yAxis: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const resultText = response.text || "{}";
    const parsedResult = JSON.parse(resultText.trim());

    return res.status(200).json(parsedResult);
  } catch (error: any) {
    console.error("Analysis route error:", error);

    let message = error?.message || "An error occurred during data analysis.";
    try {
      if (typeof message === "string" && message.includes("API key not valid")) {
        message = "API key not valid. Please pass a valid Gemini API key.";
      } else if (typeof message === "string" && message.startsWith("{")) {
        const parsed = JSON.parse(message);
        if (parsed?.error?.message) {
          message = parsed.error.message;
        }
      }
    } catch {
      // ignore parsing fallback
    }

    return res.status(500).json({ error: message });
  }
}
