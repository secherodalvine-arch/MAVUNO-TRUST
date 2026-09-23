/**
 * Generalized Data Processing Tools for MavunoAgent
 *
 * Normalizes, validates, and deduplicates market price observations.
 */

export const processingTools = {
  /**
   * Normalizes raw price fields into standard types and units.
   */
  normalizePriceRecord: (record) => {
    if (!record) return null;

    const wholesale = record.wholesalePrice != null ? Number(record.wholesalePrice) : null;
    const retail = record.retailPrice != null ? Number(record.retailPrice) : null;

    return {
      source: 'KAMIS',
      sourceMethod: 'MAVUNO_AGENT',
      commodity: record.commodity ? record.commodity.trim() : null,
      classification: record.classification ? record.classification.trim() : null,
      grade: record.grade ? record.grade.trim() : null,
      market: record.market ? record.market.trim() : null,
      county: record.county ? record.county.trim() : null,
      wholesalePrice: wholesale !== null && !isNaN(wholesale) ? wholesale : null,
      retailPrice: retail !== null && !isNaN(retail) ? retail : null,
      unit: record.unit ? record.unit.trim().toUpperCase() : null,
      supplyVolume: record.supplyVolume != null && !isNaN(Number(record.supplyVolume)) ? Number(record.supplyVolume) : null,
      observedDate: record.observedDate ? new Date(record.observedDate) : new Date(),
      retrievedAt: new Date(),
      sourceUrl: record.sourceUrl || 'https://kamis.kilimo.go.ke',
      syncRunId: record.syncRunId || null,
    };
  },

  /**
   * Validates normalized price records.
   */
  validatePriceRecord: (normalizedRecord) => {
    if (!normalizedRecord) {
      return { isValid: false, reason: 'RECORD_NULL' };
    }

    if (!normalizedRecord.commodity) {
      return { isValid: false, reason: 'MISSING_COMMODITY' };
    }

    if (!normalizedRecord.market) {
      return { isValid: false, reason: 'MISSING_MARKET' };
    }

    if (!normalizedRecord.unit) {
      return { isValid: false, reason: 'MISSING_UNIT' };
    }

    const hasValidWholesale = normalizedRecord.wholesalePrice !== null && normalizedRecord.wholesalePrice >= 0;
    const hasValidRetail = normalizedRecord.retailPrice !== null && normalizedRecord.retailPrice >= 0;

    if (!hasValidWholesale && !hasValidRetail) {
      return { isValid: false, reason: 'PRICE_NOT_FOUND' };
    }

    if (!normalizedRecord.observedDate || isNaN(normalizedRecord.observedDate.getTime())) {
      return { isValid: false, reason: 'INVALID_OBSERVED_DATE' };
    }

    return { isValid: true };
  },

  /**
   * Deduplicates records based on commodity + market + unit + observedDate.
   */
  deduplicateRecords: (records = []) => {
    const uniqueMap = new Map();
    const duplicates = [];

    for (const record of records) {
      const key = `${record.commodity}_${record.market}_${record.unit}_${record.observedDate ? record.observedDate.toISOString() : 'nodate'}`.toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, record);
      } else {
        duplicates.push(record);
      }
    }

    return {
      uniqueRecords: Array.from(uniqueMap.values()),
      duplicateCount: duplicates.length,
    };
  },
};
