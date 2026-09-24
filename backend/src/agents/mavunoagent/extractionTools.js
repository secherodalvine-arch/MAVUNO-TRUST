/**
 * Extraction Tools for MavunoAgent
 *
 * Extracts truthful 10-column table rows and parses price, unit, volume,
 * and market fields directly from KAMIS HTML content.
 */

function cleanVal(str) {
  if (!str) return null;
  const s = str.trim();
  return (s === '-' || s === '--' || s === 'N/A' || s === 'null' || s === '') ? null : s;
}

function parsePriceAndUnit(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') return { price: null, unit: 'KG' };
  const s = priceStr.trim().replace(/,/g, '');
  if (s === '-' || s === '--' || s === 'N/A' || s === '') return { price: null, unit: 'KG' };

  // Match e.g. "45.91/Kg", "60.00/Kg", "4,500/50Kg Bag", "100.00"
  const match = s.match(/([\d\.]+)(?:\s*\/\s*([a-zA-Z0-9\s]+))?/);
  if (!match) return { price: null, unit: 'KG' };

  const price = parseFloat(match[1]);
  const rawUnit = match[2] ? match[2].trim().toUpperCase() : 'KG';
  // Standardize common units
  let unit = rawUnit;
  if (rawUnit === 'KG' || rawUnit === 'KGS') unit = 'KG';
  else if (rawUnit.includes('BAG')) unit = rawUnit;
  else if (rawUnit.includes('TONNE') || rawUnit.includes('TON')) unit = 'TONNE';

  return {
    price: !isNaN(price) ? price : null,
    unit,
  };
}

export const extractionTools = {
  /**
   * Extracts raw product table rows from KAMIS HTML content.
   */
  extractProductTable: async ({ rawContent }) => {
    if (!rawContent || typeof rawContent !== 'string') {
      return {
        success: false,
        error: 'PAGE_CONTENT_EMPTY',
        message: 'No HTML content provided for table extraction',
        headers: [],
        rows: [],
      };
    }

    // Locate table in HTML
    const tableMatch = rawContent.match(/<table[^>]*class=["'][^"']*table[^"']*["'][^>]*>([\s\S]*?)<\/table>/i) ||
                       rawContent.match(/<table[^>]*>([\s\S]*?)<\/table>/i);

    if (!tableMatch) {
      return {
        success: false,
        error: 'TABLE_NOT_FOUND',
        message: 'Could not find market price table in KAMIS HTML',
        headers: [],
        rows: [],
      };
    }

    const tableHtml = tableMatch[1];

    // Extract headers
    const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
    const headers = [];
    let hMatch;
    while ((hMatch = headerRegex.exec(tableHtml)) !== null) {
      headers.push(hMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    // Extract tbody rows
    const tbodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    const bodyContent = tbodyMatch ? tbodyMatch[1] : tableHtml;

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

    const extractedRows = [];
    let rMatch;
    while ((rMatch = rowRegex.exec(bodyContent)) !== null) {
      const rowContent = rMatch[1];
      const cells = [];
      let cMatch;
      while ((cMatch = cellRegex.exec(rowContent)) !== null) {
        cells.push(cMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      if (cells.length >= 7) {
        // KAMIS columns:
        // 0: Commodity, 1: Classification, 2: Grade, 3: Sex, 4: Market,
        // 5: Wholesale, 6: Retail, 7: Supply Volume, 8: County, 9: Date
        extractedRows.push({
          commodity: cells[0] || 'Produce',
          classification: cleanVal(cells[1]),
          grade: cleanVal(cells[2]),
          sex: cleanVal(cells[3]),
          market: cells[4] || 'Regional Market',
          wholesale: cells[5] || '',
          retail: cells[6] || '',
          supplyVolume: cells.length > 7 ? cells[7] : null,
          county: cells.length > 8 ? cells[8] : 'Kenya',
          observedDate: cells.length > 9 ? cells[9] : new Date().toISOString().split('T')[0],
        });
      }
    }

    return {
      success: true,
      headers: headers.length > 0 ? headers : ['Commodity', 'Classification', 'Grade', 'Sex', 'Market', 'Wholesale', 'Retail', 'Supply Volume', 'County', 'Date'],
      rows: extractedRows,
      totalCount: extractedRows.length,
    };
  },

  /**
   * Parses price, unit, and volume fields from raw row observation.
   */
  extractPriceFields: async ({ rawRow }) => {
    if (!rawRow || typeof rawRow !== 'object') {
      return {
        success: false,
        error: 'PRICE_FIELDS_INVALID',
        message: 'Invalid row object',
      };
    }

    const wholesaleInfo = parsePriceAndUnit(rawRow.wholesale);
    const retailInfo = parsePriceAndUnit(rawRow.retail);

    const wholesale = rawRow.wholesalePrice !== undefined && rawRow.wholesalePrice !== null
      ? Number(rawRow.wholesalePrice)
      : wholesaleInfo.price;

    const retail = rawRow.retailPrice !== undefined && rawRow.retailPrice !== null
      ? Number(rawRow.retailPrice)
      : retailInfo.price;

    if (wholesale === null && retail === null) {
      return {
        success: false,
        error: 'PRICE_NOT_FOUND',
        message: 'Neither wholesale nor retail price found in raw observation',
      };
    }

    const unit = rawRow.unit || wholesaleInfo.unit || retailInfo.unit || 'KG';

    let volumeNum = null;
    if (rawRow.supplyVolume !== null && rawRow.supplyVolume !== undefined) {
      const vStr = String(rawRow.supplyVolume).replace(/,/g, '').trim();
      const parsedVol = parseFloat(vStr);
      if (!isNaN(parsedVol) && vStr !== '-' && vStr !== '') {
        volumeNum = parsedVol;
      }
    }

    let parsedDate = new Date();
    if (rawRow.observedDate) {
      const d = new Date(rawRow.observedDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    return {
      success: true,
      extracted: {
        commodity: cleanVal(rawRow.commodity) || 'General Produce',
        classification: cleanVal(rawRow.classification),
        grade: cleanVal(rawRow.grade),
        sex: cleanVal(rawRow.sex),
        market: cleanVal(rawRow.market) || 'Regional Market',
        county: cleanVal(rawRow.county) || 'Kenya',
        wholesalePrice: wholesale,
        retailPrice: retail,
        unit,
        supplyVolume: volumeNum,
        observedDate: parsedDate,
      },
    };
  },
};
