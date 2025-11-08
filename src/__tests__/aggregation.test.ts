import { AggregationService } from '../services/aggregation.service';
import { DexScreenerClient } from '../services/dexscreener.service';
import { JupiterClient } from '../services/jupiter.service';
import { GeckoTerminalClient } from '../services/geckoterminal.service';
import { TokenData } from '../types';

jest.mock('../services/dexscreener.service');
jest.mock('../services/jupiter.service');
jest.mock('../services/geckoterminal.service');
jest.mock('../services/cache.service', () => ({
  cacheManager: {
    get: jest.fn(),
    set: jest.fn(),
    connect: jest.fn(),
  },
}));

describe('AggregationService', () => {
  let service: AggregationService;
  let mockDexScreener: jest.Mocked<DexScreenerClient>;
  let mockJupiter: jest.Mocked<JupiterClient>;
  let mockGeckoTerminal: jest.Mocked<GeckoTerminalClient>;

  const mockToken1: TokenData = {
    token_address: '0x123',
    token_name: 'Token 1',
    token_ticker: 'TKN1',
    price_sol: 1.5,
    market_cap_sol: 1000,
    volume_sol: 500,
    liquidity_sol: 300,
    transaction_count: 100,
    price_1hr_change: 5.5,
    protocol: 'Raydium',
    source: 'dexscreener',
  };

  const mockToken2: TokenData = {
    token_address: '0x456',
    token_name: 'Token 2',
    token_ticker: 'TKN2',
    price_sol: 2.5,
    market_cap_sol: 2000,
    volume_sol: 1000,
    liquidity_sol: 600,
    transaction_count: 200,
    price_1hr_change: -3.5,
    protocol: 'Orca',
    source: 'geckoterminal',
  };

  beforeEach(() => {
    mockDexScreener = {
      getTrendingTokens: jest.fn(),
      searchTokens: jest.fn(),
      getTokenByAddress: jest.fn(),
    } as any;

    mockJupiter = {
      getTokenPrices: jest.fn(),
      enrichTokenData: jest.fn((tokens) => Promise.resolve(tokens)),
    } as any;

    mockGeckoTerminal = {
      getSolanaTokens: jest.fn(),
      getTokenInfo: jest.fn(),
    } as any;

    (DexScreenerClient as jest.MockedClass<typeof DexScreenerClient>).mockImplementation(
      () => mockDexScreener
    );
    (JupiterClient as jest.MockedClass<typeof JupiterClient>).mockImplementation(
      () => mockJupiter
    );
    (GeckoTerminalClient as jest.MockedClass<typeof GeckoTerminalClient>).mockImplementation(
      () => mockGeckoTerminal
    );

    service = new AggregationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAndAggregateTokens', () => {
    it('should aggregate tokens from multiple sources', async () => {
      mockDexScreener.getTrendingTokens.mockResolvedValue([mockToken1]);
      mockGeckoTerminal.getSolanaTokens.mockResolvedValue([mockToken2]);

      const result = await service.fetchAndAggregateTokens();

      expect(result).toHaveLength(2);
      expect(result[0].sources).toBeDefined();
      expect(result[0].aggregated_at).toBeDefined();
    });

    it('should merge duplicate tokens', async () => {
      const duplicateToken = { ...mockToken1, source: 'geckoterminal' };
      
      mockDexScreener.getTrendingTokens.mockResolvedValue([mockToken1]);
      mockGeckoTerminal.getSolanaTokens.mockResolvedValue([duplicateToken]);

      const result = await service.fetchAndAggregateTokens();

      expect(result).toHaveLength(1);
      expect(result[0].sources).toContain('dexscreener');
      expect(result[0].sources).toContain('geckoterminal');
    });

    it('should return empty array on error', async () => {
      mockDexScreener.getTrendingTokens.mockRejectedValue(new Error('API Error'));
      mockGeckoTerminal.getSolanaTokens.mockRejectedValue(new Error('API Error'));

      const result = await service.fetchAndAggregateTokens();

      expect(result).toEqual([]);
    });
  });

  describe('getFilteredTokens', () => {
    beforeEach(async () => {
      mockDexScreener.getTrendingTokens.mockResolvedValue([mockToken1, mockToken2]);
      mockGeckoTerminal.getSolanaTokens.mockResolvedValue([]);
      await service.fetchAndAggregateTokens();
    });

    it('should filter by minimum volume', async () => {
      const result = await service.getFilteredTokens({ minVolume: 750 });

      expect(result.data.every(t => t.volume_sol >= 750)).toBe(true);
    });

    it('should filter by minimum liquidity', async () => {
      const result = await service.getFilteredTokens({ minLiquidity: 500 });

      expect(result.data.every(t => t.liquidity_sol >= 500)).toBe(true);
    });

    it('should sort by volume descending', async () => {
      const result = await service.getFilteredTokens({
        sortBy: 'volume',
        sortOrder: 'desc',
      });

      expect(result.data[0].volume_sol).toBeGreaterThanOrEqual(
        result.data[result.data.length - 1].volume_sol
      );
    });

    it('should paginate results', async () => {
      const result = await service.getFilteredTokens({ limit: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.next_cursor).toBeDefined();
    });

    it('should return all tokens with no filters', async () => {
      const result = await service.getFilteredTokens({});

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBe(2);
    });
  });

  describe('getTokenFromCache', () => {
    it('should return cached token', async () => {
      mockDexScreener.getTrendingTokens.mockResolvedValue([mockToken1]);
      mockGeckoTerminal.getSolanaTokens.mockResolvedValue([]);
      
      await service.fetchAndAggregateTokens();
      const token = service.getTokenFromCache('0x123');

      expect(token).toBeDefined();
      expect(token?.token_address).toBe('0x123');
    });

    it('should return undefined for non-existent token', () => {
      const token = service.getTokenFromCache('0xnonexistent');

      expect(token).toBeUndefined();
    });
  });
});
