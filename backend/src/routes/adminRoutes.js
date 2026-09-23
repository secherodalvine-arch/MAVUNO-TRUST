import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserRole } from '../models/User.js';
const router = Router();
/**
 * Admin area — all routes require ADMIN role.
 *
 * SECURITY:
 *  - Admin cannot be created via public registration.
 *  - Admin privileges cannot be self-assigned via request body.
 *  - Admin bootstrap process must be performed via secure server-side script.
 *    See: backend/src/scripts/createAdminNote.md
 *
 * Admin dashboard implemented in later steps.
 */
router.get('/dashboard', requireAuth, requireRole(UserRole.ADMIN), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Admin area. Dashboard coming in a future step.',
        data: { role: req.user.role },
    });
});
export default router;
