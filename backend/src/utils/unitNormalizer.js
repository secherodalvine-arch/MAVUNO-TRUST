export const normalizeMarketPrice = (observation) => {
    // Clone observation to avoid mutating original source
    const result = { ...observation };

    // Set defaults for failure
    result.normalizedPricePerKg = null;
    result.normalizedCurrency = null;
    result.normalizationStatus = 'FAILED';
    result.normalizationLimitation = '';

    // Handle missing price or non-finite price
    const rawPrice = observation.wholesalePrice ?? observation.price ?? observation.value;
    if (typeof rawPrice !== 'number' || !Number.isFinite(rawPrice) || rawPrice <= 0) {
        result.normalizationLimitation = 'Price is missing, non-numeric, or non-positive';
        return result;
    }

    // Handle currency
    const rawCurrency = (observation.currency || 'KES').toUpperCase().trim();
    if (rawCurrency !== 'KES' && rawCurrency !== 'KSH') {
        result.normalizationLimitation = `Currency '${rawCurrency}' is not supported without a verified exchange rate`;
        return result;
    }

    const rawUnit = (observation.unit || '').trim().toLowerCase();
    if (!rawUnit) {
        result.normalizationLimitation = 'Unit is missing or empty';
        return result;
    }

    // Match precise units
    // KG match
    if (rawUnit === 'kg' || rawUnit === 'kilogram' || rawUnit === 'kilograms') {
        result.normalizedPricePerKg = Number(rawPrice.toFixed(4));
        result.normalizedCurrency = 'KES';
        result.normalizationStatus = 'SUCCESS';
        return result;
    }

    // Tonne match
    if (rawUnit === 'tonne' || rawUnit === 'metric ton' || rawUnit === 'metric tonne' || rawUnit === 'tonnes' || rawUnit === 'mt') {
        result.normalizedPricePerKg = Number((rawPrice / 1000).toFixed(4));
        result.normalizedCurrency = 'KES';
        result.normalizationStatus = 'SUCCESS';
        return result;
    }

    // Explicitly sized bags
    const bagRegex = /^(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram)s?\s*bag$/i;
    const bagMatch = rawUnit.match(bagRegex);
    if (bagMatch) {
        const weight = parseFloat(bagMatch[1]);
        if (Number.isFinite(weight) && weight > 0) {
            result.normalizedPricePerKg = Number((rawPrice / weight).toFixed(4));
            result.normalizedCurrency = 'KES';
            result.normalizationStatus = 'SUCCESS';
            return result;
        }
    }

    // Explicitly sized just "50 kg" or "90kg" (sometimes used without the word 'bag')
    const weightRegex = /^(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram)s?$/i;
    const weightMatch = rawUnit.match(weightRegex);
    if (weightMatch) {
        const weight = parseFloat(weightMatch[1]);
        if (Number.isFinite(weight) && weight > 0) {
            result.normalizedPricePerKg = Number((rawPrice / weight).toFixed(4));
            result.normalizedCurrency = 'KES';
            result.normalizationStatus = 'SUCCESS';
            return result;
        }
    }

    // If unit is generic bag/crate/bunch without explicit size
    if (rawUnit.includes('bag') || rawUnit.includes('crate') || rawUnit.includes('bunch') || rawUnit.includes('bucket')) {
        result.normalizationLimitation = `Ambiguous unit '${observation.unit}' cannot be converted without an explicit weight`;
        return result;
    }

    result.normalizationLimitation = `Unknown or unsupported unit '${observation.unit}'`;
    return result;
};
