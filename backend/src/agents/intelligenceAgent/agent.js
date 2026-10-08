import { agentService } from '../mavunoagent/agentService.js';
import { getMarketPrices, getNationalBenchmarks, getFaoPriceHistory } from '../../mcp/tools/marketTools.js';
import { findBuyers } from '../../mcp/tools/dealerTools.js';

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
8. The "nextAction" must be a clear, practical, decision-oriented step for the farmer (e.g., "Contact the verified dealer to negotiate", "Compare at least two buyers", "Monitor the market").

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

export const getMarketRecommendationForFarmer = async (farmerInput, overrides = {}) => {
  try {
    const { crop, quantity, unit, county } = farmerInput;

    const getPrices = overrides.getMarketPrices || getMarketPrices;
    const getBuyers = overrides.findBuyers || findBuyers;
    const getBenchmarks = overrides.getNationalBenchmarks || getNationalBenchmarks;
    const getFaoHistory = overrides.getFaoPriceHistory || getFaoPriceHistory;

    const fetchGracefully = async (promise, name, fallback = []) => {
      try {
        const result = await promise;
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: `${name} retrieval failed: ${err.message}`, data: fallback };
      }
    };

    // 1. Gather Evidence using MCP tools concurrently and gracefully
    const [marketPricesRes, localMarketPricesRes, buyersRes, localBuyersRes, benchmarksRes, faoHistoryRes] = await Promise.all([
      fetchGracefully(getPrices({ crop, limit: 10 }), 'Broad market prices'),
      fetchGracefully(getPrices({ crop, county, limit: 5 }), 'Local market prices'),
      fetchGracefully(getBuyers({ crop, limit: 10 }), 'Broad buyer information'),
      fetchGracefully(getBuyers({ crop, county, limit: 5 }), 'Local buyer information'),
      fetchGracefully(getBenchmarks({ commodity: crop, limit: 5 }), 'National benchmarks'),
      fetchGracefully(getFaoHistory({ commodity: crop, limit: 10 }), 'Historical context')
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
    const allMarketPrices = [...localMarketPrices, ...marketPrices].filter((v, i, a) => a.findIndex(t => (t.market === v.market)) === i);

    // Combine and deduplicate buyers
    const allBuyers = [...localBuyers, ...buyers].filter((v, i, a) => a.findIndex(t => (t.dealerId === v.dealerId)) === i);

    const evidenceData = {
      currentMarketData: allMarketPrices,
      nationalBenchmark: benchmarks,
      historicalContext: faoHistory,
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

Analyze this evidence and provide the JSON recommendation.
`;

    // 2. Call Gemini
    const init = agentService.initialize();
    if (!init.success) {
      return { success: false, error: 'AI Agent not configured properly. Missing API key.' };
    }

    // Since agentService.generateAgentDecision doesn't strictly allow overriding the system instruction via a separate field, 
    // we prepend our SYSTEM_PROMPT to the task.
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

    const geminiResponse = await agentService.generateAgentDecision(fullPrompt);

    if (!geminiResponse.success) {
      return { success: false, error: geminiResponse.error?.message || 'Failed to get recommendation from AI' };
    }

    let responseText = geminiResponse.decisionText.trim();
    
    // Remove markdown code blocks if Gemini added them
    if (responseText.startsWith('\`\`\`json')) {
      responseText = responseText.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
    } else if (responseText.startsWith('\`\`\`')) {
      responseText = responseText.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
    }

    let structuredData;
    try {
      structuredData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', responseText);
      return { success: false, error: 'AI returned invalid structured data format.' };
    }

    // Lightweight structural validation
    const isValidStructure = 
      structuredData &&
      typeof structuredData === 'object' &&
      typeof structuredData.farmerInput === 'object' &&
      Array.isArray(structuredData.marketOptions) &&
      Array.isArray(structuredData.buyerOptions) &&
      typeof structuredData.recommendation === 'object' &&
      typeof structuredData.recommendation.option === 'string' &&
      typeof structuredData.recommendation.nextAction === 'string' &&
      typeof structuredData.recommendation.reason === 'string' &&
      typeof structuredData.recommendation.confidence === 'string' &&
      Array.isArray(structuredData.recommendation.limitations) &&
      Array.isArray(structuredData.evidence) &&
      Array.isArray(structuredData.dataLimitations);

    if (!isValidStructure) {
      return { success: false, error: 'AI returned an invalid recommendation structure.' };
    }

    return {
      success: true,
      data: structuredData
    };

  } catch (err) {
    console.error('Intelligence Agent Error:', err);
    return { success: false, error: err.message };
  }
};
