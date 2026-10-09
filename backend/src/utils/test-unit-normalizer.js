import assert from 'assert';
import { normalizeMarketPrice } from './unitNormalizer.js';

function runTests() {
    console.log('--- TEST: Unit Normalizer ---');
    
    const base = {
        market: 'Test',
        commodity: 'Test',
        date: '2026-10-09'
    };

    // 1. KES price per kilogram
    const t1 = normalizeMarketPrice({ ...base, price: 100, unit: 'KG' });
    assert.strictEqual(t1.normalizationStatus, 'SUCCESS');
    assert.strictEqual(t1.normalizedPricePerKg, 100);
    assert.strictEqual(t1.normalizedCurrency, 'KES');

    // 2. KES price per metric tonne
    const t2 = normalizeMarketPrice({ ...base, price: 50000, unit: 'tonne' });
    assert.strictEqual(t2.normalizationStatus, 'SUCCESS');
    assert.strictEqual(t2.normalizedPricePerKg, 50);

    // 3. A bag with an explicitly established 50 kg weight
    const t3 = normalizeMarketPrice({ ...base, price: 2500, unit: '50 kg bag' });
    assert.strictEqual(t3.normalizationStatus, 'SUCCESS');
    assert.strictEqual(t3.normalizedPricePerKg, 50);

    // 4. A bag with an explicitly established 90 kg weight
    const t4 = normalizeMarketPrice({ ...base, wholesalePrice: 2700, unit: '90KG Bag' });
    assert.strictEqual(t4.normalizationStatus, 'SUCCESS');
    assert.strictEqual(t4.normalizedPricePerKg, 30);
    
    // 5. Generic bag with unknown weight
    const t5 = normalizeMarketPrice({ ...base, price: 2000, unit: 'bag' });
    assert.strictEqual(t5.normalizationStatus, 'FAILED');
    assert.strictEqual(t5.normalizedPricePerKg, null);
    assert(t5.normalizationLimitation.includes('Ambiguous unit'));
    assert.strictEqual(t5.price, 2000); // Original value preserved

    // 6. Missing, zero, negative, NaN or infinite price
    const t6 = normalizeMarketPrice({ ...base, price: -100, unit: 'KG' });
    assert.strictEqual(t6.normalizationStatus, 'FAILED');
    assert.strictEqual(t6.normalizedPricePerKg, null);
    assert(t6.normalizationLimitation.includes('Price is missing'));
    
    const t6b = normalizeMarketPrice({ ...base, price: 0, unit: 'KG' });
    assert.strictEqual(t6b.normalizationStatus, 'FAILED');
    assert.strictEqual(t6b.normalizedPricePerKg, null);

    // 7. Missing, zero, negative or invalid package weight
    const t7 = normalizeMarketPrice({ ...base, price: 1000, unit: '0 kg bag' });
    assert.strictEqual(t7.normalizationStatus, 'FAILED');
    assert.strictEqual(t7.normalizedPricePerKg, null);

    // 8. Unknown or ambiguous units
    const t8 = normalizeMarketPrice({ ...base, price: 1000, unit: 'crate' });
    assert.strictEqual(t8.normalizationStatus, 'FAILED');
    assert(t8.normalizationLimitation.includes('Ambiguous unit'));

    const t8b = normalizeMarketPrice({ ...base, price: 100, unit: 'randomtext' });
    assert.strictEqual(t8b.normalizationStatus, 'FAILED');
    assert(t8b.normalizationLimitation.includes('Unknown or unsupported unit'));

    // 9. Non-KES currency without an approved conversion mechanism
    const t9 = normalizeMarketPrice({ ...base, price: 30, unit: 'KG', currency: 'USD' });
    assert.strictEqual(t9.normalizationStatus, 'FAILED');
    assert.strictEqual(t9.normalizedPricePerKg, null);
    assert(t9.normalizationLimitation.includes('Currency \'USD\' is not supported'));

    // 10. A variety description containing numbers that must not be mistaken for package weight.
    // The utility only looks at unit, not variety, so if we pass variety with numbers and a generic unit, it should fail.
    const t10 = normalizeMarketPrice({ ...base, variety: 'IR-64', price: 1000, unit: 'bag' });
    assert.strictEqual(t10.normalizationStatus, 'FAILED');
    assert.strictEqual(t10.normalizedPricePerKg, null);

    // 11. floating-point tolerance check
    const t11 = normalizeMarketPrice({ ...base, price: 3200, unit: '90KG Bag' });
    assert.strictEqual(t11.normalizationStatus, 'SUCCESS');
    assert(Math.abs(t11.normalizedPricePerKg - 35.5556) < 0.001);

    // Check that original properties are maintained
    assert.strictEqual(t1.market, 'Test');
    assert.strictEqual(t1.date, '2026-10-09');

    // 12. WFP/HDX observation using `value` as its numeric price field
    const t12 = normalizeMarketPrice({ ...base, value: 50, unit: 'kg', currency: 'KES' });
    assert.strictEqual(t12.normalizationStatus, 'SUCCESS');
    assert.strictEqual(t12.normalizedPricePerKg, 50);
    assert.strictEqual(t12.normalizedCurrency, 'KES');
    assert.strictEqual(t12.value, 50);

    // 13. KAMIS observation containing both wholesalePrice and retailPrice
    const t13 = normalizeMarketPrice({ ...base, wholesalePrice: 3200, retailPrice: 3500, unit: '90KG Bag' });
    assert.strictEqual(t13.normalizationStatus, 'SUCCESS');
    assert(Math.abs(t13.normalizedPricePerKg - 35.5556) < 0.001); // 3200 / 90
    assert.strictEqual(t13.wholesalePrice, 3200);
    assert.strictEqual(t13.retailPrice, 3500); // Preserved unchanged

    console.log('All tests passed successfully.');
}

runTests();
