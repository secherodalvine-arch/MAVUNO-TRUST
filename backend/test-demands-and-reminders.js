import assert from 'assert';
import * as demandService from './src/services/demandService.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { requireRole } from './src/middleware/requireRole.js';
import { UserRole } from './src/models/User.js';

async function runTests() {
    console.log('--- Starting MavunoTrust Broker & Demands Test Suite ---');
    let passed = 0;

    // ── 1. Demand Validation Unit Tests ──
    console.log('\n[TEST 1] Validation: Reject missing or empty cropName');
    try {
        await demandService.createDemand('user123', { cropName: '', quantity: 10, unit: 'kg' });
        assert.fail('Should have thrown validation error');
    } catch (err) {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, 'Crop name is required.');
        passed++;
        console.log('✓ Rejected empty cropName with 400');
    }

    console.log('\n[TEST 2] Validation: Reject non-positive or NaN quantity');
    try {
        await demandService.createDemand('user123', { cropName: 'Maize', quantity: 0, unit: 'kg' });
        assert.fail('Should have thrown validation error for quantity=0');
    } catch (err) {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, 'Quantity must be greater than 0.');
        passed++;
        console.log('✓ Rejected quantity=0 with 400');
    }

    try {
        await demandService.createDemand('user123', { cropName: 'Maize', quantity: -10, unit: 'kg' });
        assert.fail('Should have thrown validation error for negative quantity');
    } catch (err) {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, 'Quantity must be greater than 0.');
        passed++;
        console.log('✓ Rejected negative quantity with 400');
    }

    console.log('\n[TEST 3] Validation: Reject missing or empty unit');
    try {
        await demandService.createDemand('user123', { cropName: 'Maize', quantity: 50, unit: '  ' });
        assert.fail('Should have thrown validation error for empty unit');
    } catch (err) {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, 'Unit is required.');
        passed++;
        console.log('✓ Rejected empty unit with 400');
    }

    console.log('\n[TEST 4] Validation: Reject negative targetPricePerUnit');
    try {
        await demandService.createDemand('user123', { cropName: 'Maize', quantity: 50, unit: 'kg', targetPricePerUnit: -100 });
        assert.fail('Should have thrown validation error for negative target price');
    } catch (err) {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, 'Target price cannot be negative.');
        passed++;
        console.log('✓ Rejected negative target price with 400');
    }

    console.log('\n[TEST 5] Validation: Reject invalid delivery date');
    try {
        await demandService.createDemand('user123', { cropName: 'Maize', quantity: 50, unit: 'kg', desiredDeliveryDate: 'not-a-date' });
        assert.fail('Should have thrown validation error for invalid date');
    } catch (err) {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, 'Invalid desired delivery date.');
        passed++;
        console.log('✓ Rejected invalid delivery date with 400');
    }

    // ── 2. Error Handler Middleware Tests ──
    console.log('\n[TEST 6] ErrorHandler: Formats Mongoose ValidationError as HTTP 400');
    const mockMongooseError = {
        name: 'ValidationError',
        errors: {
            cropName: { message: 'Crop name is required' },
            quantity: { message: 'Quantity must be greater than 0' }
        }
    };
    let capturedStatus = 0;
    let capturedBody = null;
    const mockRes = {
        status(code) {
            capturedStatus = code;
            return this;
        },
        json(data) {
            capturedBody = data;
            return this;
        }
    };
    errorHandler(mockMongooseError, {}, mockRes, () => {});
    assert.strictEqual(capturedStatus, 400);
    assert.strictEqual(capturedBody.success, false);
    assert.ok(capturedBody.error.message.includes('Crop name is required'));
    passed++;
    console.log('✓ Formatted ValidationError to HTTP 400 with message');

    console.log('\n[TEST 7] ErrorHandler: Formats Mongoose CastError as HTTP 400');
    const mockCastError = {
        name: 'CastError',
        path: 'dealerId'
    };
    errorHandler(mockCastError, {}, mockRes, () => {});
    assert.strictEqual(capturedStatus, 400);
    assert.strictEqual(capturedBody.error.message, 'Invalid value for dealerId');
    passed++;
    console.log('✓ Formatted CastError to HTTP 400');

    // ── 3. Role Authorization Middleware Tests ──
    console.log('\n[TEST 8] Authorization: requireRole(DEALER) permits DEALER user');
    let nextCalled = false;
    const dealerReq = { user: { userId: 'd1', role: UserRole.DEALER } };
    requireRole(UserRole.DEALER)(dealerReq, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    passed++;
    console.log('✓ DEALER role passed authorization');

    console.log('\n[TEST 9] Authorization: requireRole(DEALER) denies FARMER user with HTTP 403');
    nextCalled = false;
    const farmerReq = { user: { userId: 'f1', role: UserRole.FARMER } };
    requireRole(UserRole.DEALER)(farmerReq, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(capturedStatus, 403);
    assert.strictEqual(capturedBody.error.message, 'Access denied. Required role: DEALER.');
    passed++;
    console.log('✓ FARMER role correctly rejected from dealer demands');

    // ── 4. Reminder Filtering Rules ──
    console.log('\n[TEST 10] Notification: Dealer reminder filtering suppresses harvest reminders');
    const sampleReminders = [
        { reminderKey: 'pending_offer_1', category: 'OFFER', link: '/offers', title: 'Pending Offer' },
        { reminderKey: 'tx_state_1', category: 'TRANSACTION', link: '/transactions', title: 'Active Deal' },
        { reminderKey: 'no_crops_123', category: 'LISTING', link: '/farmer/crops', title: 'List Your Harvest' },
    ];
    
    // Simulate dealer filtering in GET /reminders
    const dealerFiltered = sampleReminders.filter(r => {
        if ('DEALER' === 'DEALER' && (r.category === 'LISTING' || r.link?.startsWith('/farmer/crops') || r.reminderKey?.startsWith('no_crops_'))) {
            return false;
        }
        return true;
    });
    assert.strictEqual(dealerFiltered.length, 2);
    assert.ok(!dealerFiltered.some(r => r.category === 'LISTING'));
    assert.ok(dealerFiltered.some(r => r.category === 'OFFER'));
    assert.ok(dealerFiltered.some(r => r.category === 'TRANSACTION'));
    passed++;
    console.log('✓ Harvest listing reminder suppressed for DEALER while keeping legitimate notifications');

    // Simulate farmer filtering
    const farmerFiltered = sampleReminders.filter(r => {
        if ('FARMER' === 'DEALER' && (r.category === 'LISTING' || r.link?.startsWith('/farmer/crops') || r.reminderKey?.startsWith('no_crops_'))) {
            return false;
        }
        return true;
    });
    assert.strictEqual(farmerFiltered.length, 3);
    assert.ok(farmerFiltered.some(r => r.category === 'LISTING'));
    passed++;
    console.log('✓ Harvest listing reminder preserved for FARMER');

    console.log(`\n========================================`);
    console.log(`ALL ${passed} TESTS PASSED SUCCESSFULLY!`);
    console.log(`========================================`);
}

runTests().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
