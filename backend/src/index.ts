import express, { Request, Response } from 'express';
import http from 'http';
import { initializeSocket } from './socket';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import routes from './routes';
import voiceRoutes from './routes/voiceRoutes';
import rightsRoutes from './routes/rightsRoutes';
import offerRoutes from './routes/offerRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Load environment variables first
dotenv.config();

const app = express();
const httpServer = http.createServer(app);
// Initialize Socket.io
initializeSocket(httpServer);
const PORT = process.env.PORT || 5000;

// ---- Security & Middleware ----
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}));

// Request logging
app.use(requestLogger);

// ---- API Routes ----
app.use('/api', routes);
app.use('/api/voice', voiceRoutes);
app.use('/api/rights', rightsRoutes);
app.use('/api/offers', offerRoutes);

// ---- 404 Handler ----
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

// ---- Centralized Error Handler (must be last) ----
app.use(errorHandler);

// ---- Start Server ----
const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`\n🌾 MavunoTrust API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
