import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

const app = express();
const PORT = 3000;

// Helper to lazily load and initialize the Gemini API client
function getGenAIClient(): GoogleGenAI {
  // Load environment variables dynamically only if the key is not already defined
  if (!process.env.GEMINI_API_KEY) {
    try {
      dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
      dotenv.config({ path: path.resolve(process.cwd(), ".env") });
    } catch (e) {
      console.warn("Failed to load dotenv files:", e);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please make sure you have added your GEMINI_API_KEY inside the Secrets panel.");
  }

  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

app.use(express.json({ limit: "10mb" }));

// API Endpoint for AI-driven BI Insights
app.post("/api/analyze", async (req, res) => {
  try {
    const { data, role, measures, columns } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "No data provided for analysis." });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGenAIClient();
    } catch (e: any) {
      return res.status(503).json({
        error: e.message || "AI analysis is currently unavailable (Gemini API key is not configured). Please check your Secrets in Settings.",
      });
    }

    // Prepare a sample of data (max 80 rows) to send to Gemini to avoid token bloat while giving rich context
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
      
      Please perform deep analytical inspection. Identify trends, anomalies, performance metrics, and actionable ideas.
      Provide a highly professional and structured JSON response that complies EXACTLY with this JSON Schema:
      
      {
        "insights": [
          {
            "title": "Short descriptive title of the insight",
            "description": "Deep analytical description containing numeric details, percentages, and trends. Focus on what this means for a ${role}.",
            "impact": "high" | "medium" | "low",
            "metricAffected": "The KPI or column this insight touches (e.g. ROAS, Revenue, Churn)"
          }
        ],
        "suggestedKPIs": [
          {
            "name": "Suggested KPI Name",
            "formula": "Human readable math formula based on existing columns (e.g. (Revenue - Cost) / Revenue)",
            "description": "Why this KPI is essential for ${role} and what business action it drives."
          }
        ],
        "recommendedCharts": [
          {
            "title": "Chart Title",
            "chartType": "bar" | "line" | "area" | "pie",
            "xAxis": "The field name to use on X axis (must be one of the dataset columns)",
            "yAxis": "The field name to use on Y axis (must be one of the dataset columns or measures)",
            "reason": "Why this visualization is effective for the ${role}."
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
                required: ["title", "description", "impact", "metricAffected"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  metricAffected: { type: Type.STRING }
                }
              }
            },
            suggestedKPIs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "formula", "description"],
                properties: {
                  name: { type: Type.STRING },
                  formula: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
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
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Analysis route error:", error);
    res.status(500).json({ error: error.message || "An error occurred during data analysis." });
  }
});

// API Endpoint for Interactive AI grounding and Chat over dataset
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, data, role, measures, columns } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No conversation history provided." });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGenAIClient();
    } catch (e: any) {
      return res.status(503).json({
        error: e.message || "AI Chat is currently unavailable (Gemini API key is not configured). Please check your Secrets in Settings.",
      });
    }

    // Prepare sample size to fit comfortably in token context while maintaining richness
    const sampleSize = Math.min(data?.length || 0, 85);
    const dataSample = data ? data.slice(0, sampleSize) : [];

    const systemInstruction = `
      You are "Gemini Business Intelligence Partner", an expert data scientist, financial advisor, and business growth consultant.
      You are assisting a professional holding the role: ${role || "General Analyst"}.

      Here is detailed context of the active business report:
      - Total records in active dataset: ${data?.length || 0}
      - Columns available: ${JSON.stringify(columns || [])}
      - Formulas / Measures defined: ${JSON.stringify(measures || [])}
      - High-fidelity sample dataset (${sampleSize} rows):
      ${JSON.stringify(dataSample, null, 2)}

      Please address the user's specific query. Use professional, analytical, yet simple, clear, and business-focused communication.
      Formulate calculations, highlight exceptions or trends, and propose strategic actions where appropriate.
      Use Markdown formatting (bold keywords, neat bullet points, small markdown tables) to organize information beautifully.
      Keep answers concise, direct, and fully grounded in the actual dataset context. Avoid saying things like "Based on the sample of 85 rows..." or referring to sample limitations unless requested.
    `;

    // Map conversation array to Gemini SDK's structure
    const contents = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.15,
      }
    });

    res.json({ text: response.text || "No response received from Gemini." });
  } catch (error: any) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: error.message || "An error occurred during AI chat." });
  }
});

// Vite middleware integration
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupVite().catch((err) => {
    console.error("Failed to boot server:", err);
  });
}

export default app;
