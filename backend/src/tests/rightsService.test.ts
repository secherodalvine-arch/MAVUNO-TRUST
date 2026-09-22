import { APPROVED_RIGHTS } from '../data/approvedRights';
import { geminiService } from '../services/geminiService';

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error: any) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${error.message}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('\n⚖️ MavunoTrust Rights Service Test Suite');
  console.log('==================================================================');

  await test('Rights content contains exactly 4 predefined approved items', () => {
    if (APPROVED_RIGHTS.length !== 4) {
      throw new Error(`Expected 4 approved rights, got ${APPROVED_RIGHTS.length}`);
    }
  });

  await test('Unverified sources are strictly marked as unverified', () => {
    const allSafe = APPROVED_RIGHTS.every(r => 
      r.officialSource === 'Official source information will be added after verification.'
    );
    if (!allSafe) {
      throw new Error('An unverified source was improperly marked as official.');
    }
  });

  await test('Gemini service explicitly throws 503 if GEMINI_API_KEY is missing', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '';

    let caught = false;
    try {
      await geminiService.askQuestion('What are my rights?');
    } catch (err: any) {
      if (err.statusCode === 503 && err.code === 'CREDENTIALS_MISSING') {
        caught = true;
      }
    }

    process.env.GEMINI_API_KEY = originalKey;

    if (!caught) {
      throw new Error('Failed to reject Gemini query when API key is missing.');
    }
  });

  console.log('\n==================================================================');
  console.log('Results: All tests passed.\n');
}

runTests();
