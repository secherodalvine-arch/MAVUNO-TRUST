import mongoose from 'mongoose';

export const connectDB = async (): Promise<boolean> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || process.env.MONGODB_DB_NAME || 'mavunotrust';
    
    if (!mongoUri) {
      console.warn('MongoDB connection skipped: MONGODB_URI is not defined.');
      return false;
    }

    await mongoose.connect(mongoUri, { dbName });
    console.log(`MongoDB connected successfully [Database: ${dbName}]`);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit process in this step, to allow graceful fallback as requested
    return false;
  }
};
