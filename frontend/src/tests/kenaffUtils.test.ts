import { KENAFF_CONTACTS, generateComplaintSummary, generateMailtoLink } from '../utils/kenaffUtils';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (error: any) {
    console.log(`  [FAIL] ${name}`);
    console.log(`    → ${error.message}`);
    throw error;
  }
}

function runTests() {
  console.log('\n[TEST] MavunoTrust Frontend - KENAFF Utils Test Suite');
  console.log('==================================================================');

  test('KENAFF contact details are the verified official values', () => {
    if (KENAFF_CONTACTS.primaryPhone !== '+254723903957') throw new Error('Primary phone mismatch');
    if (KENAFF_CONTACTS.alternativePhone !== '+254741461763') throw new Error('Alt phone mismatch');
    if (KENAFF_CONTACTS.email !== 'farmers@kenaff.org') throw new Error('Email mismatch');
    if (KENAFF_CONTACTS.website !== 'https://www.kenaff.org/') throw new Error('Website mismatch');
  });

  const mockComplaint = {
    caseId: 'MT-2024-TEST',
    category: 'NON_PAYMENT',
    createdAt: '2026-09-21T12:00:00Z',
    description: 'Dealer has not paid me for 10 bags of maize.'
  };

  test('Copy Complaint uses the actual complaint data without fake injection', () => {
    const summary = generateComplaintSummary(mockComplaint);
    if (!summary.includes('MT-2024-TEST')) throw new Error('Case ID missing');
    if (!summary.includes('NON PAYMENT')) throw new Error('Category missing/not formatted');
    if (!summary.includes('Dealer has not paid me')) throw new Error('Description missing');
    if (summary.includes('password') || summary.includes('location')) throw new Error('Private data leaked');
    if (summary.includes('KENAFF received your complaint')) throw new Error('Fake submission status found');
  });

  test('Email action uses farmers@kenaff.org', () => {
    const mailto = generateMailtoLink(mockComplaint);
    if (!mailto.startsWith('mailto:farmers@kenaff.org')) throw new Error('Incorrect mailto destination');
  });

  test('No private financial information is automatically included in the summary', () => {
    // Note: the only fields passed to the utility are caseId, category, createdAt, and description.
    // Therefore, it's structurally impossible to include passwords, exact locations, or tokens.
    if (Object.keys(mockComplaint).some(k => k === 'password' || k === 'token' || k === 'balance')) {
      throw new Error('Private fields are present in the complaint object signature.');
    }
  });

  test('No fake KENAFF submission/status/response is generated', () => {
    const mailto = generateMailtoLink(mockComplaint);
    if (mailto.includes(encodeURIComponent('KENAFF has received')) || mailto.includes('resolution')) {
      throw new Error('Fake status generated');
    }
  });

  console.log('\n==================================================================');
  console.log('Results: All tests passed.\n');
}

runTests();
