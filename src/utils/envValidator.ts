/**
 * Environment Variables Validator
 * Validates that all required environment variables are set before starting the server
 */

interface EnvConfig {
    name: string;
    required: boolean;
    description: string;
}

const requiredEnvVars: EnvConfig[] = [
    // Server Configuration
    {
        name: 'PORT',
        required: false,
        description: 'Server port (defaults to 3000)'
    },
    {
        name: 'NODE_ENV',
        required: false,
        description: 'Environment mode (development/production/test)'
    },

    // Database Configuration
    {
        name: 'MONGODB_URI',
        required: true,
        description: 'MongoDB connection string'
    },

    // JWT Configuration
    {
        name: 'JWT_SECRET',
        required: true,
        description: 'Secret key for signing JWT tokens'
    },
    {
        name: 'ACCESS_TOKEN_EXPIRY',
        required: false,
        description: 'Access token expiration time (defaults to 15m)'
    },
    {
        name: 'REFRESH_TOKEN_EXPIRY',
        required: false,
        description: 'Refresh token expiration time (defaults to 7d)'
    },

    // Cookie Security
    {
        name: 'COOKIE_SECRET',
        required: true,
        description: 'Secret key for signing cookies'
    },

    // CORS Configuration
    {
        name: 'CORS_ORIGIN',
        required: false,
        description: 'Allowed CORS origin (defaults to http://localhost:3000)'
    },

    // Base URL
    {
        name: 'BASE_URL',
        required: true,
        description: 'Base URL for the application (used in emails)'
    },

    // Email Configuration
    {
        name: 'EMAIL_HOST',
        required: false,
        description: 'SMTP server hostname (optional for development)'
    },
    {
        name: 'EMAIL_PORT',
        required: false,
        description: 'SMTP server port (optional for development)'
    },
    {
        name: 'EMAIL_USER',
        required: false,
        description: 'SMTP username (optional for development)'
    },
    {
        name: 'EMAIL_PASSWORD',
        required: false,
        description: 'SMTP password (optional for development)'
    },
    {
        name: 'EMAIL_FROM',
        required: false,
        description: 'Email from address (defaults to noreply@shortify.com)'
    }
];

/**
 * Validates environment variables
 * @throws Error if any required environment variable is missing
 */
export const validateEnv = (): void => {
    const missingVars: EnvConfig[] = [];
    const warnings: string[] = [];

    console.log('\n🔍 Validating environment variables...\n');

    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar.name];

        if (!value || value.trim() === '') {
            if (envVar.required) {
                missingVars.push(envVar);
            } else {
                warnings.push(`⚠️  ${envVar.name} - ${envVar.description}`);
            }
        } else {
            console.log(`✅ ${envVar.name}`);
        }
    }

    // Print warnings for optional but recommended variables
    if (warnings.length > 0) {
        console.log('\n⚠️  Optional environment variables not set (using defaults):\n');
        warnings.forEach(warning => console.log(warning));
    }

    // If any required variables are missing, throw an error
    if (missingVars.length > 0) {
        console.error('\n❌ Missing required environment variables:\n');
        missingVars.forEach(envVar => {
            console.error(`   ❌ ${envVar.name} - ${envVar.description}`);
        });
        console.error('\n📝 Please create a .env file with the required variables.');
        console.error('   See .env.example for reference.\n');
        
        throw new Error(`Missing required environment variables: ${missingVars.map(v => v.name).join(', ')}`);
    }

    // Additional validation for production environment
    if (process.env.NODE_ENV === 'production') {
        validateProductionSecrets();
    }

    console.log('\n✅ All required environment variables are set!\n');
};

/**
 * Validates that production secrets are strong and not using defaults
 */
const validateProductionSecrets = (): void => {
    const defaultSecrets = [
        'your-secret-key-change-in-production',
        'your-cookie-secret-change-in-production',
        'your-super-secret-jwt-key-change-this-in-production',
        'your-super-secret-cookie-key-change-this-in-production'
    ];

    const jwtSecret = process.env.JWT_SECRET || '';
    const cookieSecret = process.env.COOKIE_SECRET || '';

    const warnings: string[] = [];

    // Check if secrets are using default values
    if (defaultSecrets.includes(jwtSecret.toLowerCase())) {
        warnings.push('JWT_SECRET is using a default value');
    }

    if (defaultSecrets.includes(cookieSecret.toLowerCase())) {
        warnings.push('COOKIE_SECRET is using a default value');
    }

    // Check if secrets are too short
    if (jwtSecret.length < 32) {
        warnings.push('JWT_SECRET is too short (minimum 32 characters recommended)');
    }

    if (cookieSecret.length < 32) {
        warnings.push('COOKIE_SECRET is too short (minimum 32 characters recommended)');
    }

    // Check if JWT and Cookie secrets are the same
    if (jwtSecret === cookieSecret) {
        warnings.push('JWT_SECRET and COOKIE_SECRET should be different for defense in depth');
    }

    if (warnings.length > 0) {
        console.error('\n⚠️  PRODUCTION SECURITY WARNINGS:\n');
        warnings.forEach(warning => {
            console.error(`   ⚠️  ${warning}`);
        });
        console.error('\n🔒 Please update your secrets before deploying to production!');
        console.error('   Generate strong secrets using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
    }
};

/**
 * Get a summary of current environment configuration
 */
export const getEnvSummary = (): string => {
    return `
Environment Configuration:
  - Environment: ${process.env.NODE_ENV || 'development'}
  - Port: ${process.env.PORT || '3000'}
  - Database: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Not configured'}
  - JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}
  - Cookie Secret: ${process.env.COOKIE_SECRET ? '✅ Set' : '❌ Not set'}
  - Email: ${process.env.EMAIL_USER ? '✅ Configured' : '⚠️  Using console logging'}
  - CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}
`;
};

