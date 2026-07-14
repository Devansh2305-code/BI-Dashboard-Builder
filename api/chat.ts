import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

function sanitizeApiKey(value?: string) {
  if (!value) return "";
  return value.replace(/[\r\n\t]/g, "").trim().replace(/^["']|["']$/g, "");
}

function resolveApiKey(req: VercelRequest) {
  const envKey = sanitizeApiKey(process.env.GEMINI_API_KEY);

  const headerRaw = req.headers?.["x-gemini-api-key"];
  const headerKey = sanitizeApiKey(
    Array.isArray(headerRaw) ? headerRaw[0] : (headerRaw as string | undefined)
  );

  const bodyKey = sanitizeApiKey(req.body?.userApiKey as string | undefined);

  // Default: server env key. Optional override: header/body key if provided.
  const effectiveKey = headerKey || bodyKey || envKey;

  return {
    effectiveKey,
    hasEnvKey: !!envKey,
    usingUserOverride: !!(headerKey || bodyKey),
  };
}

function getGenAIClient(req: VercelRequest): GoogleGenAI {
  const { effectiveKey } = resolveApiKey(req);

  if (!effectiveKey) {
    throw new Error(
      "GEMINI_API_KEY is not defined. Please configure GEMINI_API_KEY in Vercel Environment Variables, or supply a custom key."
    );
  }

  return new GoogleGenAI({
    apiKey: effectiveKey,
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
    const { messages, data, role, measures, columns } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No conversation history provided." });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGenAIClient(req);
    } catch (e: any) {
      return res.status(503).json({
        error:
          e?.message ||
          "AI Chat is currently unavailable (Gemini API key is not configured). Please check Environment Variables.",
      });
    }

    const sampleSize = Math.min(Array.isArray(data) ? data.length : 0, 85);
    const dataSample = Array.isArray(data) ? data.slice(0, sampleSize) : [];

    const systemInstruction = `
      You are "Gemini Business Intelligence Partner", an expert data scientist, financial advisor, and business growth consultant.
      You are assisting a professional holding the role: ${role || "General Analyst"}.

      Here is detailed context of the active business report:
      - Total records in active dataset: ${Array.isArray(data) ? data.length : 0}
      - Columns available: ${JSON.stringify(columns || [])}
      - Formulas / Measures defined: ${JSON.stringify(measures || [])}
      - High-fidelity sample dataset (${sampleSize} rows):
      ${JSON.stringify(dataSample, null, 2)}

      Please address the user's specific query. Use professional, analytical, yet simple, clear, and business-focused communication.
      Formulate calculations, highlight exceptions or trends, and propose strategic actions where appropriate.
      Use Markdown formatting (bold keywords, neat bullet points, small markdown tables) to organize information beautifully.
      Keep answers concise, direct, and fully grounded in the actual dataset context. Avoid saying things like "Based on the sample..." unless requested.
    `;

    const contents = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content ?? "" }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.15,
      },
    });

    return res.status(200).json({ text: response.text || "No response received from Gemini." });
  } catch (error: any) {
    console.error("Chat route error:", error);

    let message = error?.message || "An error occurred during AI chat.";
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
