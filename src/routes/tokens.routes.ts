import { Router, Request, Response } from 'express';
import { aggregationService } from '../services/aggregation.service';
import { FilterOptions } from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/tokens
 * Get filtered and paginated tokens
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const options: FilterOptions = {
      timeframe: req.query.timeframe as any,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      cursor: req.query.cursor as string,
      minVolume: req.query.minVolume ? parseFloat(req.query.minVolume as string) : undefined,
      minLiquidity: req.query.minLiquidity ? parseFloat(req.query.minLiquidity as string) : undefined,
    };

    const result = await aggregationService.getFilteredTokens(options);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        next_cursor: result.next_cursor,
        total: result.total,
        limit: options.limit,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch tokens', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens',
    });
  }
});

/**
 * GET /api/tokens/:address
 * Get specific token by address
 */
router.get('/tokens/:address', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    const token = aggregationService.getTokenFromCache(address);

    if (!token) {
      res.status(404).json({
        success: false,
        error: 'Token not found',
      });
      return;
    }

    res.json({
      success: true,
      data: token,
    });
  } catch (error) {
    logger.error('Failed to fetch token', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token',
    });
  }
});

/**
 * POST /api/tokens/refresh
 * Force refresh token data
 */
router.post('/tokens/refresh', async (_req: Request, res: Response) => {
  try {
    const tokens = await aggregationService.fetchAndAggregateTokens();

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      count: tokens.length,
    });
  } catch (error) {
    logger.error('Failed to refresh tokens', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to refresh tokens',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: Date.now(),
  });
});

export default router;
