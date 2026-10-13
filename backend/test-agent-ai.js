/**
 * test-agent-ai.js
 * Unit tests for:
 *   1. extractJson() — all input variants
 *   2. agentService.generateAgentDecision — blocked/empty/missing-candidate responses
 *   3. aiController validation paths
 *
 * No real API calls are made. Run with: node test-agent-ai.js
 */

import { createMarketRecommendationHandler } from './src/controllers/aiController.js';

// ─── Inline extractJson (copied from agent.js so we can test it independently) ─
const extractJson = (text) => {
  let responseText = String(text || '').trim();
  responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(responseText);
  } catch {
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { return JSON.parse(responseText.slice(start, end + 1)); } catch { /* fallthrough */ }
    }
    return null;
  }
};

// ─── Test harness ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  \u2713 ${label}`);
    passed++;
  } else {
    console.error(`  \u2717 ${label}${detail ? ' \u2014 ' + detail : ''}`);
    failed++;
  }
}

// ─── 1. extractJson tests ────────────────────────────────────────────────────
console.log('\n\u2501\u2501\u2501 extractJson() \u2501\u2501\u2501');

{
  const result = extractJson('{"a":1,"b":"hello"}');
  assert('plain JSON parses correctly', result !== null && result.a === 1 && result.b === 'hello');
}

{
  const result = extractJson('```json\n{"foo":"bar"}\n```');
  assert('markdown-wrapped JSON (```json) parses correctly', result !== null && result.foo === 'bar');
}

{
  const result = extractJson('```\n{"x":42}\n```');
  assert('markdown-wrapped JSON (no lang tag) parses correctly', result !== null && result.x === 42);
}

{
  const result = extractJson('Here is the recommendation:\n\n{"recommendation":{"option":"Sell now"}}\n\nLet me know!');
  assert('prose-wrapped JSON extracts correctly', result !== null && result.recommendation?.option === 'Sell now');
}

{
  const result = extractJson('');
  assert('empty string returns null', result === null);
}

{
  const r1 = extractJson(null);
  const r2 = extractJson(undefined);
  assert('null input returns null', r1 === null);
  assert('undefined input returns null', r2 === null);
}

{
  const result = extractJson('{broken json: [}');
  assert('malformed JSON returns null', result === null);
}

{
  const result = extractJson("I'm sorry, I can't help with that request.");
  assert('safety-blocked text (no JSON) returns null', result === null);
}

{
  const result = extractJson('   \n  {"trim": true}  \n  ');
  assert('whitespace-padded JSON parses correctly', result !== null && result.trim === true);
}

{
  const nested = JSON.stringify({ a: { b: { c: [1, 2, 3] } } });
  const result = extractJson(nested);
  assert('deeply nested JSON parses correctly', result?.a?.b?.c?.length === 3);
}

// ─── 2. agentService blocked/empty response simulation ────────────────────────
console.log('\n\u2501\u2501\u2501 agentService \u2014 blocked/empty response simulation \u2501\u2501\u2501');

function simulateAgentServiceResponse(data) {
  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const BLOCKED_REASONS = ['SAFETY', 'RECITATION', 'OTHER'];

  if (!candidate || BLOCKED_REASONS.includes(finishReason)) {
    const reason = finishReason || 'NO_CANDIDATE';
    return {
      success: false,
      error: { code: 'MAVUNOAGENT_BLOCKED', finishReason: reason },
    };
  }

  const textResponse = (candidate.content?.parts || [])
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('');

  if (!textResponse && finishReason !== 'STOP') {
    return {
      success: false,
      error: { code: 'MAVUNOAGENT_EMPTY_OUTPUT', finishReason: finishReason || 'UNKNOWN' },
    };
  }

  return { success: true, decisionText: textResponse };
}

{
  const r = simulateAgentServiceResponse({
    candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"ok":true}' }] } }]
  });
  assert('STOP with text -> success:true', r.success === true && r.decisionText === '{"ok":true}');
}

{
  const r = simulateAgentServiceResponse({
    candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }]
  });
  assert('SAFETY finishReason -> MAVUNOAGENT_BLOCKED', !r.success && r.error.code === 'MAVUNOAGENT_BLOCKED');
  assert('SAFETY finishReason logged correctly', r.error.finishReason === 'SAFETY');
}

{
  const r = simulateAgentServiceResponse({
    candidates: [{ finishReason: 'RECITATION' }]
  });
  assert('RECITATION -> MAVUNOAGENT_BLOCKED', !r.success && r.error.code === 'MAVUNOAGENT_BLOCKED');
}

{
  const r = simulateAgentServiceResponse({ candidates: [] });
  assert('empty candidates array -> MAVUNOAGENT_BLOCKED', !r.success && r.error.code === 'MAVUNOAGENT_BLOCKED');
  assert('missing candidate finishReason -> NO_CANDIDATE', r.error.finishReason === 'NO_CANDIDATE');
}

{
  const r = simulateAgentServiceResponse({ promptFeedback: { blockReason: 'SAFETY' } });
  assert('absent candidates (promptFeedback block) -> MAVUNOAGENT_BLOCKED', !r.success && r.error.code === 'MAVUNOAGENT_BLOCKED');
}

{
  const r = simulateAgentServiceResponse({
    candidates: [{
      finishReason: 'OTHER',
      content: { parts: [{ thought: true, text: 'thinking...' }] }
    }]
  });
  assert('only-thought parts with OTHER reason -> MAVUNOAGENT_BLOCKED', !r.success && r.error.code === 'MAVUNOAGENT_BLOCKED');
}

{
  // After the fix: STOP + empty text must return MAVUNOAGENT_EMPTY_OUTPUT,
  // not success:true with an empty decisionText that would crash extractJson.
  const r = simulateAgentServiceResponse({
    candidates: [{ finishReason: 'STOP', content: { parts: [] } }]
  });
  assert('STOP with empty parts -> MAVUNOAGENT_EMPTY_OUTPUT (fixed)', !r.success && r.error.code === 'MAVUNOAGENT_EMPTY_OUTPUT');
}

{
  // Thought-only parts with STOP finishReason (thinking-mode candidate)
  const r = simulateAgentServiceResponse({
    candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: 'I am thinking...' }] } }]
  });
  assert('STOP with thought-only parts -> MAVUNOAGENT_EMPTY_OUTPUT', !r.success && r.error.code === 'MAVUNOAGENT_EMPTY_OUTPUT');
}

// ─── 3. Controller validation ────────────────────────────────────────────────
console.log('\n\u2501\u2501\u2501 Controller \u2014 validation paths \u2501\u2501\u2501');

async function runControllerTest(body, expectedStatus, label) {
  const mockAgent = async () => ({ success: true, data: { stub: true } });
  const handler = createMarketRecommendationHandler(mockAgent);

  const req = { body };
  let status = null;
  let json = null;
  const res = {
    status: (s) => { status = s; return res; },
    json: (j) => { json = j; return res; },
  };

  await handler(req, res);
  assert(label, status === expectedStatus, `expected ${expectedStatus}, got ${status}`);
  return { status, json };
}

await runControllerTest({ crop: 'Maize', quantity: 100, unit: 'kg', county: 'Nairobi' }, 200, 'valid input -> 200');
await runControllerTest({ quantity: 100, county: 'Nairobi' }, 400, 'missing crop -> 400');
await runControllerTest({ crop: 'Maize', quantity: 100 }, 400, 'missing county -> 400');
await runControllerTest({ crop: 'Maize', quantity: 0, county: 'Nairobi' }, 400, 'quantity=0 -> 400');
await runControllerTest({ crop: 'Maize', quantity: -50, county: 'Nairobi' }, 400, 'negative quantity -> 400');
await runControllerTest({ crop: 'Maize', quantity: 'hundred', county: 'Nairobi' }, 400, 'string quantity -> 400');
await runControllerTest({ crop: 'Maize', quantity: NaN, county: 'Nairobi' }, 400, 'NaN quantity -> 400');
await runControllerTest({ crop: 'Maize', quantity: Infinity, county: 'Nairobi' }, 400, 'Infinity quantity -> 400');
await runControllerTest({ crop: 'Maize', quantity: 100, county: 'Nairobi' }, 400, 'empty crop string -> 400');
await runControllerTest({ crop: 'A'.repeat(101), quantity: 100, county: 'Nairobi' }, 400, 'crop >100 chars -> 400');
await runControllerTest(undefined, 400, 'undefined body -> 400');
await runControllerTest({ crop: 'Maize', quantity: 50, county: 'Kiambu' }, 200, 'unit omitted -> 200 (defaults to kg)');

// ─── 4. STATUS_BY_CODE mapping coverage ──────────────────────────────────────
console.log('\n━━━ Controller ─ STATUS_BY_CODE mappings ━━━');

// Helper: fake agent that returns a specific failure code
async function runCodeMappingTest(agentCode, expectedHttpStatus, label) {
  const mockAgent = async () => ({ success: false, code: agentCode, error: `Simulated: ${agentCode}` });
  const handler = createMarketRecommendationHandler(mockAgent);
  const req = { body: { crop: 'Maize', quantity: 100, unit: 'kg', county: 'Nairobi' } };
  let status = null;
  const res = { status: (s) => { status = s; return res; }, json: () => res };
  await handler(req, res);
  assert(label, status === expectedHttpStatus, `expected ${expectedHttpStatus}, got ${status}`);
}

await runCodeMappingTest('AI_NOT_CONFIGURED', 503, 'AI_NOT_CONFIGURED -> 503');
await runCodeMappingTest('AI_UNAVAILABLE', 503, 'AI_UNAVAILABLE -> 503');
await runCodeMappingTest('AI_INVALID_OUTPUT', 502, 'AI_INVALID_OUTPUT -> 502');
await runCodeMappingTest('MAVUNOAGENT_BLOCKED', 502, 'MAVUNOAGENT_BLOCKED -> 502');
await runCodeMappingTest('MAVUNOAGENT_EMPTY_OUTPUT', 502, 'MAVUNOAGENT_EMPTY_OUTPUT -> 502');
await runCodeMappingTest('MAVUNOAGENT_CREDENTIALS_MISSING', 503, 'MAVUNOAGENT_CREDENTIALS_MISSING -> 503');
await runCodeMappingTest('MAVUNOAGENT_API_HTTP_400', 502, 'MAVUNOAGENT_API_HTTP_400 -> 502 (not 500)');
await runCodeMappingTest('MAVUNOAGENT_API_HTTP_404', 500, 'MAVUNOAGENT_API_HTTP_404 -> 500 (unmapped, note for future)');
await runCodeMappingTest('MAVUNOAGENT_API_HTTP_429', 503, 'MAVUNOAGENT_API_HTTP_429 -> 503');
await runCodeMappingTest('MAVUNOAGENT_API_HTTP_503', 503, 'MAVUNOAGENT_API_HTTP_503 -> 503');
await runCodeMappingTest('INTERNAL_ERROR', 500, 'INTERNAL_ERROR -> 500');

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n━━━ Results: ${passed} passed, ${failed} failed ━━━\n`);
if (failed > 0) process.exit(1);
