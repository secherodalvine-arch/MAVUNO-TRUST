import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { streamAudio } from '../controllers/voiceController';

const router = Router();

// Protected voice endpoints (accessible to authenticated users)
router.get('/play', requireAuth, streamAudio);

export default router;
