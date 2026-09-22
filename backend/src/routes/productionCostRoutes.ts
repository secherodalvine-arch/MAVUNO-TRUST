import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { UserRole } from '../models/User';
import { productionCostController } from '../controllers/productionCostController';

const router = Router();

// Protect all routes with authentication and require FARMER role
router.use(requireAuth);
router.use(requireRole(UserRole.FARMER));

// Routes for production cost calculator
router.get('/', productionCostController.getMyRecords);
router.post('/', productionCostController.createRecord);
router.get('/:id', productionCostController.getRecordById);
router.patch('/:id', productionCostController.updateRecord);
router.delete('/:id', productionCostController.deleteRecord);

export default router;
