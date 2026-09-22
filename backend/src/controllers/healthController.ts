import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const getHealth = (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    service: "MavunoTrust API",
    database: isDbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
};
