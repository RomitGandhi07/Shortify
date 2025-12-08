import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/tokenUtils';
import User from '../models/User';

// Extend Express Request to include user information
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
        }
    }
}

/**
 * Middleware to authenticate users via JWT token from cookies
 * Adds user information to req.user if authenticated
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get access token from signed cookies
        const accessToken = req.signedCookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify token
        const payload: TokenPayload = verifyToken(accessToken);

        // Check if user still exists
        const user = await User.findById(payload.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email first' });
        }

        // Attach user info to request
        req.user = {
            userId: payload.userId,
            email: payload.email
        };

        next();
    } catch (error: any) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Optional authentication middleware
 * Adds user info if authenticated, but doesn't require authentication
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.signedCookies.accessToken;

        if (!accessToken) {
            return next();
        }

        const payload: TokenPayload = verifyToken(accessToken);
        const user = await User.findById(payload.userId);

        if (user && user.isVerified) {
            req.user = {
                userId: payload.userId,
                email: payload.email
            };
        }
    } catch (error) {
        // Silently fail for optional authentication
        // User remains unauthenticated
    }

    next();
};

