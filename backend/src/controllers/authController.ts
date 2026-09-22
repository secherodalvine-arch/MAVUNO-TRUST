import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

// ── Register ──────────────────────────────────────────────────────────────────

export const registerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, email, phoneNumber, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      res.status(400).json({
        success: false,
        error: { message: 'fullName, email, password, and role are required.' },
      });
      return;
    }

    const result = await authService.register(
      { fullName, email, phoneNumber, password, role },
      req.ip ?? undefined
    );

    // Refresh token is sent as httpOnly cookie — never readable by JS
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user:        result.user,
        accessToken: result.tokens.accessToken,
        // refreshToken deliberately NOT in response body
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { message: 'Email and password are required.' },
      });
      return;
    }

    const result = await authService.login(
      { email, password },
      req.ip ?? undefined
    );

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        user:        result.user,
        accessToken: result.tokens.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    const userId = req.user?.userId;

    if (userId && rawRefreshToken) {
      await authService.logout(userId, rawRefreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── Me ────────────────────────────────────────────────────────────────────────

export const meHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user!;
    const User = (await import('../models/User')).default;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    // Return only safe fields — no passwordHash, no private data
    res.status(200).json({
      success: true,
      data: {
        id:            user._id,
        fullName:      user.fullName,
        email:         user.email,
        phoneNumber:   user.phoneNumber,
        role:          user.role,
        accountStatus: user.accountStatus,
        createdAt:     user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Refresh Access Token ──────────────────────────────────────────────────────

export const refreshTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (!rawRefreshToken) {
      res.status(401).json({
        success: false,
        error: { message: 'No refresh token. Please log in.' },
      });
      return;
    }

    const { accessToken } = await authService.refreshAccessToken(rawRefreshToken);
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

// ── Request Password Reset ────────────────────────────────────────────────────

export const requestResetHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: { message: 'Email is required.' } });
      return;
    }

    await authService.requestPasswordReset(email, req.ip ?? undefined);

    // Always return success regardless of whether the email exists
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link will be sent.',
    });
  } catch (err) {
    next(err);
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────

export const resetPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: { message: 'Token and newPassword are required.' },
      });
      return;
    }

    await authService.resetPassword(token, newPassword);

    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};
