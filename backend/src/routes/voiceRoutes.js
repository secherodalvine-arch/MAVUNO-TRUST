import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { streamAudio, getVoiceConfig, getCustomerSupportVoiceConfig } from '../controllers/voiceController.js';
const router = Router();
// Homepage voice agent config
router.get('/config', getVoiceConfig);
// Dedicated Customer Support voice agent config
router.get('/customer-support/config', getCustomerSupportVoiceConfig);
// Protected voice endpoints (accessible to authenticated users)
router.get('/play', requireAuth, streamAudio);
export default router;
