import dotenv from 'dotenv';

dotenv.config();

export class AgentService {
  constructor() {
    this.isInitialized = false;
    this.apiKey = null;
    this.model = 'gemini-3.5-flash';
    this.baseUrl = 'https://kamis.kilimo.go.ke';
    this.lastError = null;
  }

  initialize() {
    const key = process.env.MAVUNOAGENT_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const model = process.env.MAVUNOAGENT_MODEL || 'gemini-3.5-flash';
    const baseUrl = process.env.KAMIS_BASE_URL || 'https://kamis.kilimo.go.ke';

    this.model = model;
    this.baseUrl = baseUrl;

    if (!key || key.trim() === '' || key === 'replace_with_real_key') {
      this.apiKey = null;
      this.isInitialized = false;
      this.lastError = 'MAVUNOAGENT_API_KEY_MISSING';
      return {
        success: false,
        code: 'MAVUNOAGENT_API_KEY_MISSING',
        message: 'MAVUNOAGENT_GEMINI_API_KEY is missing in backend/.env',
      };
    }

    this.apiKey = key.trim();
    this.isInitialized = true;
    this.lastError = null;

    return {
      success: true,
      model: this.model,
      baseUrl: this.baseUrl,
    };
  }

  getModel() {
    return this.model;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  getStatus() {
    const init = this.initialize();
    return {
      initialized: init.success,
      model: this.model,
      baseUrl: this.baseUrl,
      lastError: this.lastError,
    };
  }

  /**
   * Generates agent decisions using Gemini 3.5 Flash API with exponential backoff retries for transient errors (HTTP 503, 429, 5xx).
   */
  async generateAgentDecision(prompt, availableTools = [], maxRetries = 2) {
    const status = this.getStatus();
    if (!status.initialized) {
      return {
        success: false,
        error: {
          code: 'MAVUNOAGENT_CREDENTIALS_MISSING',
          message: 'Cannot execute MavunoAgent without MAVUNOAGENT_GEMINI_API_KEY in .env',
          isTransient: false,
        },
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const systemInstruction = `You are MavunoAgent, the specialized agricultural market data extraction agent for MavunoTrust.
Your role is to skim through the KAMIS platform (https://kamis.kilimo.go.ke), navigate product sections, extract market prices for all available agricultural commodities, and structure them for database ingestion.
Never fabricate prices or modify prices. Preserve units, wholesale vs retail prices, market locations, and observation dates truthfully.`;

    const requestBody = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nTask: ${prompt}` }],
        },
      ],
      tools: availableTools.length > 0 ? availableTools : undefined,
    });

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        });

        if (response.ok) {
          const data = await response.json();
          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          this.lastError = null;
          return {
            success: true,
            decisionText: textResponse,
            rawResponse: data,
          };
        }

        const statusCode = response.status;
        this.lastError = `HTTP_${statusCode}`;

        const isTransient = [429, 500, 502, 503, 504].includes(statusCode);

        if (isTransient && attempt <= maxRetries) {
          const delayMs = attempt * 800;
          console.warn(`[MavunoAgent] Gemini API HTTP ${statusCode} (attempt ${attempt}/${maxRetries + 1}). Retrying in ${delayMs}ms...`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        const reasonStr = statusCode === 503 ? 'Gemini service experiencing high demand (HTTP 503)'
                        : statusCode === 429 ? 'Gemini rate limit / quota exceeded (HTTP 429)'
                        : `HTTP ${statusCode}`;

        return {
          success: false,
          error: {
            code: `MAVUNOAGENT_API_HTTP_${statusCode}`,
            message: `Gemini API notice: ${reasonStr}`,
            statusCode,
            isTransient,
          },
        };
      } catch (err) {
        this.lastError = err.message;
        if (attempt <= maxRetries) {
          const delayMs = attempt * 800;
          console.warn(`[MavunoAgent] Network connection issue (attempt ${attempt}/${maxRetries + 1}): ${err.message}. Retrying in ${delayMs}ms...`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        return {
          success: false,
          error: {
            code: 'MAVUNOAGENT_EXECUTION_FAILED',
            message: `Network error connecting to Gemini API: ${err.message}`,
            isTransient: true,
          },
        };
      }
    }
  }
}

export const agentService = new AgentService();
