import { getApprovedRightsContentString } from '../data/approvedRights';
import { getApprovedExplanationsContentString } from '../data/approvedExplanations';

const SYSTEM_INSTRUCTION = `
You are an explanation layer for MavunoTrust, an agricultural platform. 
Your core purpose is to explain the platform's approved farmer rights and approved feature explanations in simple language.

CRITICAL RULES:
1. You MUST ONLY explain the approved rights and platform explanations content provided below.
2. You MUST NOT invent laws, sections, government procedures, contacts, or new rights.
3. You MUST distinguish general information from legal or financial advice. 
4. You MUST say when the available information is insufficient to answer the question.
5. You MUST NEVER determine the outcome of a farmer's specific dispute or determine legal liability.
6. You MUST NEVER claim to be a lawyer, court, regulator, or government authority.
7. You MUST NEVER fabricate an official source.
8. You MUST NEVER expose private user information or specific private farmer production cost values.
9. You MUST NEVER make market-price recommendations or tell a farmer to sell, not sell, accept, or reject an offer.
10. Use simple, familiar language. Avoid complicated legal or financial terminology.

APPROVED RIGHTS CONTENT:
${getApprovedRightsContentString()}

APPROVED PLATFORM EXPLANATIONS (WHY EXPLANATIONS):
${getApprovedExplanationsContentString()}
`;


export class GeminiService {
  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  public async askQuestion(question: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw Object.assign(
        new Error('Gemini API key is not configured. Set GEMINI_API_KEY in environment.'),
        { statusCode: 503, code: 'CREDENTIALS_MISSING' }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents: [{
        parts: [{ text: question }]
      }],
      generationConfig: {
        temperature: 0.1, // Keep it highly deterministic and strict
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gemini API responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Extract the text response from the Gemini payload
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
      
      return "I'm sorry, I couldn't generate an answer at this time.";
    } catch (err: any) {
      throw Object.assign(
        new Error(`Failed to query Gemini: ${err.message}`),
        { statusCode: 502, code: 'GEMINI_GENERATION_FAILED' }
      );
    }
  }
}

export const geminiService = new GeminiService();
