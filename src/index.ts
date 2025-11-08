import express, { Application } from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import tokenRoutes from './routes/tokens.routes';
import { WebSocketService } from './services/websocket.service';
import { cacheManager } from './services/cache.service';
import { aggregationService } from './services/aggregation.service';
import logger from './utils/logger';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Routes
app.use('/api', tokenRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Eterna Backend API - Real-time Data Aggregation Service',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      tokens: '/api/tokens',
      tokenById: '/api/tokens/:address',
      refresh: '/api/tokens/refresh',
      websocket: 'ws://localhost:' + PORT,
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize WebSocket service
const wsService = new WebSocketService(httpServer);

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing services...');

    // Connect to Redis
    await cacheManager.connect();

    // Pre-fetch initial data
    await aggregationService.fetchAndAggregateTokens();

    // Start WebSocket updates
    wsService.startUpdates();

    // Schedule periodic data refresh (every 30 seconds)
    cron.schedule('*/30 * * * * *', async () => {
      logger.debug('Running scheduled token refresh');
      try {
        await aggregationService.fetchAndAggregateTokens();
      } catch (error) {
        logger.error('Scheduled refresh failed', { error });
      }
    });

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed', { error });
    throw error;
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  
  wsService.stopUpdates();
  await cacheManager.disconnect();
  
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
httpServer.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    await initializeServices();
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
});

export { app, httpServer };
