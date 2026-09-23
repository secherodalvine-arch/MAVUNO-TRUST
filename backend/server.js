import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initializeSocket } from './src/socket.js';
import { connectDB } from './src/config/db.js';
import routes from './src/routes/index.js';
import voiceRoutes from './src/routes/voiceRoutes.js';
import rightsRoutes from './src/routes/rightsRoutes.js';
import offerRoutes from './src/routes/offerRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';

// Load environment variables first
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);
const PORT = process.env.PORT || 8000;

// ---- Security & Middleware ----
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
]
  .filter(Boolean)
  .flatMap((val) => val.split(',').map((s) => s.trim()))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    return callback(new Error(`Origin '${origin}' not allowed by CORS`));
  },
  credentials: true,
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
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

// ---- Centralized Error Handler (must be last) ----
app.use(errorHandler);

// ---- Start Server ----
const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`\nMavunoTrust API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
