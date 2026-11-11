import mongoose from 'mongoose';
import { getEarthEngineConfig } from '../services/satelliteService.js';
import { fcmService } from '../services/fcmService.js';

export const getHealth = (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    const gee = getEarthEngineConfig();
    const fcm = fcmService.getStatus();

    res.status(200).json({
        success: true,
        service: "MavunoTrust API",
        database: isDbConnected ? "connected" : "disconnected",
        services: {
            earthEngine: {
                configured: gee.isConfigured,
                source: gee.source,
            },
            firebase: {
                configured: fcm.configured,
                type: fcm.type,
                source: fcm.source,
            },
        },
        timestamp: new Date().toISOString()
    });
};
