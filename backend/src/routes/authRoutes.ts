import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshTokenHandler,
  requestResetHandler,
  resetPasswordHandler,
} from '../controllers/authController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// ── Rate Limiters ─────────────────────────────────────────────────────────────

// Strict: 10 attempts per 15 minutes for auth-sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, error: { message: 'Too many attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Light: 30 per 15 minutes for token refresh (happens automatically)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      30,
  message:  { success: false, error: { message: 'Too many token refresh attempts.' } },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Routes ────────────────────────────────────────────────────────────────────

// Public — rate limited
router.post('/register', authLimiter, registerHandler);
router.post('/login',    authLimiter, loginHandler);
router.post('/password-reset/request', authLimiter, requestResetHandler);
router.post('/password-reset/confirm', authLimiter, resetPasswordHandler);

// Requires httpOnly refresh cookie
router.post('/refresh', refreshLimiter, refreshTokenHandler);

// Requires valid access token
router.post('/logout', requireAuth, logoutHandler);
router.get('/me',     requireAuth, meHandler);

export default router;
