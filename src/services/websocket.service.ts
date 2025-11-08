import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { aggregationService } from './aggregation.service';
import { WebSocketUpdate, AggregatedToken } from '../types';
import logger from '../utils/logger';

export class WebSocketService {
  private io: SocketIOServer;
  private updateInterval: number;
  private intervalId: NodeJS.Timeout | null = null;
  private previousTokenData: Map<string, AggregatedToken> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.updateInterval = parseInt(process.env.WS_UPDATE_INTERVAL || '5000');
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Send initial data
      this.sendInitialData(socket);

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });

      socket.on('subscribe', (data) => {
        logger.debug('Client subscribed', { socketId: socket.id, data });
        socket.join('token-updates');
      });

      socket.on('unsubscribe', () => {
        logger.debug('Client unsubscribed', { socketId: socket.id });
        socket.leave('token-updates');
      });
    });
  }

  private async sendInitialData(socket: any): Promise<void> {
    try {
      const tokens = await aggregationService.fetchAndAggregateTokens();
      socket.emit('initial_data', {
        tokens: tokens.slice(0, 30),
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Failed to send initial data', { error });
    }
  }

  startUpdates(): void {
    if (this.intervalId) {
      logger.warn('Updates already running');
      return;
    }

    logger.info('Starting WebSocket updates', {
      interval: this.updateInterval,
    });

    this.intervalId = setInterval(async () => {
      await this.checkAndBroadcastUpdates();
    }, this.updateInterval);
  }

  stopUpdates(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Stopped WebSocket updates');
    }
  }

  private async checkAndBroadcastUpdates(): Promise<void> {
    try {
      const currentTokens = await aggregationService.fetchAndAggregateTokens();
      const updates: WebSocketUpdate[] = [];

      currentTokens.forEach(currentToken => {
        const previousToken = this.previousTokenData.get(currentToken.token_address);

        if (!previousToken) {
          // New token
          updates.push({
            type: 'new_token',
            token: currentToken,
            timestamp: Date.now(),
          });
        } else {
          // Check for price changes
          const priceChangePct = Math.abs(
            ((currentToken.price_sol - previousToken.price_sol) / previousToken.price_sol) * 100
          );

          if (priceChangePct > 1) {
            updates.push({
              type: 'price_update',
              token: currentToken,
              timestamp: Date.now(),
            });
          }

          // Check for volume spikes (50% increase)
          const volumeChangePct = 
            ((currentToken.volume_sol - previousToken.volume_sol) / previousToken.volume_sol) * 100;

          if (volumeChangePct > 50) {
            updates.push({
              type: 'volume_spike',
              token: currentToken,
              timestamp: Date.now(),
            });
          }
        }

        // Update previous data
        this.previousTokenData.set(currentToken.token_address, currentToken);
      });

      if (updates.length > 0) {
        logger.info('Broadcasting updates', { count: updates.length });
        this.io.to('token-updates').emit('token_update', updates);
      }
    } catch (error) {
      logger.error('Failed to check and broadcast updates', { error });
    }
  }

  broadcastUpdate(update: WebSocketUpdate): void {
    this.io.to('token-updates').emit('token_update', [update]);
  }

  getConnectedClients(): number {
    return this.io.sockets.sockets.size;
  }
}
