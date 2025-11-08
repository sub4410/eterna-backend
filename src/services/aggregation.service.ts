import { TokenData, AggregatedToken, FilterOptions, PaginatedResponse } from '../types';
import { DexScreenerClient } from './dexscreener.service';
import { JupiterClient } from './jupiter.service';
import { GeckoTerminalClient } from './geckoterminal.service';
import { cacheManager } from './cache.service';
import logger from '../utils/logger';

export class AggregationService {
  private dexScreener: DexScreenerClient;
  private jupiter: JupiterClient;
  private geckoTerminal: GeckoTerminalClient;
  private tokensCache: Map<string, AggregatedToken> = new Map();

  constructor() {
    this.dexScreener = new DexScreenerClient();
    this.jupiter = new JupiterClient();
    this.geckoTerminal = new GeckoTerminalClient();
  }

  async fetchAndAggregateTokens(): Promise<AggregatedToken[]> {
    const cacheKey = 'tokens:aggregated';
    
    // Try cache first
    const cached = await cacheManager.get<AggregatedToken[]>(cacheKey);
    if (cached && cached.length > 0) {
      logger.debug('Returning cached aggregated tokens', { count: cached.length });
      return cached;
    }

    try {
      logger.info('Fetching tokens from multiple sources...');

      // Fetch from multiple sources in parallel
      const [dexTokens, geckoTokens] = await Promise.all([
        this.dexScreener.getTrendingTokens(),
        this.geckoTerminal.getSolanaTokens(1),
      ]);

      logger.info('Fetched tokens', {
        dexscreener: dexTokens.length,
        geckoterminal: geckoTokens.length,
      });

      // Merge tokens by address
      const mergedTokens = this.mergeTokens([...dexTokens, ...geckoTokens]);

      // Enrich with Jupiter prices
      const enrichedTokens = await this.jupiter.enrichTokenData(
        Array.from(mergedTokens.values())
      );

      // Convert to aggregated format
      const aggregatedTokens: AggregatedToken[] = enrichedTokens.map(token => ({
        ...token,
        sources: token.source?.split(',') || [],
        aggregated_at: Date.now(),
      }));

      // Cache the results
      await cacheManager.set(cacheKey, aggregatedTokens);

      // Update in-memory cache
      aggregatedTokens.forEach(token => {
        this.tokensCache.set(token.token_address, token);
      });

      logger.info('Aggregation complete', { totalTokens: aggregatedTokens.length });
      return aggregatedTokens;
    } catch (error) {
      logger.error('Token aggregation failed', { error });
      return [];
    }
  }

  private mergeTokens(tokens: TokenData[]): Map<string, AggregatedToken> {
    const tokenMap = new Map<string, AggregatedToken>();

    tokens.forEach(token => {
      const existing = tokenMap.get(token.token_address);

      if (!existing) {
        tokenMap.set(token.token_address, {
          ...token,
          sources: [token.source || 'unknown'],
          aggregated_at: Date.now(),
        });
      } else {
        // Merge data - prefer non-zero values and more recent data
        const merged: AggregatedToken = {
          ...existing,
          token_name: token.token_name || existing.token_name,
          token_ticker: token.token_ticker || existing.token_ticker,
          price_sol: token.price_sol > 0 ? token.price_sol : existing.price_sol,
          market_cap_sol: Math.max(token.market_cap_sol, existing.market_cap_sol),
          volume_sol: Math.max(token.volume_sol, existing.volume_sol),
          liquidity_sol: Math.max(token.liquidity_sol, existing.liquidity_sol),
          transaction_count: Math.max(token.transaction_count, existing.transaction_count),
          price_1hr_change: token.price_1hr_change !== 0 ? token.price_1hr_change : existing.price_1hr_change,
          protocol: existing.protocol,
          sources: [...new Set([...existing.sources, token.source || 'unknown'])],
          aggregated_at: Date.now(),
        };

        tokenMap.set(token.token_address, merged);
      }
    });

    return tokenMap;
  }

  async getFilteredTokens(options: FilterOptions): Promise<PaginatedResponse<AggregatedToken>> {
    const tokens = await this.fetchAndAggregateTokens();
    
    // Apply filters
    let filtered = tokens.filter(token => {
      if (options.minVolume && token.volume_sol < options.minVolume) return false;
      if (options.minLiquidity && token.liquidity_sol < options.minLiquidity) return false;
      return true;
    });

    // Apply sorting
    filtered = this.sortTokens(filtered, options);

    // Apply pagination
    const limit = options.limit || 20;
    const cursorIndex = options.cursor ? parseInt(options.cursor) : 0;
    const paginatedTokens = filtered.slice(cursorIndex, cursorIndex + limit);
    const nextCursor = cursorIndex + limit < filtered.length 
      ? (cursorIndex + limit).toString() 
      : null;

    return {
      data: paginatedTokens,
      next_cursor: nextCursor,
      total: filtered.length,
    };
  }

  private sortTokens(tokens: AggregatedToken[], options: FilterOptions): AggregatedToken[] {
    const { sortBy = 'volume', sortOrder = 'desc' } = options;
    
    return tokens.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'volume':
          compareValue = a.volume_sol - b.volume_sol;
          break;
        case 'price_change':
          compareValue = a.price_1hr_change - b.price_1hr_change;
          break;
        case 'market_cap':
          compareValue = a.market_cap_sol - b.market_cap_sol;
          break;
        case 'liquidity':
          compareValue = a.liquidity_sol - b.liquidity_sol;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }

  getTokenFromCache(address: string): AggregatedToken | undefined {
    return this.tokensCache.get(address);
  }

  getAllCachedTokens(): AggregatedToken[] {
    return Array.from(this.tokensCache.values());
  }
}

export const aggregationService = new AggregationService();
