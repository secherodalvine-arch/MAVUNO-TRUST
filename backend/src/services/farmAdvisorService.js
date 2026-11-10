/**
 * Farm Advisor Service — MavunoTrust Smart Farm Advisor (Phase 3)
 *
 * Integrates Sentinel-2 NDVI satellite observations with the existing Gemini AI
 * to generate practical agricultural recommendations for farmers.
 *
 * CRITICAL RULES:
 *  1. NEVER diagnose crop diseases from satellite data alone.
 *  2. NEVER present NDVI observations as confirmed crop disease diagnoses.
 *  3. NEVER fabricate or invent satellite readings.
 *  4. NEVER expose private coordinates or farm boundary in advisory responses.
 *  5. Only call Gemini when real NDVI data is available.
 *  6. Reuses the existing GEMINI_API_KEY — no new credentials needed.
 *  7. Structurally separates vegetation observation from agronomic interpretation.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const ADVISORY_SYSTEM_PROMPT = `You are an agricultural field advisor for MavunoTrust, a Kenyan smallholder farmer platform.

Your role is to interpret Sentinel-2 satellite vegetation health observations and provide practical farming guidance to smallholder farmers in Kenya.

STRICT RULES — you MUST follow these without exception:
1. NEVER diagnose crop diseases. If you observe vegetation stress, say "vegetation stress observed" or "reduced vegetation health" — NEVER "crop disease detected" or "your crop has [disease name]".
2. NEVER invent satellite readings. Only interpret the NDVI data provided in the user message.
3. ALWAYS mention that satellite observations have limitations and ground-truth verification is needed.
4. ALWAYS give practical, actionable recommendations appropriate for Kenyan smallholder farmers.
5. NEVER recommend specific pesticide brands or chemicals by name.
6. ALWAYS use simple, clear language that a farmer without technical education can understand.
7. NEVER make price or market predictions.
8. If NDVI data is missing or unavailable, clearly state that no satellite observation is available.
9. Consider the farmers county, crop types, and farm size in your recommendations.
10. Acknowledge that NDVI is an estimate — it reflects apparent vegetation density, not confirmed crop condition.

OUTPUT FORMAT — respond ONLY with a valid JSON object in this exact structure:
{
  "vegetationObservation": "Plain-language summary of what the satellite data shows about vegetation health (1-2 sentences)",
  "ndviSummary": "Technical NDVI interpretation suitable for a farmer (1-2 sentences)",
  "practicalRecommendations": [
    "First actionable recommendation",
    "Second actionable recommendation",
    "Third actionable recommendation"
  ],
  "limitations": [
    "One important limitation of this satellite analysis",
    "Second important limitation"
  ],
  "confidence": "HIGH | MEDIUM | LOW — based on data quality and cloud cover",
  "disclaimer": "One-sentence disclaimer that this is not a confirmed diagnosis"
}`;

// ── NDVI Health Classification ────────────────────────────────────────────────

/**
 * Classifies an NDVI value into a human-readable vegetation health category.
 * @param {number|null} ndvi
 * @returns {{ label: string, description: string, severity: 'good'|'moderate'|'concern'|'unknown' }}
 */
export function classifyNDVI(ndvi) {
  if (ndvi === null || ndvi === undefined || !Number.isFinite(ndvi)) {
    return {
      label: 'No Data',
      description: 'Satellite observation not available',
      severity: 'unknown',
    };
  }

  if (ndvi > 0.6) {
    return {
      label: 'Very Dense Vegetation',
      description: 'Very high vegetation density observed. Plants appear healthy and vigorous.',
      severity: 'good',
    };
  }
  if (ndvi > 0.4) {
    return {
      label: 'Moderate to Dense Vegetation',
      description: 'Good vegetation density observed. Generally indicates healthy growing crop.',
      severity: 'good',
    };
  }
  if (ndvi > 0.2) {
    return {
      label: 'Sparse Vegetation',
      description: 'Moderate vegetation density. Could indicate young crops, partial ground cover, or some stress.',
      severity: 'moderate',
    };
  }
  if (ndvi > 0.0) {
    return {
      label: 'Very Sparse Vegetation',
      description: 'Low vegetation density observed. May indicate stressed crops, bare patches, or early crop stage.',
      severity: 'concern',
    };
  }
  if (ndvi > -0.1) {
    return {
      label: 'Bare Ground or Water',
      description: 'Very low or no vegetation detected. May indicate bare soil, water, or harvested field.',
      severity: 'concern',
    };
  }
  return {
    label: 'Non-Vegetated Surface',
    description: 'No significant vegetation detected. This could be bare soil, water, or built surfaces.',
    severity: 'concern',
  };
}

// ── Advisory Generation ────────────────────────────────────────────────────────

/**
 * Builds a structured farming context message from NDVI data and farmer profile info.
 * This message is passed to Gemini for interpretation.
 *
 * @param {object} params
 * @param {object} params.ndviData - Raw NDVI result from satelliteService.calculateFarmNDVI()
 * @param {string[]} params.primaryCrops - Farmer's declared crops
 * @param {string} params.county - Farmer's county
 * @param {number|null} params.farmSizeAcres - Farm size in acres
 * @returns {string}
 */
function buildFarmingContextMessage({ ndviData, primaryCrops, county, farmSizeAcres }) {
  const crops = primaryCrops && primaryCrops.length > 0
    ? primaryCrops.join(', ')
    : 'crops not specified';

  const farmSize = farmSizeAcres ? `${farmSizeAcres} acres` : 'farm size not registered';

  const mean = ndviData.meanNDVI;
  const classification = classifyNDVI(mean);
  const imageDate = ndviData.imageryDate || 'Date unknown';
  const cloudCover = ndviData.cloudCoverPercent !== undefined && ndviData.cloudCoverPercent !== null
    ? `${ndviData.cloudCoverPercent}%`
    : 'unknown';
  const validPixels = ndviData.validPixelPercent !== undefined && ndviData.validPixelPercent !== null
    ? `${ndviData.validPixelPercent}%`
    : 'unknown';

  return `FARM CONTEXT:
- Farmer location: ${county || 'County not specified'}, Kenya
- Primary crops: ${crops}
- Farm size: ${farmSize}

SATELLITE OBSERVATION (Sentinel-2 / NDVI — this is a vegetation density estimate, NOT a confirmed diagnosis):
- Observation date: ${imageDate}
- Mean NDVI over farm area: ${mean !== null ? mean.toFixed(4) : 'unavailable'}
- Min NDVI: ${ndviData.minNDVI !== null ? ndviData.minNDVI.toFixed(4) : 'unavailable'}
- Max NDVI: ${ndviData.maxNDVI !== null ? ndviData.maxNDVI.toFixed(4) : 'unavailable'}
- Vegetation classification: ${classification.label} — ${classification.description}
- Imagery cloud cover: ${cloudCover}
- Valid observation pixels: ${validPixels}
- Satellite dataset: Sentinel-2 Harmonized Surface Reflectance (COPERNICUS/S2_SR_HARMONIZED)
- Band formula: NDVI = (Band 8 NIR - Band 4 Red) / (Band 8 NIR + Band 4 Red)

Please provide agricultural guidance for this farmer based on the satellite observation above. Remember: this is a vegetation density estimate — do NOT diagnose specific diseases.`;
}

/**
 * Calls Gemini with the farming context and parses the structured JSON advisory response.
 *
 * @param {string} contextMessage
 * @returns {Promise<object>} Parsed advisory JSON
 */
async function callGeminiAdvisory(contextMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('Gemini API key is not configured. Set GEMINI_API_KEY in environment.'),
      { statusCode: 503, code: 'GEMINI_CREDENTIALS_REQUIRED' }
    );
  }

  const url = `${GEMINI_API_URL}?key=${apiKey}`;
  const payload = {
    system_instruction: {
      parts: [{ text: ADVISORY_SYSTEM_PROMPT }],
    },
    contents: [
      {
        parts: [{ text: contextMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(`Gemini API responded with HTTP ${response.status}`),
      { statusCode: 502, code: 'GEMINI_API_ERROR' }
    );
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
    throw Object.assign(
      new Error('Gemini returned an empty response.'),
      { statusCode: 502, code: 'GEMINI_EMPTY_RESPONSE' }
    );
  }

  const rawText = data.candidates[0].content.parts[0].text;

  try {
    // Strip markdown code fences if Gemini wraps in ```json ... ```
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleaned);
  } catch (parseErr) {
    // Return raw text in a structured wrapper if JSON parsing fails
    return {
      vegetationObservation: rawText,
      ndviSummary: 'AI generated a text response rather than structured JSON.',
      practicalRecommendations: ['Please consult your local agricultural extension officer for personalized advice.'],
      limitations: ['The AI advisory could not be parsed as structured data.'],
      confidence: 'LOW',
      disclaimer: 'This is an automated vegetation observation, not a confirmed crop disease diagnosis.',
    };
  }
}

// ── Main Advisory Function ────────────────────────────────────────────────────

/**
 * Generate an AI-powered farm advisory by combining real satellite NDVI data
 * with Gemini AI interpretation.
 *
 * IMPORTANT: This function never fabricates satellite data. If ndviData indicates
 * a GEE credentials error, it returns a structured error immediately without calling Gemini.
 *
 * @param {object} params
 * @param {object} params.ndviData - Result from satelliteService.calculateFarmNDVI()
 * @param {string[]} [params.primaryCrops=[]] - Farmer's primary crops
 * @param {string} [params.county=''] - Farmer's county
 * @param {number|null} [params.farmSizeAcres=null] - Farm size in acres
 * @returns {Promise<{ success: boolean, advisory?: object, ndviClassification?: object, error?: string, code?: string }>}
 */
export async function generateFarmAdvisory({
  ndviData,
  primaryCrops = [],
  county = '',
  farmSizeAcres = null,
}) {
  // Guard: Never call Gemini if satellite service is not configured
  if (!ndviData || !ndviData.success) {
    const code = ndviData?.code || 'SATELLITE_DATA_UNAVAILABLE';
    return {
      success: false,
      code,
      message: ndviData?.message || 'Satellite data is not available. Cannot generate advisory.',
      setupInstructions: ndviData?.setupInstructions || null,
    };
  }

  // Guard: Real data must be present in ndviData
  if (ndviData.meanNDVI === null || ndviData.meanNDVI === undefined) {
    return {
      success: false,
      code: 'NDVI_DATA_MISSING',
      message: 'Satellite imagery returned no valid NDVI readings for your farm area. This can happen due to heavy cloud cover or if the farm boundary is not correctly registered.',
    };
  }

  const ndviClassification = classifyNDVI(ndviData.meanNDVI);

  try {
    const contextMessage = buildFarmingContextMessage({
      ndviData,
      primaryCrops,
      county,
      farmSizeAcres,
    });

    const advisory = await callGeminiAdvisory(contextMessage);

    return {
      success: true,
      ndviClassification,
      observationDate: ndviData.imageryDate || null,
      advisory,
      dataQuality: {
        cloudCoverPercent: ndviData.cloudCoverPercent ?? null,
        validPixelPercent: ndviData.validPixelPercent ?? null,
        meanNDVI: ndviData.meanNDVI,
        minNDVI: ndviData.minNDVI ?? null,
        maxNDVI: ndviData.maxNDVI ?? null,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err.code === 'GEMINI_CREDENTIALS_REQUIRED') {
      return {
        success: false,
        code: 'GEMINI_CREDENTIALS_REQUIRED',
        message: 'Gemini AI is not configured. Set the GEMINI_API_KEY environment variable.',
        ndviClassification,
        observationDate: ndviData.imageryDate || null,
      };
    }

    return {
      success: false,
      code: err.code || 'ADVISORY_GENERATION_FAILED',
      message: `Failed to generate farm advisory: ${err.message}`,
      ndviClassification,
      observationDate: ndviData.imageryDate || null,
    };
  }
}
