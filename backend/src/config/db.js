import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        const nodeEnv = process.env.NODE_ENV || 'development';
        const dbName = process.env.DB_NAME || process.env.MONGODB_DB_NAME || 'mavunotrust';

        if (!mongoUri) {
            console.warn('MongoDB connection skipped: MONGODB_URI is not defined.');
            return false;
        }

        await mongoose.connect(mongoUri, { dbName });
        console.log(`Database connected successfully to [${dbName}] (${nodeEnv}).`);
        return true;
    }
    catch (error) {
        console.error('MongoDB connection error:', error.message || error);
        return false;
    }
};
