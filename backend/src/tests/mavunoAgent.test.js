import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  MavunoAgent,
  agentService,
  BrowserSession,
  extractionTools,
  processingTools,
  syncWorker,
  scheduler,
} from '../agents/mavunoagent/index.js';

describe('MavunoAgent Market Extraction Module', () => {
  it('should initialize agentService with Gemini 3.5 Flash configuration', () => {
    const status = agentService.getStatus();
    assert.strictEqual(status.model, 'gemini-3.5-flash');
    assert.strictEqual(typeof status.initialized, 'boolean');
  });

  it('should instantiate MavunoAgent with instructions', () => {
    const agent = new MavunoAgent(agentService);
    const instructions = agent.getSystemInstructions();
    assert.ok(instructions.includes('MavunoAgent'));
    assert.ok(instructions.includes('KAMIS'));
  });

  it('should extract price fields accurately using extractionTools', async () => {
    const rawRow = {
      commodity: 'Dry Maize',
      market: 'Wakulima Market, Nairobi',
      county: 'Nairobi',
      wholesalePrice: 3800,
      retailPrice: 4200,
      unit: '90KG BAG',
    };

    const res = await extractionTools.extractPriceFields({ rawRow });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.extracted.commodity, 'Dry Maize');
    assert.strictEqual(res.extracted.wholesalePrice, 3800);
    assert.strictEqual(res.extracted.retailPrice, 4200);
  });

  it('should normalize and validate price records using processingTools', () => {
    const raw = {
      commodity: ' Rosecoco Beans ',
      market: ' Nyeri Open Market ',
      county: ' Nyeri ',
      wholesalePrice: 9000,
      retailPrice: 9500,
      unit: ' 90kg bag ',
      observedDate: '2026-09-23T00:00:00.000Z',
    };

    const normalized = processingTools.normalizePriceRecord(raw);
    assert.strictEqual(normalized.commodity, 'Rosecoco Beans');
    assert.strictEqual(normalized.unit, '90KG BAG');

    const val = processingTools.validatePriceRecord(normalized);
    assert.strictEqual(val.isValid, true);
  });

  it('should deduplicate repeated market price records', () => {
    const records = [
      { commodity: 'Maize', market: 'Market A', unit: 'KG', observedDate: new Date('2026-09-23') },
      { commodity: 'Maize', market: 'Market A', unit: 'KG', observedDate: new Date('2026-09-23') },
      { commodity: 'Beans', market: 'Market B', unit: 'KG', observedDate: new Date('2026-09-23') },
    ];

    const dedupe = processingTools.deduplicateRecords(records);
    assert.strictEqual(dedupe.uniqueRecords.length, 2);
    assert.strictEqual(dedupe.duplicateCount, 1);
  });

  it('should execute syncWorker pipeline cleanly', async () => {
    const testObservations = [
      {
        commodity: 'Dry Maize',
        market: 'Wakulima Market',
        county: 'Nairobi',
        wholesalePrice: 3800,
        retailPrice: 4100,
        unit: '90KG BAG',
        observedDate: new Date().toISOString(),
      },
    ];

    const result = await syncWorker.runSync(testObservations);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agentName, 'MavunoAgent');
    assert.strictEqual(result.model, 'gemini-3.5-flash');
    assert.strictEqual(result.recordsFound, 1);
  });

  it('should verify 10-minute scheduler interval configuration', () => {
    const status = scheduler.getStatus();
    assert.strictEqual(status.intervalMinutes, 10);
  });
});
