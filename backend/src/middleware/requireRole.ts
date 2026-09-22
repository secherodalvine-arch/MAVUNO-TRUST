/**
 * requireRole middleware
 *
 * Must be used AFTER requireAuth.
 *
 * Ensures the authenticated user's role matches one of the allowed roles.
 * Role is read from req.user (set by requireAuth) — NOT from request body.
 *
 * SECURITY:
 *  - A user cannot elevate their role by sending role:ADMIN in the request body.
 *  - Role enforcement happens server-side, not only in the frontend.
 *
 * Usage:
 *   router.get('/admin/...', requireAuth, requireRole('ADMIN'), handler)
 *   router.get('/farmer/...', requireAuth, requireRole('FARMER'), handler)
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
        },
      });
      return;
    }

    next();
  };
};
