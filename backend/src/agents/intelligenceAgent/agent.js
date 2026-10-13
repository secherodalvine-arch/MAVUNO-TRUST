import { agentService } from '../mavunoagent/agentService.js';
import { getMarketPrices, getNationalBenchmarks, getFaoPriceHistory } from '../../mcp/tools/marketTools.js';
import { findBuyers } from '../../mcp/tools/dealerTools.js';
import { normalizeMarketPrice } from '../../utils/unitNormalizer.js';

const SYSTEM_PROMPT = `
You are the Mavuno Intelligence Agent, an agricultural market advisor.
Your role is to analyze the provided evidence across multiple data layers and recommend a selling strategy to a farmer.

IMPORTANT RULES:
1. You are an advisor, NOT the final decision-maker.
2. NEVER invent prices, buyers, demand, or transport costs. Use ONLY the provided evidence.
3. BUYER CAPACITY VS DEMAND: "purchasingCapacityKg" represents general capacity. It does NOT mean the dealer currently wants that exact quantity. Say "dealer handles maize and has a capacity of X" rather than "dealer wants your maize."
4. Explicitly state limitations (e.g., if active demand is unverified, or if logistics costs are missing).
5. Compare current local market prices (KAMIS) against national benchmarks (WRSC) and historical trends (WFP/HDX).
6. UNDERSTAND SOURCE SEMANTICS:
   - KAMIS = current/local observed market information.
   - WRSC = weekly national benchmark, not necessarily the exact local transaction price.
   - WFP/HDX = historical monthly context, not a current live price and not a guaranteed future price prediction.
7. If evidence is insufficient or conflicts strongly, set confidence to "Low" and state limitations clearly. Do NOT average disparate sources or treat different units as identical.
8. Use "normalizedPricePerKg" ONLY when normalization succeeded ("normalizationStatus": "SUCCESS"). Do not compare incompatible units or currencies.
9. Clearly communicate missing, stale, ambiguous, or non-comparable evidence (where normalizationStatus is "FAILED"). Do not invent prices or conversions.
10. The "nextAction" must be a clear, practical, decision-oriented step for the farmer (e.g., "Contact the verified dealer to negotiate", "Compare at least two buyers", "Monitor the market").

You MUST return your response as a valid JSON object with the following structure EXACTLY, with no markdown code blocks around it if possible (just raw JSON):
{
  "farmerInput": {
    "crop": "...",
    "quantity": "...",
    "county": "..."
  },
  "marketOptions": [
    {
      "market": "...",
      "county": "...",
      "price": "...",
      "unit": "...",
      "source": "...",
      "observedDate": "...",
      "evidence": "..."
    }
  ],
  "buyerOptions": [
    {
      "dealerId": "...",
      "displayName": "...",
      "countiesServed": [],
      "cropsDealt": [],
      "purchasingCapacityKg": "...",
      "verificationStatus": "...",
      "verificationSource": "..."
    }
  ],
  "recommendation": {
    "option": "...",
    "nextAction": "...",
    "reason": "...",
    "confidence": "...",
    "limitations": []
  },
  "evidence": [],
  "dataLimitations": []
}
`;

const asArray = (value) => (Array.isArray(value) ? value.filter((v) => v && typeof v === 'object') : []);

const fail = (code, error) => ({ success: false, code, error });

const extractJson = (text) => {
  let responseText = String(text || '').trim();
  responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(responseText);
  } catch {
    // Fall back to the outermost JSON object if the model wrapped it in prose
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { return JSON.parse(responseText.slice(start, end + 1)); } catch { /* fallthrough */ }
    }
    return null;
  }
};

export const getMarketRecommendationForFarmer = async (farmerInput, overrides = {}) => {
  try {
    const { crop, quantity, unit, county } = farmerInput;

    const getPrices = overrides.getMarketPrices || getMarketPrices;
    const getBuyers = overrides.findBuyers || findBuyers;
    const getBenchmarks = overrides.getNationalBenchmarks || getNationalBenchmarks;
    const getFaoHistory = overrides.getFaoPriceHistory || getFaoPriceHistory;
    const ai = overrides.agentService || agentService;

    // Tools are invoked inside the try so synchronous throws are also captured,
    // and non-array results are treated as malformed rather than crashing later.
    const fetchGracefully = async (fn, args, name) => {
      try {
        const result = await fn(args);
        if (!Array.isArray(result)) {
          return { success: false, error: `${name} returned a malformed result and was ignored.`, data: [] };
        }
        return { success: true, data: asArray(result) };
      } catch (err) {
        return { success: false, error: `${name} retrieval failed: ${err.message}`, data: [] };
      }
    };

    // 1. Gather Evidence using MCP tools concurrently and gracefully
    const [marketPricesRes, localMarketPricesRes, buyersRes, localBuyersRes, benchmarksRes, faoHistoryRes] = await Promise.all([
      fetchGracefully(getPrices, { crop, limit: 10 }, 'Broad market prices'),
      fetchGracefully(getPrices, { crop, county, limit: 5 }, 'Local market prices'),
      fetchGracefully(getBuyers, { crop, limit: 10 }, 'Broad buyer information'),
      fetchGracefully(getBuyers, { crop, county, limit: 5 }, 'Local buyer information'),
      fetchGracefully(getBenchmarks, { commodity: crop, limit: 5 }, 'National benchmarks'),
      fetchGracefully(getFaoHistory, { commodity: crop, limit: 10 }, 'Historical context')
    ]);

    const marketPrices = marketPricesRes.data;
    const localMarketPrices = localMarketPricesRes.data;
    const buyers = buyersRes.data;
    const localBuyers = localBuyersRes.data;
    const benchmarks = benchmarksRes.data;
    const faoHistory = faoHistoryRes.data;

    const runtimeDataLimitations = [
      marketPricesRes, localMarketPricesRes, buyersRes, localBuyersRes, benchmarksRes, faoHistoryRes
    ].filter(r => !r.success).map(r => r.error);
    
    // Combine and deduplicate market prices
    const allMarketPrices = [...localMarketPrices, ...marketPrices]
      .filter((v, i, a) => a.findIndex(t => (t.market === v.market)) === i)
      .map((p) => normalizeMarketPrice(p));

    // Combine and deduplicate buyers
    const allBuyers = [...localBuyers, ...buyers]
      .filter((v) => typeof v.dealerId === 'string')
      .filter((v, i, a) => a.findIndex(t => (t.dealerId === v.dealerId)) === i);

    const query = { crop, quantity, unit, county };

    // 2. No KAMIS prices and no eligible dealers: there is nothing to reason about.
    // Return an honest, deterministic response instead of asking the AI to guess.
    if (allMarketPrices.length === 0 && allBuyers.length === 0) {
      return {
        success: true,
        data: {
          query,
          farmerInput: { crop, quantity: `${quantity} ${unit}`, county },
          marketOptions: [],
          buyerOptions: [],
          recommendation: {
            option: 'Insufficient evidence',
            nextAction: 'Check the Market Prices page later or contact your county agricultural office for current prices before selling.',
            reason: `No KAMIS market prices and no licence-active public dealers were found for "${crop}". No recommendation can be made without evidence.`,
            confidence: 'Low',
            limitations: ['No current market price observations found.', 'No eligible dealers found for this crop.'],
          },
          evidence: [],
          dataLimitations: [...runtimeDataLimitations, 'Recommendation generated without AI because no supporting evidence was retrieved.'],
          generatedBy: 'SYSTEM_NO_EVIDENCE',
        },
      };
    }

    const evidenceData = {
      currentMarketData: allMarketPrices,
      nationalBenchmark: benchmarks.map((b) => normalizeMarketPrice(b)),
      historicalContext: faoHistory.map((h) => normalizeMarketPrice(h)),
      buyerInformation: allBuyers
    };

    const userPrompt = `
Farmer Input:
Crop: ${crop}
Quantity: ${quantity} ${unit}
County: ${county}

Evidence retrieved from database:
${JSON.stringify(evidenceData, null, 2)}

System Retrieval Errors (Add these to dataLimitations):
${JSON.stringify(runtimeDataLimitations, null, 2)}

Verification rule: a dealer is officially AFA-verified ONLY if "isOfficiallyVerified" is true. Demo AFA records must be described as unverified.

Analyze this evidence and provide the JSON recommendation.
`;

    // 3. Call Gemini
    const init = ai.initialize();
    if (!init.success) {
      return fail('AI_NOT_CONFIGURED', 'Market recommendation AI is not configured on the server.');
    }

    const geminiResponse = await ai.generateAgentDecision(userPrompt, [], 2, {
      systemInstruction: SYSTEM_PROMPT,
    });

    if (!geminiResponse || !geminiResponse.success) {
      console.error('[IntelligenceAgent] Gemini call failed:', geminiResponse?.error?.code, geminiResponse?.error?.message);
      return fail('AI_UNAVAILABLE', 'The market recommendation AI service is temporarily unavailable. Please try again shortly.');
    }

    const structuredData = extractJson(geminiResponse.decisionText);
    if (!structuredData) {
      console.error('[IntelligenceAgent] Failed to parse Gemini JSON (length=%d)', String(geminiResponse.decisionText || '').length);
      return fail('AI_INVALID_OUTPUT', 'AI returned invalid structured data format.');
    }

    // Lightweight structural validation
    const rec = structuredData.recommendation;
    const isValidStructure =
      typeof structuredData === 'object' &&
      Array.isArray(structuredData.marketOptions) &&
      Array.isArray(structuredData.buyerOptions) &&
      rec && typeof rec === 'object' &&
      typeof rec.option === 'string' &&
      typeof rec.reason === 'string' &&
      typeof rec.confidence === 'string';

    if (!isValidStructure) {
      return fail('AI_INVALID_OUTPUT', 'AI returned an invalid recommendation structure.');
    }

    // 4. Evidence grounding: drop any market or dealer the AI mentions that was not retrieved.
    const knownMarkets = new Set(allMarketPrices.map((p) => String(p.market || '').toLowerCase()));
    const buyerById = new Map(allBuyers.map((b) => [b.dealerId, b]));
    const droppedNotes = [];

    const marketOptions = asArray(structuredData.marketOptions).filter((m) => {
      const ok = knownMarkets.has(String(m.market || '').toLowerCase());
      if (!ok) droppedNotes.push(`Removed unsupported market option "${m.market}" not present in retrieved KAMIS data.`);
      return ok;
    });

    // Dealer facts (capacity, verification) always come from the database, never from the AI text.
    const buyerOptions = asArray(structuredData.buyerOptions)
      .filter((b) => {
        const ok = buyerById.has(b.dealerId);
        if (!ok) droppedNotes.push(`Removed unsupported dealer "${b.displayName || b.dealerId}" not present in retrieved dealer data.`);
        return ok;
      })
      .map((b) => {
        const src = buyerById.get(b.dealerId);
        return {
          dealerId: src.dealerId,
          displayName: src.displayName,
          countiesServed: src.countiesServed,
          cropsDealt: src.cropsDealt,
          purchasingCapacityKg: src.purchasingCapacityKg,
          verificationStatus: src.verificationStatus,
          verificationSource: src.verificationSource,
          isOfficiallyVerified: src.isOfficiallyVerified === true,
          verificationNote: src.verificationNote,
        };
      });

    return {
      success: true,
      data: {
        query,
        farmerInput: structuredData.farmerInput || { crop, quantity: `${quantity} ${unit}`, county },
        marketOptions,
        buyerOptions,
        recommendation: {
          option: rec.option,
          nextAction: typeof rec.nextAction === 'string' ? rec.nextAction : '',
          reason: rec.reason,
          confidence: rec.confidence,
          limitations: Array.isArray(rec.limitations) ? rec.limitations.map(String) : [],
        },
        evidence: [...allMarketPrices, ...allBuyers],
        dataLimitations: [
          ...runtimeDataLimitations,
          ...(Array.isArray(structuredData.dataLimitations) ? structuredData.dataLimitations.map(String) : []),
          ...droppedNotes,
        ].filter((v, i, a) => a.indexOf(v) === i),
        generatedBy: 'GEMINI_WITH_RETRIEVED_EVIDENCE',
      }
    };

  } catch (err) {
    console.error('Intelligence Agent Error:', err);
    return fail('INTERNAL_ERROR', 'Unexpected error while generating the recommendation.');
  }
};
