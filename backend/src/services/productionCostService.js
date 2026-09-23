import ProductionCostRecord from '../models/ProductionCostRecord.js';
export class ProductionCostService {
    /**
     * Calculate financial metrics based on the provided record data.
     */
    calculateMetrics(record) {
        const seedCost = record.seedCost || 0;
        const fertilizerCost = record.fertilizerCost || 0;
        const labourCost = record.labourCost || 0;
        const transportCost = record.transportCost || 0;
        const storageCost = record.storageCost || 0;
        const otherCost = record.otherCost || 0;
        const expectedQuantity = record.expectedQuantity || 0;
        const expectedSellingPrice = record.expectedSellingPrice;
        // Prevent calculation if expectedQuantity is invalid to avoid division by zero
        if (expectedQuantity <= 0) {
            throw Object.assign(new Error('Quantity must be greater than zero for calculations.'), { statusCode: 400 });
        }
        const totalCost = seedCost + fertilizerCost + labourCost + transportCost + storageCost + otherCost;
        // cost per unit and break-even price are exactly the same conceptually for this use case
        // rounding to 2 decimal places for safety
        const costPerUnit = Number((totalCost / expectedQuantity).toFixed(2));
        const breakEvenPrice = costPerUnit;
        let estimatedRevenue = null;
        let estimatedProfitLoss = null;
        if (expectedSellingPrice !== undefined && expectedSellingPrice !== null && expectedSellingPrice >= 0) {
            estimatedRevenue = Number((expectedSellingPrice * expectedQuantity).toFixed(2));
            estimatedProfitLoss = Number((estimatedRevenue - totalCost).toFixed(2));
        }
        const costBreakdown = [
            { category: 'Seed/Input costs', amount: seedCost, percentage: totalCost > 0 ? Number(((seedCost / totalCost) * 100).toFixed(1)) : 0 },
            { category: 'Fertilizer/Input costs', amount: fertilizerCost, percentage: totalCost > 0 ? Number(((fertilizerCost / totalCost) * 100).toFixed(1)) : 0 },
            { category: 'Labour costs', amount: labourCost, percentage: totalCost > 0 ? Number(((labourCost / totalCost) * 100).toFixed(1)) : 0 },
            { category: 'Transport costs', amount: transportCost, percentage: totalCost > 0 ? Number(((transportCost / totalCost) * 100).toFixed(1)) : 0 },
            { category: 'Storage costs', amount: storageCost, percentage: totalCost > 0 ? Number(((storageCost / totalCost) * 100).toFixed(1)) : 0 },
            { category: 'Other costs', amount: otherCost, percentage: totalCost > 0 ? Number(((otherCost / totalCost) * 100).toFixed(1)) : 0 },
        ];
        return {
            totalCost: Number(totalCost.toFixed(2)),
            costPerUnit,
            breakEvenPrice,
            estimatedRevenue,
            estimatedProfitLoss,
            costBreakdown,
        };
    }
    /**
     * Calculate What-If scenario metrics (Pure function for testing and backend logic if needed)
     */
    calculateWhatIf(totalProductionCost, scenarioQuantity, scenarioSellingPrice) {
        if (scenarioQuantity <= 0) {
            throw Object.assign(new Error('Quantity must be greater than zero for calculations.'), { statusCode: 400 });
        }
        const costPerUnit = Number((totalProductionCost / scenarioQuantity).toFixed(2));
        const breakEvenPrice = costPerUnit;
        const estimatedRevenue = Number((scenarioSellingPrice * scenarioQuantity).toFixed(2));
        const estimatedProfitLoss = Number((estimatedRevenue - totalProductionCost).toFixed(2));
        return {
            scenarioTotalCost: totalProductionCost,
            scenarioCostPerUnit: costPerUnit,
            scenarioBreakEvenPrice: breakEvenPrice,
            scenarioEstimatedRevenue: estimatedRevenue,
            scenarioEstimatedProfitLoss: estimatedProfitLoss,
        };
    }
    /**
     * Retrieves all production cost records for a specific farmer.
     */
    async getRecordsByFarmerId(farmerId) {
        return ProductionCostRecord.find({ farmerId }).sort({ createdAt: -1 });
    }
    /**
     * Retrieves a specific record ensuring ownership.
     */
    async getRecordById(recordId, farmerId) {
        return ProductionCostRecord.findOne({ _id: recordId, farmerId });
    }
    /**
     * Creates a new production cost record.
     */
    async createRecord(farmerId, data) {
        const record = new ProductionCostRecord({
            ...data,
            farmerId,
        });
        return record.save();
    }
    /**
     * Updates an existing production cost record.
     */
    async updateRecord(recordId, farmerId, data) {
        const record = await ProductionCostRecord.findOne({ _id: recordId, farmerId });
        if (!record) {
            return null;
        }
        // Update only allowed fields
        const allowedUpdates = [
            'cropName', 'expectedQuantity', 'quantityUnit',
            'seedCost', 'fertilizerCost', 'labourCost', 'transportCost', 'storageCost', 'otherCost',
            'expectedSellingPrice', 'notes'
        ];
        for (const key of allowedUpdates) {
            if (data[key] !== undefined) {
                record[key] = data[key];
            }
        }
        return record.save();
    }
    /**
     * Deletes a production cost record.
     */
    async deleteRecord(recordId, farmerId) {
        const result = await ProductionCostRecord.deleteOne({ _id: recordId, farmerId });
        return result.deletedCount === 1;
    }
}
export const productionCostService = new ProductionCostService();
