import { productionCostService } from '../services/productionCostService.js';
import AuditLog, { AuditAction, AuditResourceType } from '../models/AuditLog.js';

export class ProductionCostController {
    /**
     * Get all production cost records for the authenticated farmer.
     */
    async getMyRecords(req, res, next) {
        try {
            const farmerId = req.user.userId;
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
        }
        catch (error) {
            next(error);
        }
    }

    /**
     * Create a new production cost record for the authenticated farmer.
     */
    async createRecord(req, res, next) {
        try {
            const farmerId = req.user.userId;
            const data = req.body;
            // Verify calculations don't throw an error before saving
            productionCostService.calculateMetrics(data);
            const record = await productionCostService.createRecord(farmerId, data);
            const metrics = productionCostService.calculateMetrics(record);
            await AuditLog.create({
                actorId: farmerId,
                actorRole: req.user.role || 'FARMER',
                action: AuditAction.PRODUCTION_COST_CREATED,
                resourceType: AuditResourceType.PRODUCTION_COST,
                resourceId: record._id.toString(),
                details: `Created a production cost record for ${data.cropName}`,
                ipAddress: req.ip,
            }).catch(console.error);
            res.status(201).json({ success: true, data: { record, metrics } });
        }
        catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific record by ID.
     */
    async getRecordById(req, res, next) {
        try {
            const farmerId = req.user.userId;
            const { id } = req.params;
            const record = await productionCostService.getRecordById(id, farmerId);
            if (!record) {
                res.status(404).json({ success: false, error: { message: 'Record not found' } });
                return;
            }
            const metrics = productionCostService.calculateMetrics(record);
            res.status(200).json({ success: true, data: { record, metrics } });
        }
        catch (error) {
            next(error);
        }
    }

    /**
     * Update a specific record by ID.
     */
    async updateRecord(req, res, next) {
        try {
            const farmerId = req.user.userId;
            const { id } = req.params;
            const data = req.body;
            const existingRecord = await productionCostService.getRecordById(id, farmerId);
            if (!existingRecord) {
                res.status(404).json({ success: false, error: { message: 'Record not found' } });
                return;
            }
            const updatedRecord = await productionCostService.updateRecord(id, farmerId, data);
            await AuditLog.create({
                actorId: farmerId,
                actorRole: req.user.role || 'FARMER',
                action: AuditAction.PRODUCTION_COST_UPDATED,
                resourceType: AuditResourceType.PRODUCTION_COST,
                resourceId: id,
                details: `Updated production cost record for ${updatedRecord?.cropName}`,
                ipAddress: req.ip,
            }).catch(console.error);
            const metrics = updatedRecord ? productionCostService.calculateMetrics(updatedRecord) : null;
            res.status(200).json({ success: true, data: { record: updatedRecord, metrics } });
        }
        catch (error) {
            next(error);
        }
    }

    /**
     * Delete a specific record by ID.
     */
    async deleteRecord(req, res, next) {
        try {
            const farmerId = req.user.userId;
            const { id } = req.params;
            const success = await productionCostService.deleteRecord(id, farmerId);
            if (!success) {
                res.status(404).json({ success: false, error: { message: 'Record not found' } });
                return;
            }
            await AuditLog.create({
                actorId: farmerId,
                actorRole: req.user.role || 'FARMER',
                action: AuditAction.PRODUCTION_COST_DELETED,
                resourceType: AuditResourceType.PRODUCTION_COST,
                resourceId: id,
                details: `Deleted a production cost record`,
                ipAddress: req.ip,
            }).catch(console.error);
            res.status(200).json({ success: true, data: {} });
        }
        catch (error) {
            next(error);
        }
    }
}

export const productionCostController = new ProductionCostController();
