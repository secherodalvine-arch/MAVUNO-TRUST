import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        const nodeEnv = process.env.NODE_ENV || 'development';
        let dbName = process.env.DB_NAME || process.env.MONGODB_DB_NAME;

        if (!dbName) {
            dbName = nodeEnv === 'staging' ? 'mavunotrust-staging' : 'mavunotrust';
        }

        // HARD STAGING ISOLATION GUARD:
        // Staging environment MUST NOT connect to the production database 'mavunotrust'.
        if (nodeEnv === 'staging' && dbName === 'mavunotrust') {
            const isolationError = new Error(
                "[STAGING ISOLATION ERROR] Staging backend is strictly forbidden from connecting to production database 'mavunotrust'. " +
                "Please configure DB_NAME=mavunotrust-staging in your staging environment."
            );
            console.error(isolationError.message);
            throw isolationError;
        }

        if (!mongoUri) {
            console.warn('MongoDB connection skipped: MONGODB_URI is not defined.');
            return false;
        }

        await mongoose.connect(mongoUri, { dbName });
        console.log(`Database connected successfully to [${dbName}] (${nodeEnv}).`);
        return true;
    }
    catch (error) {
        if (error.message?.includes('[STAGING ISOLATION ERROR]')) {
            throw error;
        }
        console.error('MongoDB connection error:', error.message || error);
        return false;
    }
};
