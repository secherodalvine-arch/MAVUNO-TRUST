import { getMarketRecommendationForFarmer } from '../agents/intelligenceAgent/agent.js';

// Map agent failure codes to accurate HTTP statuses instead of a blanket 500.
const STATUS_BY_CODE = {
  AI_NOT_CONFIGURED: 503,
  AI_UNAVAILABLE: 503,
  AI_INVALID_OUTPUT: 502,
  MAVUNOAGENT_BLOCKED: 502,
  MAVUNOAGENT_EMPTY_OUTPUT: 502,
  MAVUNOAGENT_CREDENTIALS_MISSING: 503,
  // Gemini API HTTP error codes — 4xx from Gemini are the server's config issue, not the caller's.
  MAVUNOAGENT_API_HTTP_400: 502,
  MAVUNOAGENT_API_HTTP_429: 503,
  MAVUNOAGENT_API_HTTP_500: 503,
  MAVUNOAGENT_API_HTTP_502: 503,
  MAVUNOAGENT_API_HTTP_503: 503,
  MAVUNOAGENT_API_HTTP_504: 503,
  INTERNAL_ERROR: 500,
};

// Error body uses the project-wide { success, error: { message } } shape the frontend reads.
const sendError = (res, status, message, code) =>
  res.status(status).json({ success: false, error: { message, ...(code ? { code } : {}) }, message });

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 100;

export const createMarketRecommendationHandler = (agent = getMarketRecommendationForFarmer) => async (req, res) => {
  try {
    const { crop, quantity, unit, county } = req.body || {};

    if (!isNonEmptyString(crop) || quantity === undefined || !isNonEmptyString(county)) {
      return sendError(res, 400, 'Missing or invalid required fields: crop, quantity, county', 'VALIDATION_ERROR');
    }

    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
      return sendError(res, 400, 'Quantity must be a positive number.', 'VALIDATION_ERROR');
    }

    if (unit !== undefined && !isNonEmptyString(unit)) {
      return sendError(res, 400, 'Unit must be a non-empty string.', 'VALIDATION_ERROR');
    }

    const recommendationResult = await agent({
      crop: crop.trim(),
      quantity,
      unit: unit ? unit.trim() : 'kg',
      county: county.trim(),
    });

    if (!recommendationResult || !recommendationResult.success) {
      const code = recommendationResult?.code || 'INTERNAL_ERROR';
      return sendError(
        res,
        STATUS_BY_CODE[code] || 500,
        recommendationResult?.error || 'Failed to generate recommendation',
        code
      );
    }

    return res.status(200).json({
      success: true,
      data: recommendationResult.data,
    });
  } catch (error) {
    console.error('Market Recommendation Controller Error:', error);
    return sendError(res, 500, 'Internal server error processing recommendation', 'INTERNAL_ERROR');
  }
};

export const getMarketRecommendation = createMarketRecommendationHandler();
