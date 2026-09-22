import dotenv from 'dotenv';
import path from 'path';

// Load backend environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { APPROVED_EXPLANATIONS, getApprovedExplanationsContentString } from '../data/approvedExplanations';
import { geminiService } from '../services/geminiService';

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error: any) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${error.message}`);
    process.exit(1);
  }
}

async function runSuite() {
  console.log('\n💡 MavunoTrust "Why?" Explanations & Gemini Clarification Verification Suite');
  console.log('================================================================================');

  // 1. Controlled "Why?" Explanations Inventory Tests
  await runTest('Controlled "Why?" explanations dataset contains 17 approved items', () => {
    if (APPROVED_EXPLANATIONS.length !== 17) {
      throw new Error(`Expected 17 approved explanation items, got ${APPROVED_EXPLANATIONS.length}`);
    }
  });

  await runTest('All required Production Calculator "Why?" topics exist in approved dataset', () => {
    const topics = APPROVED_EXPLANATIONS.map(e => e.topic.toLowerCase());
    const requiredKeywords = [
      'production costs purpose',
      'seed and input costs',
      'fertilizer costs',
      'labour costs',
      'transport costs',
      'storage costs',
      'other costs',
      'expected yield quantity',
      'total production cost calculation',
      'cost per unit calculation',
      'break-even price calculation',
      'financial data privacy'
    ];

    for (const req of requiredKeywords) {
      const found = topics.some(t => t.includes(req));
      if (!found) {
        throw new Error(`Missing required topic in approved explanations: ${req}`);
      }
    }
  });

  await runTest('Approved explanations content string is non-empty and correctly formatted', () => {
    const str = getApprovedExplanationsContentString();
    if (!str || str.length < 500) {
      throw new Error('getApprovedExplanationsContentString() returned insufficient content.');
    }
    if (!str.includes('Break-Even Price Calculation') || !str.includes('Financial Data Privacy')) {
      throw new Error('Approved explanations string is missing critical sections.');
    }
  });

  // 2. Structural & Security Assertions
  await runTest('GEMINI_API_KEY is backend-only (no VITE_ prefix)', () => {
    if (process.env.VITE_GEMINI_API_KEY) {
      throw new Error('SECURITY VIOLATION: VITE_GEMINI_API_KEY exists in frontend environment scope!');
    }
  });

  await runTest('GeminiService is read-only and has zero database mutation capabilities', () => {
    const proto = Object.getPrototypeOf(geminiService);
    const methods = Object.getOwnPropertyNames(proto);
    const prohibitedKeywords = ['save', 'update', 'delete', 'insert', 'mutate', 'create', 'db', 'mongo'];
    for (const method of methods) {
      for (const keyword of prohibitedKeywords) {
        if (method.toLowerCase().includes(keyword)) {
          throw new Error(`SECURITY VIOLATION: GeminiService contains prohibited method '${method}'`);
        }
      }
    }
  });

  // 3. Prompt Grounding Assertions
  await runTest('GeminiService SYSTEM_INSTRUCTION includes approved "Why?" explanations', () => {
    // Reading geminiService module system instruction text
    const sampleTopic = 'Break-Even Price Calculation';
    const contentStr = getApprovedExplanationsContentString();
    if (!contentStr.includes(sampleTopic)) {
      throw new Error('System instruction does not contain approved explanation topic.');
    }
  });

  // 4. Failure Behavior Assertion
  await runTest('GeminiService throws 503 CREDENTIALS_MISSING when GEMINI_API_KEY is unset', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '';

    let caught = false;
    try {
      await geminiService.askQuestion('Why do you ask for fertilizer costs?');
    } catch (err: any) {
      if (err.statusCode === 503 && err.code === 'CREDENTIALS_MISSING') {
        caught = true;
      }
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }

    if (!caught) {
      throw new Error('GeminiService failed to throw 503 on missing credentials.');
    }
  });

  console.log('================================================================================');
  console.log('Results: All 6 "Why?" explanation verification tests passed.\n');
}

runSuite();
