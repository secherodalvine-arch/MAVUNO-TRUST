/**
 * Transport Intelligence Advisor
 *
 * Provides bilingual (English & Kiswahili) contextual explanations of deterministic
 * transport estimates using Gemini, with deterministic fallback templates if AI is
 * unavailable or fails.
 *
 * CRITICAL SAFEGUARDS:
 * 1. Never alters or calculates arithmetic/prices. Prices are strictly deterministic.
 * 2. Never fabricates source records or guarantees quotes.
 * 3. Works 100% reliably even if Gemini API key is missing or offline.
 */

import { agentService } from '../mavunoagent/agentService.js';

/**
 * Deterministic explanation builder when Gemini is unavailable.
 */
export const buildDeterministicExplanation = (estimateData, originName, destName) => {
  const {
    distanceKm,
    vehicleCategory,
    tripArrangement,
    estimatedPriceMin,
    estimatedPriceMax,
    estimatedPriceMedian,
    confidenceLevel,
    sampleSize,
    warnings,
  } = estimateData;

  const vehicleLabel = {
    PICKUP: 'Pick-up / Hilux (approx. 1–1.5 tonnes)',
    SMALL_TRUCK: 'Small truck / Canter (approx. 3–5 tonnes)',
    MEDIUM_LORRY: 'Medium lorry (approx. 7–10 tonnes)',
    LARGE_LORRY: 'Large lorry / Semi-trailer (15+ tonnes)',
    OTHER: 'General transport vehicle',
  }[vehicleCategory] || vehicleCategory;

  const routeLabel = originName && destName ? `${originName} to ${destName}` : `a ${distanceKm} km transit journey`;

  const englishSummary = `For ${routeLabel} (${distanceKm} km) using a ${vehicleLabel} on an ${tripArrangement.toLowerCase()} basis, the estimated benchmark charge is approximately KSh ${estimatedPriceMedian.toLocaleString()} (typical range: KSh ${estimatedPriceMin.toLocaleString()} – KSh ${estimatedPriceMax.toLocaleString()}). This estimate is based on ${sampleSize} historical observation(s) with ${confidenceLevel.toLowerCase()} evidence confidence.`;

  const swahiliSummary = `Kwa safari ya ${routeLabel} (umbali wa km ${distanceKm}) kwa kutumia gari la ${vehicleLabel} (${tripArrangement === 'EXCLUSIVE' ? 'kukodi peke yako' : 'mzigo wa pamoja'}), makadirio ya kawaida ni takriban KSh ${estimatedPriceMedian.toLocaleString()} (kati ya KSh ${estimatedPriceMin.toLocaleString()} hadi KSh ${estimatedPriceMax.toLocaleString()}). Makadirio haya yanatokana na kumbukumbu ${sampleSize} zilizopo kwa kiwango cha uhakika cha "${confidenceLevel}".`;

  return {
    englishSummary,
    swahiliSummary,
    keyAdvice: [
      'This estimate serves as an empirical benchmark, not a binding quote.',
      'Actual prices depend on road conditions, weather, return-cargo availability, and fuel rates.',
      'Always request and compare quotes from at least two local transporters before loading.',
    ],
    warnings: warnings || [],
  };
};

/**
 * Enriches a deterministic transport estimate with AI-assisted bilingual guidance.
 *
 * @param {Object} estimateData - Result from estimateTransportCost
 * @param {string} [originName]
 * @param {string} [destName]
 * @returns {Promise<Object>}
 */
export const getTransportExplanation = async (estimateData, originName, destName) => {
  // Baseline deterministic explanation
  const fallback = buildDeterministicExplanation(estimateData, originName, destName);

  // Attempt Gemini enhancement if credentials are initialized
  const init = agentService.initialize();
  if (!init.success) {
    return {
      success: true,
      source: 'deterministic_engine',
      explanation: fallback,
    };
  }

  const prompt = `
You are the MavunoTrust Transport Logistics Advisor.
Explain the following deterministic transport estimate to a Kenyan farmer or dealer.

DETERMINISTIC DATA (DO NOT CHANGE NUMBERS OR FABRICATE NEW ONES):
- Route: ${originName || 'Origin'} to ${destName || 'Destination'}
- Distance: ${estimateData.distanceKm} km
- Vehicle Class: ${estimateData.vehicleCategory}
- Trip Arrangement: ${estimateData.tripArrangement}
- Estimated Median: KSh ${estimateData.estimatedPriceMedian}
- Estimated Range: KSh ${estimateData.estimatedPriceMin} to KSh ${estimateData.estimatedPriceMax}
- Confidence: ${estimateData.confidenceLevel}
- Sample Size: ${estimateData.sampleSize} records
- Warnings: ${JSON.stringify(estimateData.warnings)}

INSTRUCTIONS:
1. Provide a clear, practical summary in plain English and in natural Kenyan Kiswahili.
2. Emphasize that community data helps transparency but does not guarantee the final transporter price.
3. Return STRICTLY valid JSON with format:
{
  "englishSummary": "...",
  "swahiliSummary": "...",
  "keyAdvice": ["advice 1", "advice 2"],
  "warnings": ["warning 1"]
}
`;

  try {
    const aiRes = await agentService.generateAgentDecision(prompt);
    if (!aiRes.success || !aiRes.decisionText) {
      return { success: true, source: 'deterministic_engine', explanation: fallback };
    }

    let text = aiRes.decisionText.trim();
    if (text.startsWith('\`\`\`json')) text = text.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
    else if (text.startsWith('\`\`\`')) text = text.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');

    const parsed = JSON.parse(text);
    if (parsed.englishSummary && parsed.swahiliSummary) {
      return {
        success: true,
        source: 'gemini_intelligence_agent',
        explanation: {
          englishSummary: parsed.englishSummary,
          swahiliSummary: parsed.swahiliSummary,
          keyAdvice: Array.isArray(parsed.keyAdvice) ? parsed.keyAdvice : fallback.keyAdvice,
          warnings: Array.isArray(parsed.warnings) ? parsed.warnings : fallback.warnings,
        },
      };
    }
  } catch (err) {
    console.warn('[TransportAdvisor] Gemini explanation failed, falling back to deterministic explanation:', err.message);
  }

  return {
    success: true,
    source: 'deterministic_engine',
    explanation: fallback,
  };
};
