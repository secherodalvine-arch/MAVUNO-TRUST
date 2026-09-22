import { Types } from 'mongoose';
import ProductionCostRecord, { IProductionCostRecord } from '../models/ProductionCostRecord';

export interface CostBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface ProductionCostMetrics {
  totalCost: number;
  costPerUnit: number;
  breakEvenPrice: number;
  estimatedRevenue: number | null;
  estimatedProfitLoss: number | null;
  costBreakdown: CostBreakdownItem[];
}

export class ProductionCostService {
  /**
   * Calculate financial metrics based on the provided record data.
   */
  public calculateMetrics(record: Partial<IProductionCostRecord>): ProductionCostMetrics {
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

    let estimatedRevenue: number | null = null;
    let estimatedProfitLoss: number | null = null;

    if (expectedSellingPrice !== undefined && expectedSellingPrice !== null && expectedSellingPrice >= 0) {
      estimatedRevenue = Number((expectedSellingPrice * expectedQuantity).toFixed(2));
      estimatedProfitLoss = Number((estimatedRevenue - totalCost).toFixed(2));
    }

    const costBreakdown: CostBreakdownItem[] = [
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
  public calculateWhatIf(totalProductionCost: number, scenarioQuantity: number, scenarioSellingPrice: number) {
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
  public async getRecordsByFarmerId(farmerId: string | Types.ObjectId): Promise<IProductionCostRecord[]> {
    return ProductionCostRecord.find({ farmerId }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves a specific record ensuring ownership.
   */
  public async getRecordById(recordId: string, farmerId: string | Types.ObjectId): Promise<IProductionCostRecord | null> {
    return ProductionCostRecord.findOne({ _id: recordId, farmerId });
  }

  /**
   * Creates a new production cost record.
   */
  public async createRecord(farmerId: string | Types.ObjectId, data: Partial<IProductionCostRecord>): Promise<IProductionCostRecord> {
    const record = new ProductionCostRecord({
      ...data,
      farmerId,
    });
    return record.save();
  }

  /**
   * Updates an existing production cost record.
   */
  public async updateRecord(recordId: string, farmerId: string | Types.ObjectId, data: Partial<IProductionCostRecord>): Promise<IProductionCostRecord | null> {
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
      if ((data as any)[key] !== undefined) {
        (record as any)[key] = (data as any)[key];
      }
    }

    return record.save();
  }

  /**
   * Deletes a production cost record.
   */
  public async deleteRecord(recordId: string, farmerId: string | Types.ObjectId): Promise<boolean> {
    const result = await ProductionCostRecord.deleteOne({ _id: recordId, farmerId });
    return result.deletedCount === 1;
  }
}

export const productionCostService = new ProductionCostService();
