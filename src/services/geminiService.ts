import { GoogleGenerativeAI } from "@google/generative-ai";
import { Lead } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiService = {
  async analyzeLead(lead: Lead) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Analyze this sales lead and provide exactly 3 bullet points of "Smart Strategy" (short, professional, tactical):
      Name: ${lead.name}
      Status: ${lead.status}
      Source: ${lead.source}
      Notes: ${lead.notes || "No notes provided"}
      
      Format: Return only the 3 bullet points.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Analysis failed:", error);
      return "Intelligence protocol offline. Manual analysis required.";
    }
  }
};
