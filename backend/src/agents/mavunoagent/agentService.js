import dotenv from 'dotenv';

dotenv.config();

export class AgentService {
  constructor() {
    this.isInitialized = false;
    this.apiKey = null;
    this.model = 'gemini-2.5-flash';
    this.baseUrl = 'https://kamis.kilimo.go.ke';
    this.lastError = null;
  }

  initialize() {
    const key = process.env.MAVUNOAGENT_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const model = (process.env.MAVUNOAGENT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
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
   * Generates agent decisions using Gemini API with exponential backoff retries for transient errors (HTTP 503, 429, 5xx).
   */
  async generateAgentDecision(prompt, availableTools = [], maxRetries = 2, options = {}) {
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

    const systemInstruction = options.systemInstruction || `You are MavunoAgent, the specialized agricultural market data extraction agent for MavunoTrust.
Your role is to skim through the KAMIS platform (https://kamis.kilimo.go.ke), navigate product sections, extract market prices for all available agricultural commodities, and structure them for database ingestion.
Never fabricate prices or modify prices. Preserve units, wholesale vs retail prices, market locations, and observation dates truthfully.`;
    const timeoutMs = options.timeoutMs || 45000;

    const candidateModels = Array.from(new Set([
      this.model,
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
    ].filter(Boolean)));

    const requestBody = JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      tools: availableTools.length > 0 ? availableTools : undefined,
      generationConfig: {
        temperature: 0.2,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    let lastCandidateError = null;

    for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
      const activeModel = candidateModels[modelIdx];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;

      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
            signal: AbortSignal.timeout(timeoutMs),
          });

          if (response.ok) {
            const data = await response.json();

            // Detect safety-blocked, empty, or recitation-blocked responses.
            const candidate = data.candidates?.[0];
            const finishReason = candidate?.finishReason;
            const BLOCKED_REASONS = ['SAFETY', 'RECITATION', 'OTHER'];

            if (!candidate || BLOCKED_REASONS.includes(finishReason)) {
              const reason = finishReason || 'NO_CANDIDATE';
              console.warn(`[MavunoAgent] Gemini response blocked or empty (finishReason=${reason}, model=${activeModel}).`);
              return {
                success: false,
                error: {
                  code: 'MAVUNOAGENT_BLOCKED',
                  message: `Gemini response was blocked or empty (finishReason: ${reason}). Try rephrasing the request.`,
                  finishReason: reason,
                  isTransient: false,
                },
              };
            }

            const textResponse = (candidate.content?.parts || [])
              .filter((p) => typeof p.text === 'string' && !p.thought)
              .map((p) => p.text)
              .join('');

            if (!textResponse) {
              const isStop = finishReason === 'STOP';
              console.warn(
                `[MavunoAgent] Gemini candidate has no usable text (model=${activeModel}, finishReason=${finishReason}).` +
                (isStop ? ' This may indicate a thinking-only response; thinkingBudget:0 should prevent this.' : '')
              );
              return {
                success: false,
                error: {
                  code: 'MAVUNOAGENT_EMPTY_OUTPUT',
                  message: `Gemini returned no usable text output (finishReason: ${finishReason || 'UNKNOWN'}). Please try again.`,
                  finishReason: finishReason || 'UNKNOWN',
                  isTransient: true,
                },
              };
            }

            this.lastError = null;
            return {
              success: true,
              decisionText: textResponse,
              rawResponse: data,
              usedModel: activeModel,
            };
          }

          const statusCode = response.status;
          this.lastError = `HTTP_${statusCode}`;

          let geminiErrorBody = null;
          try {
            geminiErrorBody = await response.json();
          } catch { /* ignore parse errors on error responses */ }
          const geminiErrorMessage = geminiErrorBody?.error?.message || '';
          console.error(
            `[MavunoAgent] Gemini API HTTP ${statusCode} for model ${activeModel}` +
            (geminiErrorMessage ? `: ${geminiErrorMessage}` : '') +
            ` (attempt ${attempt}/${maxRetries + 1})`
          );

          // If quota exhausted (429) or model deprecated (404), break immediately to next candidate model
          if ((statusCode === 429 || statusCode === 404) && modelIdx < candidateModels.length - 1) {
            console.warn(`[MavunoAgent] Model ${activeModel} unavailable (HTTP ${statusCode}). Trying fallback model ${candidateModels[modelIdx + 1]}...`);
            break;
          }

          const isTransient = [429, 500, 502, 503, 504].includes(statusCode);

          if (isTransient && attempt <= maxRetries) {
            const delayMs = attempt * 800;
            console.warn(`[MavunoAgent] Retrying model ${activeModel} in ${delayMs}ms...`);
            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          }

          // If 503 on this model after retries, try next candidate model
          if (statusCode === 503 && modelIdx < candidateModels.length - 1) {
            console.warn(`[MavunoAgent] Model ${activeModel} experiencing high demand (HTTP 503). Trying fallback model ${candidateModels[modelIdx + 1]}...`);
            break;
          }

          const reasonStr = statusCode === 503 ? 'Gemini service experiencing high demand (HTTP 503)'
                          : statusCode === 429 ? 'Gemini rate limit / quota exceeded (HTTP 429)'
                          : statusCode === 400 ? 'Gemini rejected the request (HTTP 400). This may be a model configuration issue.'
                          : `HTTP ${statusCode}`;

          lastCandidateError = {
            code: `MAVUNOAGENT_API_HTTP_${statusCode}`,
            message: `Gemini API notice: ${reasonStr}`,
            statusCode,
            isTransient,
          };
        } catch (err) {
          this.lastError = err.message;
          if (attempt <= maxRetries) {
            const delayMs = attempt * 800;
            console.warn(`[MavunoAgent] Network connection issue on ${activeModel} (attempt ${attempt}/${maxRetries + 1}): ${err.message}. Retrying in ${delayMs}ms...`);
            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          }
          lastCandidateError = {
            code: 'MAVUNOAGENT_EXECUTION_FAILED',
            message: `Network error connecting to Gemini API: ${err.message}`,
            isTransient: true,
          };
        }
      }
    }

    return {
      success: false,
      error: lastCandidateError || {
        code: 'MAVUNOAGENT_UNAVAILABLE',
        message: 'All Gemini model candidates are temporarily unavailable.',
        isTransient: true,
      },
    };
  }
}

export const agentService = new AgentService();
