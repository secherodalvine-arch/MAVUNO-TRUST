import { Request, Response, NextFunction } from 'express';
import { productionCostService } from '../services/productionCostService';
import AuditLog from '../models/AuditLog';

export class ProductionCostController {
  
  /**
   * Get all production cost records for the authenticated farmer.
   */
  public async getMyRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = (req as any).user.userId;
      
      const records = await productionCostService.getRecordsByFarmerId(farmerId);
      
      // Calculate metrics on the fly before returning
      const results = records.map(record => {
        const metrics = productionCostService.calculateMetrics(record);
        return {
          record,
          metrics,
        };
      });

      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new production cost record for the authenticated farmer.
   */
  public async createRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = (req as any).user.userId;
      const data = req.body;
      
      // Verify calculations don't throw an error before saving
      productionCostService.calculateMetrics(data);

      const record = await productionCostService.createRecord(farmerId, data);
      const metrics = productionCostService.calculateMetrics(record);

      await AuditLog.create({
        userId: farmerId,
        action: 'CREATE_PRODUCTION_COST',
        details: `Created a production cost record for ${data.cropName}`,
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: { record, metrics } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific record by ID.
   */
  public async getRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = (req as any).user.userId;
      const { id } = req.params;

      const record = await productionCostService.getRecordById(id, farmerId);
      if (!record) {
        res.status(404).json({ success: false, error: { message: 'Record not found' } });
        return;
      }

      const metrics = productionCostService.calculateMetrics(record);

      res.status(200).json({ success: true, data: { record, metrics } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a specific record by ID.
   */
  public async updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = (req as any).user.userId;
      const { id } = req.params;
      const data = req.body;

      // Make sure the data is valid
      const tempRecordForValidation = { ...data, expectedQuantity: data.expectedQuantity || 1 }; // prevent zero validation failure if updating partially without quantity
      // actually, just let mongoose schema validate it or calculateMetrics handle full data 
      // calculateMetrics throws if expectedQuantity <= 0, so if updating, we need the full object

      const existingRecord = await productionCostService.getRecordById(id, farmerId);
      if (!existingRecord) {
        res.status(404).json({ success: false, error: { message: 'Record not found' } });
        return;
      }
      
      const updatedRecord = await productionCostService.updateRecord(id, farmerId, data);
      
      await AuditLog.create({
        userId: farmerId,
        action: 'UPDATE_PRODUCTION_COST',
        details: `Updated production cost record for ${updatedRecord?.cropName}`,
        ipAddress: req.ip,
      });

      const metrics = updatedRecord ? productionCostService.calculateMetrics(updatedRecord) : null;

      res.status(200).json({ success: true, data: { record: updatedRecord, metrics } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a specific record by ID.
   */
  public async deleteRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = (req as any).user.userId;
      const { id } = req.params;

      const success = await productionCostService.deleteRecord(id, farmerId);
      if (!success) {
        res.status(404).json({ success: false, error: { message: 'Record not found' } });
        return;
      }

      await AuditLog.create({
        userId: farmerId,
        action: 'DELETE_PRODUCTION_COST',
        details: `Deleted a production cost record`,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }
}

export const productionCostController = new ProductionCostController();
