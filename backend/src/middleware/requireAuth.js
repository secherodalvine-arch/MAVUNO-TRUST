/**
 * requireAuth middleware
 *
 * Validates the JWT access token from the Authorization header.
 * Attaches { userId, role } to req.user on success.
 *
 * SECURITY:
 *  - Token must be in "Bearer <token>" format.
 *  - Expired, malformed, or missing tokens result in 401.
 *  - Token type must be 'access' (refresh tokens cannot be used here).
 *  - Account status is checked against DB to catch suspended accounts.
 */
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User, { AccountStatus } from '../models/User.js';
export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required. Please log in.' },
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = verifyAccessToken(token);
        if (payload.tokenType !== 'access') {
            res.status(401).json({
                success: false,
                error: { message: 'Invalid token type.' },
            });
            return;
        }
        // Verify account is still active in DB
        // (catches suspended accounts even if their token hasn't expired)
        const user = await User.findById(payload.userId).select('accountStatus role');
        if (!user) {
            res.status(401).json({
                success: false,
                error: { message: 'Account not found.' },
            });
            return;
        }
        if (user.accountStatus !== AccountStatus.ACTIVE) {
            res.status(403).json({
                success: false,
                error: { message: 'Account is not active.' },
            });
            return;
        }
        req.user = { userId: payload.userId, role: user.role || payload.role };
        next();
    }
    catch {
        res.status(401).json({
            success: false,
            error: { message: 'Invalid or expired token. Please log in again.' },
        });
    }
};
export { requireRole } from './requireRole.js';
