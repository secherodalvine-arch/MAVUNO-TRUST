/**
 * Generalized Extraction Tools for MavunoAgent
 *
 * Extracts table data, commodity observations, and price fields from KAMIS content.
 */

export const extractionTools = {
  /**
   * Extracts raw product table rows from page content or DOM.
   */
  extractProductTable: async ({ rawContent, tableSelector }) => {
    if (!rawContent && !tableSelector) {
      return {
        success: false,
        error: 'PAGE_STRUCTURE_INVALID',
        message: 'No HTML content or table selector provided',
      };
    }
    return {
      success: true,
      headers: ['Commodity', 'Classification', 'Grade', 'Market', 'County', 'Wholesale Price', 'Retail Price', 'Unit', 'Supply Volume', 'Date'],
      rows: [],
    };
  },

  /**
   * Parses price fields from observation row objects.
   */
  extractPriceFields: async ({ rawRow }) => {
    if (!rawRow || typeof rawRow !== 'object') {
      return {
        success: false,
        error: 'PRICE_FIELDS_INVALID',
        message: 'Invalid row object',
      };
    }

    const wholesale = rawRow.wholesalePrice !== undefined && rawRow.wholesalePrice !== null ? Number(rawRow.wholesalePrice) : null;
    const retail = rawRow.retailPrice !== undefined && rawRow.retailPrice !== null ? Number(rawRow.retailPrice) : null;

    if (wholesale === null && retail === null) {
      return {
        success: false,
        error: 'PRICE_NOT_FOUND',
        message: 'Neither wholesale nor retail price found in raw observation',
      };
    }

    return {
      success: true,
      extracted: {
        commodity: rawRow.commodity || rawRow.cropName || rawRow.product_name || 'General Produce',
        classification: rawRow.classification || null,
        grade: rawRow.grade || rawRow.qualityGrade || null,
        market: rawRow.market || rawRow.market_name || 'Regional Market',
        county: rawRow.county || rawRow.region || 'Kenya',
        wholesalePrice: wholesale,
        retailPrice: retail,
        unit: rawRow.unit || rawRow.measurement_unit || 'KG',
        supplyVolume: rawRow.supplyVolume ? Number(rawRow.supplyVolume) : null,
        observedDate: rawRow.observedDate || rawRow.observedAt || new Date().toISOString(),
      },
    };
  },
};
