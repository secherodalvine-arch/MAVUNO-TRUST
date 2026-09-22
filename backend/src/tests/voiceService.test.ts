import { voiceService } from '../services/voiceService';

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
  console.log('\n🎙️ MavunoTrust Voice Service Test Suite');
  console.log('==================================================================');

  await test('English audio request resolves to the correct English string', () => {
    const text = voiceService.getApprovedText('page_title', 'en');
    if (text !== 'Market Prices') throw new Error(`Expected 'Market Prices', got '${text}'`);
  });

  await test('Kiswahili audio request resolves to the correct Kiswahili string', () => {
    const text = voiceService.getApprovedText('page_title', 'sw');
    if (text !== 'Bei za Soko') throw new Error(`Expected 'Bei za Soko', got '${text}'`);
  });

  await test('Arbitrary/unapproved text strings are rejected with 400', () => {
    let caught = false;
    try {
      voiceService.getApprovedText('invented_trading_advice', 'en');
    } catch (err: any) {
      if (err.statusCode === 400 && err.code === 'UNAPPROVED_TEXT') {
        caught = true;
      }
    }
    if (!caught) throw new Error('Failed to reject unapproved textId');
  });

  await test('Service gracefully handles missing ELEVENLABS_API_KEY without crashing', async () => {
    // Save original if any
    const original = process.env.ELEVENLABS_API_KEY;
    process.env.ELEVENLABS_API_KEY = '';

    let caught = false;
    try {
      await voiceService.generateAudio('page_title', 'en');
    } catch (err: any) {
      if (err.statusCode === 503 && err.code === 'CREDENTIALS_MISSING') {
        caught = true;
      }
    }

    // Restore
    process.env.ELEVENLABS_API_KEY = original;

    if (!caught) throw new Error('Failed to throw 503 when API key is missing');
  });

  console.log('\n==================================================================');
  console.log('Results: All tests passed.\n');
}

runTests();
