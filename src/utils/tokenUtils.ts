import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export interface TokenPayload {
    userId: string;
    email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY
    } as any);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY
    } as any);
};

export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

export const generateRandomToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

export const getAccessTokenExpiry = (): number => {
    // Convert expiry string to milliseconds
    const expiryStr = ACCESS_TOKEN_EXPIRY;
    if (expiryStr.endsWith('m')) {
        return parseInt(expiryStr) * 60 * 1000;
    } else if (expiryStr.endsWith('h')) {
        return parseInt(expiryStr) * 60 * 60 * 1000;
    } else if (expiryStr.endsWith('d')) {
        return parseInt(expiryStr) * 24 * 60 * 60 * 1000;
    }
    return 15 * 60 * 1000; // Default 15 minutes
};

export const getRefreshTokenExpiry = (): number => {
    // Convert expiry string to milliseconds
    const expiryStr = REFRESH_TOKEN_EXPIRY;
    if (expiryStr.endsWith('m')) {
        return parseInt(expiryStr) * 60 * 1000;
    } else if (expiryStr.endsWith('h')) {
        return parseInt(expiryStr) * 60 * 60 * 1000;
    } else if (expiryStr.endsWith('d')) {
        return parseInt(expiryStr) * 24 * 60 * 60 * 1000;
    }
    return 7 * 24 * 60 * 60 * 1000; // Default 7 days
};

