import { Request, Response } from 'express';
import User from '../models/User';
import { 
    generateAccessToken, 
    generateRefreshToken, 
    verifyToken, 
    generateRandomToken,
    getAccessTokenExpiry,
    getRefreshTokenExpiry
} from '../utils/tokenUtils';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService';

/**
 * Signup - Create new user account
 */
export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, username } = req.body;

        // Validate input
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Generate verification token
        const verificationToken = generateRandomToken();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new user
        const user = new User({
            email,
            password,
            username,
            verificationToken,
            verificationTokenExpires
        });

        await user.save();

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue even if email fails
        }

        res.status(201).json({ 
            message: 'Account created successfully. Please check your email to verify your account.',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
};

/**
 * Verify Email - Confirm user's email address
 */
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        // Find user with valid verification token
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Server error during email verification' });
    }
};

/**
 * Login - Authenticate user and generate tokens
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email before logging in' });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate tokens
        const payload = {
            userId: user._id.toString(),
            email: user.email
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Set tokens as signed HTTP-only cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: getAccessTokenExpiry(),
            signed: true
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: getRefreshTokenExpiry(),
            signed: true
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

/**
 * Refresh Token - Generate new access and refresh tokens (Token Rotation)
 */
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const oldRefreshToken = req.signedCookies.refreshToken;

        if (!oldRefreshToken) {
            return res.status(401).json({ error: 'Refresh token not found' });
        }

        // Verify refresh token
        const payload = verifyToken(oldRefreshToken);

        // Check if user still exists
        const user = await User.findById(payload.userId);
        if (!user || !user.isVerified) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Generate new tokens (Token Rotation)
        const newPayload = {
            userId: user._id.toString(),
            email: user.email
        };

        const newAccessToken = generateAccessToken(newPayload);
        const newRefreshToken = generateRefreshToken(newPayload);

        // Set new signed tokens as cookies
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: getAccessTokenExpiry(),
            signed: true
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: getRefreshTokenExpiry(),
            signed: true
        });

        res.json({ message: 'Tokens refreshed successfully' });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
};

/**
 * Logout - Clear authentication cookies
 */
export const logout = async (req: Request, res: Response) => {
    try {
        // Clear signed cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Server error during logout' });
    }
};

/**
 * Forgot Password - Send password reset email
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        // Always return success message for security (don't reveal if email exists)
        if (!user) {
            return res.json({ 
                message: 'If an account with that email exists, a password reset link has been sent.' 
            });
        }

        // Generate reset token
        const resetToken = generateRandomToken();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        // Send reset email
        try {
            await sendPasswordResetEmail(email, resetToken);
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError);
            return res.status(500).json({ error: 'Failed to send password reset email' });
        }

        res.json({ 
            message: 'If an account with that email exists, a password reset link has been sent.' 
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error during password reset request' });
    }
};

/**
 * Reset Password - Update password using reset token
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;
        const { password } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Reset token is required' });
        }

        if (!password) {
            return res.status(400).json({ error: 'New password is required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error during password reset' });
    }
};

/**
 * Get Current User - Get authenticated user's profile
 */
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

