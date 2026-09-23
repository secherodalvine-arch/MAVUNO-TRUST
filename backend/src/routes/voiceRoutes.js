import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { streamAudio, getVoiceConfig } from '../controllers/voiceController.js';
const router = Router();
// Public config for frontend widget
router.get('/config', getVoiceConfig);
// Protected voice endpoints (accessible to authenticated users)
router.get('/play', requireAuth, streamAudio);
export default router;
