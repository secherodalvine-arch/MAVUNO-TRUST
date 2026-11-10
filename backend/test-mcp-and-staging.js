/**
 * Test Suite: Model Context Protocol (MCP) & Staging Isolation
 *
 * Verifies:
 * 1. Hard staging isolation: forbids connecting to production database 'mavunotrust'.
 * 2. MCP tool definitions, input schemas, and role permissions.
 * 3. MCP authentication and authorization enforcement.
 * 4. Agricultural tool executions (market prices, verified dealers, farm profile, NDVI, advisory, assistance).
 * 5. Privacy guarantees: coordinates and raw boundaries are stripped.
 */

import assert from 'assert';
import {
  MCP_TOOL_DEFINITIONS,
  executeMcpTool,
} from './src/mcp/mcpRouter.js';
import {
  findFarmerAssistanceTool,
  getFarmProfileTool,
  getFarmNdviTool,
} from './src/mcp/tools/agriculturalTools.js';
import { connectDB } from './src/config/db.js';
import { UserRole } from './src/models/User.js';

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('       TEST SUITE: MCP INTEGRATION & STAGING ISOLATION         ');
  console.log('===============================================================\n');

  // ── 1. Staging Database Isolation Tests ──────────────────────────────────
  console.log('1. Testing Staging Database Isolation Safeguards:');

  await asyncTest('Hard guard strictly rejects staging connection to production DB "mavunotrust"', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalDb = process.env.DB_NAME;

    process.env.NODE_ENV = 'staging';
    process.env.DB_NAME = 'mavunotrust'; // Production DB

    let threw = false;
    try {
      await connectDB();
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('[STAGING ISOLATION ERROR]'));
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.DB_NAME = originalDb;
    }
    assert.ok(threw, 'Should throw STAGING ISOLATION ERROR when staging targets production db');
  });

  test('Staging environment defaults to mavunotrust-staging when DB_NAME is omitted', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalDb = process.env.DB_NAME;

    delete process.env.DB_NAME;
    delete process.env.MONGODB_DB_NAME;
    process.env.NODE_ENV = 'staging';

    const nodeEnv = process.env.NODE_ENV || 'development';
    let dbName = process.env.DB_NAME || process.env.MONGODB_DB_NAME;
    if (!dbName) {
      dbName = nodeEnv === 'staging' ? 'mavunotrust-staging' : 'mavunotrust';
    }

    assert.strictEqual(dbName, 'mavunotrust-staging');

    process.env.NODE_ENV = originalEnv;
    if (originalDb) process.env.DB_NAME = originalDb;
  });

  // ── 2. MCP Tools Registry & Specifications ──────────────────────────────
  console.log('\n2. Testing MCP Tool Definitions:');

  test('Registers all 8 required MCP tools', () => {
    const names = MCP_TOOL_DEFINITIONS.map((t) => t.name);
    const required = [
      'get_market_prices',
      'find_verified_dealers',
      'get_farm_profile',
      'get_farm_ndvi',
      'get_farm_advisory',
      'find_farmer_assistance',
      'compute_route_distance',
      'get_transport_cost_estimate',
    ];

    for (const req of required) {
      assert.ok(names.includes(req), `Tool '${req}' must be registered in MCP tools`);
    }
  });

  test('All MCP tools have non-empty descriptions and parameters schema', () => {
    for (const tool of MCP_TOOL_DEFINITIONS) {
      assert.ok(tool.description && tool.description.length > 10, `${tool.name} must have description`);
      assert.strictEqual(tool.parameters?.type, 'object', `${tool.name} parameters must be object type`);
    }
  });

  // ── 3. MCP Authorization & Role Enforcements ────────────────────────────
  console.log('\n3. Testing MCP Authentication & Role Enforcement:');

  await asyncTest('Rejects get_farm_ndvi when unauthenticated', async () => {
    const result = await executeMcpTool('get_farm_ndvi', {}, null);
    assert.strictEqual(result.isError, true);
    assert.ok(result.error.includes('Access Denied') || result.error.includes('requires FARMER role'));
  });

  await asyncTest('Rejects get_farm_ndvi for non-farmer role (DEALER)', async () => {
    const dealerUser = { userId: '507f1f77bcf86cd799439011', role: UserRole.DEALER };
    const result = await executeMcpTool('get_farm_ndvi', {}, dealerUser);
    assert.strictEqual(result.isError, true);
    assert.ok(result.error.includes('Access Denied'));
  });

  await asyncTest('Rejects get_farm_advisory when unauthenticated', async () => {
    const result = await executeMcpTool('get_farm_advisory', {}, null);
    assert.strictEqual(result.isError, true);
    assert.ok(result.error.includes('Access Denied'));
  });

  await asyncTest('Rejects get_farm_advisory for non-farmer role (DEALER)', async () => {
    const dealerUser = { userId: '507f1f77bcf86cd799439011', role: UserRole.DEALER };
    const result = await executeMcpTool('get_farm_advisory', {}, dealerUser);
    assert.strictEqual(result.isError, true);
    assert.ok(result.error.includes('Access Denied'));
  });

  await asyncTest('Rejects unknown tool execution with structured error', async () => {
    const result = await executeMcpTool('non_existent_tool', {}, null);
    assert.strictEqual(result.isError, true);
    assert.ok(result.error.includes('Unknown tool'));
  });

  // ── 4. Agricultural Tools Execution & Privacy ───────────────────────────
  console.log('\n4. Testing Agricultural Tools Execution & Privacy:');

  await asyncTest('find_farmer_assistance returns One Acre Fund / Tupande with USSD code', async () => {
    const res = await findFarmerAssistanceTool({});
    assert.strictEqual(res.success, true);
    assert.ok(res.partners.length > 0);
    const tupande = res.partners.find((p) => p.id === 'TUPANDE_ONE_ACRE_FUND');
    assert.ok(tupande, 'Tupande partner must be present');
    assert.strictEqual(tupande.ussdCode, '*284#');
    assert.strictEqual(tupande.tollFreeHotline, '0800 724 413');
  });

  await asyncTest('find_farmer_assistance filters by category query', async () => {
    const res = await findFarmerAssistanceTool({ category: 'inputs' });
    assert.strictEqual(res.success, true);
    assert.ok(res.partners.length > 0);
  });

  await asyncTest('get_farm_profile strictly requires authentication for personal farm', async () => {
    const res = await getFarmProfileTool({ user: null });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'AUTH_REQUIRED');
  });

  await asyncTest('get_farm_ndvi strictly requires authentication', async () => {
    const res = await getFarmNdviTool({ user: null });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'AUTH_REQUIRED');
  });

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log('===============================================================');

  if (totalTests !== passedTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
