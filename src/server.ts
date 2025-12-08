import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';
import { validateEnv, getEnvSummary } from './utils/envValidator';

// Load environment variables
dotenv.config();

// Validate environment variables before starting the server
try {
    validateEnv();
} catch (error) {
    console.error('Environment validation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
}

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Romit:Romit@cluster0.n1etbdc.mongodb.net/shortify';

// Print environment summary
console.log(getEnvSummary());

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`\n🚀 Server is running on port ${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   Base URL: ${process.env.BASE_URL}\n`);
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    });
