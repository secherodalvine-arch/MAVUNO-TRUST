import mongoose from 'mongoose';
import assert from 'assert';
import User, { UserRole } from './src/models/User.js';
import DealerProfile from './src/models/DealerProfile.js';
import FarmerCropListing, { ListingStatus } from './src/models/FarmerCropListing.js';
import BuyerDemand, { DemandStatus } from './src/models/BuyerDemand.js';
import * as demandService from './src/services/demandService.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavunotrust_test');
        
        // Clean up previous runs
        await User.deleteMany({ email: { $regex: 'test-demand' } });
        await BuyerDemand.deleteMany({});
        await FarmerCropListing.deleteMany({ additionalNotes: 'test-demand-listing' });

        // Setup test users
        const farmer = await User.create({
            fullName: 'Test Demand Farmer',
            email: 'test-demand-farmer@example.com',
            passwordHash: 'dummy',
            role: UserRole.FARMER,
            accountStatus: 'ACTIVE',
            isEmailVerified: true
        });

        const dealer = await User.create({
            fullName: 'Test Demand Dealer',
            email: 'test-demand-dealer@example.com',
            passwordHash: 'dummy',
            role: UserRole.DEALER,
            accountStatus: 'ACTIVE',
            isEmailVerified: true
        });

        await DealerProfile.create({
            userId: dealer._id,
            displayName: dealer.fullName,
            countiesServed: ['Nakuru', 'Nairobi']
        });

        // 1. Create a farmer listing
        const listing = await FarmerCropListing.create({
            farmerId: farmer._id,
            cropName: 'Maize',
            estimatedQuantity: 50,
            unit: '90kg bags',
            county: 'Nakuru',
            status: ListingStatus.ACTIVE,
            additionalNotes: 'test-demand-listing',
            expectedSellingPeriodStart: new Date('2027-01-01')
        });

        // 2. Create matching demand (direct unit match)
        const d1 = await demandService.createDemand(dealer._id, {
            cropName: 'Maize',
            quantity: 20,
            unit: '90kg bags',
            countiesServed: ['Nakuru'],
            desiredDeliveryDate: new Date('2027-01-10')
        });

        // 3. Create convertible demand (KGs)
        const d2 = await demandService.createDemand(dealer._id, {
            cropName: 'Maize',
            quantity: 900,
            unit: 'kg',
            countiesServed: ['Nakuru']
        });

        // 4. Create unconvertible unit demand
        const d3 = await demandService.createDemand(dealer._id, {
            cropName: 'Maize',
            quantity: 50,
            unit: 'buckets',
            countiesServed: ['Nakuru']
        });

        // 5. Create unmatching crop demand
        const d4 = await demandService.createDemand(dealer._id, {
            cropName: 'Tomatoes',
            quantity: 100,
            unit: 'kg'
        });

        console.log('Testing match logic...');
        const result = await demandService.matchFarmerListingToDemands(listing._id);
        
        console.log(`Found ${result.matches.length} matches for listing ${listing.cropName} (${listing.estimatedQuantity} ${listing.unit})`);
        
        assert.strictEqual(result.matches.length, 3, 'Should find exactly 3 demands for Maize');
        
        // Find d1 in matches
        const m1 = result.matches.find(m => m.demand._id.toString() === d1._id.toString());
        assert.ok(m1, 'Demand 1 should be in matches');
        assert.ok(m1.reasons.some(r => r.includes('Units match perfectly')), 'Should identify perfect unit match');
        
        // Find d2 in matches
        const m2 = result.matches.find(m => m.demand._id.toString() === d2._id.toString());
        assert.ok(m2, 'Demand 2 should be in matches');
        assert.ok(m2.reasons.some(r => r.includes('Units are convertible')), 'Should identify convertible units');
        
        // Find d3 in matches
        const m3 = result.matches.find(m => m.demand._id.toString() === d3._id.toString());
        assert.ok(m3, 'Demand 3 should be in matches');
        assert.ok(m3.limitations.some(l => l.includes('Cannot directly compare units')), 'Should identify unconvertible units');
        
        console.log('All tests passed successfully!');

        // Clean up
        await User.deleteMany({ _id: { $in: [farmer._id, dealer._id] } });
        await DealerProfile.deleteOne({ userId: dealer._id });
        await BuyerDemand.deleteMany({ dealerId: dealer._id });
        await FarmerCropListing.deleteOne({ _id: listing._id });

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

runTest();
