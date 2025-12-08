import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@shortify.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Create reusable transporter
const createTransporter = () => {
    // If email credentials are not configured, use a test account (ethereal)
    if (!EMAIL_USER || !EMAIL_PASSWORD) {
        console.warn('ΓÜá∩╕Å  Email credentials not configured. Emails will be logged to console only.');
        return null;
    }

    return nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT === 465,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD
        }
    });
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
    const transporter = createTransporter();
    const verificationUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: EMAIL_FROM,
        to: email,
        subject: 'Verify Your Email - Shortify',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Shortify!</h2>
                <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Or copy and paste this link in your browser:<br>
                    <a href="${verificationUrl}">${verificationUrl}</a>
                </p>
                <p style="color: #666; font-size: 14px;">
                    This link will expire in 24 hours.
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    If you didn't create an account with Shortify, please ignore this email.
                </p>
            </div>
        `
    };

    if (!transporter) {
        console.log('≡ƒôº Verification Email (not sent, email not configured):');
        console.log(`   To: ${email}`);
        console.log(`   Verification URL: ${verificationUrl}`);
        return;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Γ£à Verification email sent to ${email}`);
    } catch (error) {
        console.error('Γ¥î Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
    const transporter = createTransporter();
    const resetUrl = `${BASE_URL}/api/auth/reset-password?token=${token}`;

    const mailOptions = {
        from: EMAIL_FROM,
        to: email,
        subject: 'Reset Your Password - Shortify',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>You requested to reset your password. Click the button below to proceed:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #dc3545; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Or copy and paste this link in your browser:<br>
                    <a href="${resetUrl}">${resetUrl}</a>
                </p>
                <p style="color: #666; font-size: 14px;">
                    This link will expire in 1 hour.
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </p>
            </div>
        `
    };

    if (!transporter) {
        console.log('≡ƒôº Password Reset Email (not sent, email not configured):');
        console.log(`   To: ${email}`);
        console.log(`   Reset URL: ${resetUrl}`);
        return;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Γ£à Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Γ¥î Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

