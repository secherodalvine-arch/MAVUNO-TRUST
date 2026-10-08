import FAOPriceHistory from '../models/FAOPriceHistory.js';

export const runFAOSync = async () => {
    try {
        console.log('[FAO Sync] Starting FAO/WFP historical data synchronization...');
        
        // 1. Fetch metadata from HDX
        const pkgReq = await fetch('https://data.humdata.org/api/3/action/package_show?id=wfp-food-prices-for-kenya');
        if (!pkgReq.ok) {
            throw new Error(`HDX API returned status ${pkgReq.status}`);
        }
        
        const pkgData = await pkgReq.json();
        if (!pkgData.success || !pkgData.result || !pkgData.result.resources) {
            throw new Error("Invalid HDX metadata format");
        }

        // 2. Identify the CSV resource
        const csvResource = pkgData.result.resources.find(r => r.format.toLowerCase() === 'csv' && r.name.toLowerCase().includes('food prices'));
        if (!csvResource) {
            throw new Error("Could not find the WFP Food Prices CSV resource for Kenya");
        }

        console.log(`[FAO Sync] Found CSV resource: ${csvResource.url}`);

        // 3. Fetch CSV data
        const csvReq = await fetch(csvResource.url);
        if (!csvReq.ok) {
            throw new Error(`Failed to download CSV: ${csvReq.status}`);
        }
        
        console.log(`[FAO Sync] Downloading CSV data...`);
        const csvText = await csvReq.text();
        console.log(`[FAO Sync] CSV downloaded. Parsing...`);
        
        let lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (process.env.TEST_MODE === 'true') {
            console.log('[FAO Sync] TEST_MODE is active. Slicing lines to 2000.');
            lines = lines.slice(0, 2000);
        }

        if (lines.length < 2) {
            throw new Error("CSV file is empty or missing data rows");
        }

        const headers = lines[0].split(',');
        const dateIdx = headers.indexOf('date');
        const admin1Idx = headers.indexOf('admin1');
        const admin2Idx = headers.indexOf('admin2');
        const marketIdx = headers.indexOf('market');
        const commodityIdx = headers.indexOf('commodity');
        const unitIdx = headers.indexOf('unit');
        const priceTypeIdx = headers.indexOf('pricetype');
        const currencyIdx = headers.indexOf('currency');
        const priceIdx = headers.indexOf('price');

        // Only process recent data to avoid full historical reload on every run (e.g. last 3 years)
        // Or process all since upsert handles duplicates. We will process all for completeness,
        // but to keep it lightweight, we batch them.
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 5); // Store up to 5 years of history to prevent bloating
        
        // Focus commodities relevant to MavunoTrust
        const relevantCommodities = ['Maize', 'Beans', 'Wheat', 'Rice', 'Potatoes', 'Sorghum', 'Millet', 'Milk', 'Tomatoes', 'Onions'];

        const bulkOps = [];
        let processedCount = 0;

        for (let i = 1; i < lines.length; i++) {
            // Very naive CSV split, assuming no quoted commas in standard WFP HDX data
            const row = lines[i].split(',');
            if (row.length < priceIdx) continue;

            const commodityRaw = row[commodityIdx];
            if (!commodityRaw) continue;

            // Check if it matches our relevant commodities
            const isRelevant = relevantCommodities.some(rc => commodityRaw.toLowerCase().includes(rc.toLowerCase()));
            if (!isRelevant) continue;

            const dateStr = row[dateIdx];
            if (!dateStr) continue;

            const rowDate = new Date(dateStr);
            if (isNaN(rowDate.getTime())) continue;
            
            // Limit to 5 years of historical context to optimize DB size
            if (rowDate < cutoffDate) continue;

            const market = row[marketIdx];
            const price = parseFloat(row[priceIdx]);
            if (isNaN(price)) continue;

            bulkOps.push({
                updateOne: {
                    filter: {
                        commodity: commodityRaw,
                        market: market,
                        date: rowDate,
                        priceType: row[priceTypeIdx],
                        unit: row[unitIdx],
                        source: 'WFP/HDX'
                    },
                    update: {
                        $setOnInsert: {
                            country: 'Kenya',
                            admin1: row[admin1Idx],
                            admin2: row[admin2Idx],
                            value: price,
                            currency: row[currencyIdx],
                            dataType: 'historical monthly average',
                            dataset: 'Kenya Food Prices',
                            retrievedAt: new Date()
                        }
                    },
                    upsert: true
                }
            });

            processedCount++;

            // Execute in batches of 500
            if (bulkOps.length >= 500) {
                await FAOPriceHistory.bulkWrite(bulkOps, { ordered: false });
                bulkOps.length = 0;
            }
        }

        if (bulkOps.length > 0) {
            await FAOPriceHistory.bulkWrite(bulkOps, { ordered: false });
        }

        console.log(`[FAO Sync] Synchronization complete. Upserted/checked relevant records: ${processedCount}`);
        return { success: true, recordsProcessed: processedCount };
    } catch (error) {
        console.error(`[FAO Sync] Error during synchronization: ${error.message}`);
        return { success: false, error: error.message };
    }
}


