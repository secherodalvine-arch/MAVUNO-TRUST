import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserRole } from '../models/User.js';
import { agentService, syncWorker, scheduler } from '../agents/mavunoagent/index.js';
import MarketSyncRun from '../models/MarketSyncRun.js';

const router = Router();

/**
 * GET /api/admin/agent/status
 * Admin-only inspection of MavunoAgent market data retrieval status and history.
 */
router.get('/status', requireAuth, requireRole(UserRole.ADMIN), async (_req, res, next) => {
  try {
    const agentStatus = agentService.getStatus();
    const schedulerStatus = scheduler.getStatus();

    let lastSync = null;
    try {
      lastSync = await MarketSyncRun.findOne().sort({ createdAt: -1 }).lean();
    } catch (err) {
      lastSync = null;
    }

    res.json({
      success: true,
      data: {
        agentName: 'MavunoAgent',
        agentStatus,
        schedulerStatus,
        lastSync,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/agent/sync
 * Admin-only manual trigger for MavunoAgent sync worker.
 */
router.post('/sync', requireAuth, requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    const { sampleObservations } = req.body || {};
    const result = await syncWorker.runSync(sampleObservations || null);
    res.json({ success: result.success, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
