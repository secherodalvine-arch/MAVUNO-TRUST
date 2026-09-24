import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { agentService } from './agentService.js';
import { MavunoAgent } from './agent.js';
import { BrowserSession } from './browserTools.js';
import { extractionTools } from './extractionTools.js';
import { processingTools } from './processingTools.js';
import MarketData from '../../models/MarketData.js';
import MarketPrice from '../../models/MarketPrice.js';
import MarketSyncRun, { SyncStatus } from '../../models/MarketSyncRun.js';

export class SyncWorker {
  async runSync(rawObservationsInput = null) {
    const syncRunId = `mavunoagent_sync_${uuidv4()}`;
    const startedAt = new Date();

    let syncRunRecord = null;
    try {
      syncRunRecord = await MarketSyncRun.create({
        syncRunId,
        startedAt,
        status: SyncStatus.RUNNING,
      });
    } catch (err) {
      // In-memory fallback if DB not connected
      syncRunRecord = {
        syncRunId,
        startedAt,
        status: SyncStatus.RUNNING,
        recordsFound: 0,
        recordsSaved: 0,
        recordsRejected: 0,
      };
    }

    // 1. Check Gemini Flash credentials
    const initResult = agentService.initialize();
    if (!initResult.success) {
      return this.failRun(syncRunRecord, 'MAVUNOAGENT_CREDENTIALS_MISSING', initResult.message);
    }

    // 2. Open browser session to KAMIS portal
    const session = new BrowserSession(agentService.getBaseUrl());
    try {
      await session.open();
    } catch (err) {
      return this.failRun(syncRunRecord, 'BROWSER_FAILED', err.message);
    }

    try {
      // 3. Navigate portal: locate the MARKETS dropdown or Commodity Prices navigation button
      const navResult = await session.findMarketNavigation();
      console.log(`[MavunoAgent] Navigation scan: Discovered ${navResult.count} market links. Target: ${navResult.targetMarketUrl}`);

      await session.navigateToMarketPage(navResult.targetMarketUrl);

      // 4. Skim available agricultural commodities from the live product selector
      const skimResult = await session.skimProducts();
      console.log(`[MavunoAgent] Skimmed ${skimResult.totalCount} active agricultural commodities from KAMIS selector.`);

      // 5. Agent planning step
      const agent = new MavunoAgent(agentService);
      let decision = { success: true, decisionText: 'Autonomous extraction initialized.' };
      try {
        const agentDecision = await agent.planExtractionStep(
          syncRunId,
          `Navigate to KAMIS market page (${session.currentUrl}), retrieve live 10-column market prices for active commodities, and structure observations.`
        );
        if (agentDecision.success) {
          decision = agentDecision;
        }
      } catch (err) {
        console.log(`[MavunoAgent] Agent planning note: ${err.message}. Proceeding with extraction.`);
      }

      // 6. Extract real 10-column observations from KAMIS
      let observationsToProcess = [];

      if (Array.isArray(rawObservationsInput) && rawObservationsInput.length > 0) {
        observationsToProcess = rawObservationsInput;
      } else {
        // Step A: Extract live entries from active market page (up to 100 per page)
        const generalTableRes = await session.fetchMarketTable({ perPage: 100 });
        const generalExtract = await extractionTools.extractProductTable({ rawContent: generalTableRes.html });

        if (generalExtract.success && generalExtract.rows.length > 0) {
          observationsToProcess.push(...generalExtract.rows);
        }

        // Step B: For top priority staples (Maize, Tomatoes, Cabbages, Potatoes, Beans, Rice),
        // ensure specific commodity market prices are extracted if not already well-represented
        const stapleKeywords = ['maize', 'tomato', 'cabbage', 'potato', 'beans', 'rice', 'sorghum'];
        const targetProducts = (skimResult.commodities || [])
          .filter((p) => stapleKeywords.some((kw) => p.name.toLowerCase().includes(kw)))
          .slice(0, 5);

        for (const prod of targetProducts) {
          // Check if we already have sufficient rows for this commodity
          const existingCount = observationsToProcess.filter((r) =>
            r.commodity && r.commodity.toLowerCase().includes(prod.name.toLowerCase().split(' ')[0])
          ).length;

          if (existingCount < 5) {
            try {
              const prodTableRes = await session.fetchMarketTable({ productId: prod.id, perPage: 30 });
              const prodExtract = await extractionTools.extractProductTable({ rawContent: prodTableRes.html });
              if (prodExtract.success && prodExtract.rows.length > 0) {
                observationsToProcess.push(...prodExtract.rows);
              }
            } catch (pErr) {
              console.warn(`[MavunoAgent] Warning fetching product ${prod.name} (id: ${prod.id}): ${pErr.message}`);
            }
          }
        }
      }

      console.log(`[MavunoAgent] Total raw observations extracted from KAMIS: ${observationsToProcess.length}`);

      let foundCount = observationsToProcess.length;
      let savedCount = 0;
      let rejectedCount = 0;

      const validRecordsToSave = [];

      for (const raw of observationsToProcess) {
        const extraction = await extractionTools.extractPriceFields({ rawRow: raw });
        if (!extraction.success) {
          rejectedCount++;
          continue;
        }

        const normalized = processingTools.normalizePriceRecord({
          ...extraction.extracted,
          syncRunId,
          sourceUrl: session.currentUrl || 'https://kamis.kilimo.go.ke/site/market',
        });

        const validation = processingTools.validatePriceRecord(normalized);
        if (!validation.isValid) {
          rejectedCount++;
          continue;
        }

        validRecordsToSave.push(normalized);
      }

      // Deduplicate by commodity + market + unit + observedDate
      const deduplication = processingTools.deduplicateRecords(validRecordsToSave);
      const finalRecords = deduplication.uniqueRecords;
      rejectedCount += deduplication.duplicateCount;

      console.log(`[MavunoAgent] Valid normalized records to persist: ${finalRecords.length}`);

      // 7. Persist truthful observations to MongoDB (MarketData & MarketPrice)
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        for (const record of finalRecords) {
          try {
            // Save to dedicated MarketData collection
            await MarketData.create(record);

            // Upsert into general MarketPrice collection to update farmer dashboard and ticker
            const displayPrice = record.retailPrice || record.wholesalePrice;
            if (displayPrice) {
              await MarketPrice.updateOne(
                {
                  cropName: record.commodity,
                  market: record.market,
                },
                {
                  $set: {
                    cropName: record.commodity,
                    market: record.market,
                    county: record.county,
                    price: displayPrice,
                    minimumPrice: record.wholesalePrice || displayPrice,
                    maximumPrice: record.retailPrice || displayPrice,
                    unit: record.unit,
                    currency: 'KES',
                    source: 'OTHER',
                    provider: 'KAMIS (MavunoAgent)',
                    observedAt: record.observedDate,
                    retrievedAt: new Date(),
                  },
                },
                { upsert: true }
              );
            }

            savedCount++;
          } catch (dbErr) {
            rejectedCount++;
          }
        }
      } else {
        console.log('[MavunoAgent] MongoDB not connected; records held in memory.');
        savedCount = finalRecords.length;
      }

      await session.close();

      const completedAt = new Date();
      if (syncRunRecord.save) {
        syncRunRecord.status = SyncStatus.COMPLETED;
        syncRunRecord.completedAt = completedAt;
        syncRunRecord.recordsFound = foundCount;
        syncRunRecord.recordsSaved = savedCount;
        syncRunRecord.recordsRejected = rejectedCount;
        await syncRunRecord.save();
      } else {
        syncRunRecord.status = SyncStatus.COMPLETED;
        syncRunRecord.recordsFound = foundCount;
        syncRunRecord.recordsSaved = savedCount;
        syncRunRecord.recordsRejected = rejectedCount;
      }

      return {
        success: true,
        agentName: 'MavunoAgent',
        model: agentService.getModel(),
        syncRunId,
        status: SyncStatus.COMPLETED,
        recordsFound: foundCount,
        recordsSaved: savedCount,
        recordsRejected: rejectedCount,
      };
    } catch (err) {
      await session.close();
      return this.failRun(syncRunRecord, 'EXECUTION_ERROR', err.message);
    }
  }

  async failRun(syncRunRecord, errorCode, errorMessage) {
    const completedAt = new Date();
    if (syncRunRecord && syncRunRecord.save) {
      syncRunRecord.status = SyncStatus.FAILED;
      syncRunRecord.completedAt = completedAt;
      syncRunRecord.errorCode = errorCode;
      syncRunRecord.errorMessage = errorMessage;
      await syncRunRecord.save();
    } else if (syncRunRecord) {
      syncRunRecord.status = SyncStatus.FAILED;
      syncRunRecord.errorCode = errorCode;
      syncRunRecord.errorMessage = errorMessage;
    }

    return {
      success: false,
      syncRunId: syncRunRecord?.syncRunId || null,
      status: SyncStatus.FAILED,
      errorCode,
      errorMessage,
    };
  }
}

export const syncWorker = new SyncWorker();
