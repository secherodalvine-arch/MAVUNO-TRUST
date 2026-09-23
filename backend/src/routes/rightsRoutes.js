import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getRightsContent, askGemini, submitRemedy, getMyComplaints } from '../controllers/rightsController.js';
const router = Router();
// Protected rights endpoints
router.get('/', requireAuth, getRightsContent);
router.post('/ask', requireAuth, askGemini);
router.post('/remedy', requireAuth, submitRemedy);
router.get('/complaints', requireAuth, getMyComplaints);
export default router;
