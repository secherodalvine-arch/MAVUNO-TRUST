import { getMarketRecommendationForFarmer } from '../agents/intelligenceAgent/agent.js';

export const getMarketRecommendation = async (req, res) => {
  try {
    const { crop, quantity, unit, county } = req.body;

    if (!crop || quantity === undefined || !county) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: crop, quantity, county',
      });
    }

    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number.',
      });
    }

    // Call the Intelligence Agent orchestration function
    const recommendationResult = await getMarketRecommendationForFarmer({
      crop,
      quantity,
      unit: unit || 'kg',
      county,
    });

    if (!recommendationResult.success) {
      return res.status(500).json({
        success: false,
        message: recommendationResult.error || 'Failed to generate recommendation',
      });
    }

    return res.status(200).json({
      success: true,
      data: recommendationResult.data,
    });
  } catch (error) {
    console.error('Market Recommendation Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing recommendation',
    });
  }
};
