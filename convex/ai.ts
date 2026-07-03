"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Fallback short-text specifications if no PDF is provided in Convex Storage.
const DONOR_SPECS = {
  "USAID": "Focus heavily on measurable outcomes, cost-effectiveness, and direct alignment with US foreign policy objectives. Require strict adherence to monitoring and evaluation (M&E) frameworks. Use professional, objective, and empirical language.",
  "EU": "Require Logical Framework Matrix (LogFrame) approach. Emphasize sustainability, cross-cutting themes (like gender and environment), and long-term systemic impact. Formatting must be highly structured and academic.",
  "UN": "Focus on Sustainable Development Goals (SDGs). Use diplomatic, inclusive language. Highlight partnerships, human rights, and vulnerability assessments. Heavy emphasis on metrics and demographic reach.",
  "Private Foundation": "Focus on storytelling, human impact, and innovation. Less bureaucratic language, more narrative-driven. Emphasize scalability, unique approaches, and direct community testimonies."
};

export const generateReport = action({
  args: {
    donorType: v.string(),
    fieldNotesText: v.string(),
    audioBase64: v.optional(v.string()),
    audioMimeType: v.optional(v.string()),
    language: v.string(),
    style: v.string(),
  },
  handler: async (ctx, args) => {
    const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
    const spec = DONOR_SPECS[args.donorType as keyof typeof DONOR_SPECS] || DONOR_SPECS["USAID"];

    const prompt = `
You are an expert NGO Grant Reporting AI.
You must strictly adhere to the following donor specification for ${args.donorType}:
"${spec}"

Your task is to synthesize the user's field data into a polished report.
Language: ${args.language}
Style: ${args.style}

IMPORTANT CONSTRAINTS:
1. ACCURACY IS PARAMOUNT. Do not make up any facts, names, numbers, or events that are not explicitly stated in the provided text or audio.
2. If the field notes (both text and audio) are unclear, empty, or appear to be a garbled voice transcription, you MUST refuse to generate the report. Instead, reply EXACTLY with a warning telling the user that the input is unclear, and instruct them to type the input manually. Remind them they can use their device's built-in keyboard voice typing (e.g., tapping the microphone icon on their iOS/Android keyboard) to ensure clearer dictation before submitting.
3. If the input is clear, generate a highly professional, well-structured markdown report ready for submission.

User's Text Field Notes:
"""
${args.fieldNotesText || "(No text provided)"}
"""
`;

    try {
      if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey });
        
        const contents: any[] = [{ text: prompt }];

        const envVarName = `${args.donorType.toUpperCase().replace(/\s+/g, '_')}_SPEC_ID`;
        const storageId = process.env[envVarName];
        
        if (storageId) {
          const blob = await ctx.storage.get(storageId as any);
          if (blob) {
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            contents.push({
              inlineData: {
                data: base64,
                mimeType: blob.type || "application/pdf"
              }
            });
          }
        }

        if (args.audioBase64 && args.audioMimeType) {
          contents.push({
            inlineData: {
              data: args.audioBase64,
              mimeType: args.audioMimeType,
            },
          });
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: contents,
        });
        return response.text;
      }
      
      if (provider === "openai" || provider === "deepseek") {
        const isDeepSeek = provider === "deepseek";
        const apiKey = isDeepSeek ? process.env.DEEPSEEK_API_KEY : process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error(`${isDeepSeek ? 'DEEPSEEK_API_KEY' : 'OPENAI_API_KEY'} is not configured.`);
        
        const openai = new OpenAI({
          apiKey,
          baseURL: isDeepSeek ? "https://api.deepseek.com/v1" : undefined
        });

        const response = await openai.chat.completions.create({
          model: isDeepSeek ? "deepseek-chat" : "gpt-4o",
          messages: [{ role: "user", content: prompt }]
        });

        return response.choices[0].message.content || "";
      }

      if (provider === "claude") {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
        
        const anthropic = new Anthropic({ apiKey });
        
        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }]
        });

        if (response.content[0].type === 'text') {
            return response.content[0].text;
        }
        return "";
      }

      throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
    } catch (e: any) {
      console.error("AI Generation Error:", e);
      throw new Error("AI Generation failed: " + e.message);
    }
  },
});
