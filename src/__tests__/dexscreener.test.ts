import { DexScreenerClient } from '../services/dexscreener.service';
import { RetryableHttpClient } from '../utils/httpClient';

jest.mock('../utils/httpClient');

describe('DexScreenerClient', () => {
  let client: DexScreenerClient;
  let mockHttpClient: jest.Mocked<RetryableHttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
    } as any;

    (RetryableHttpClient as jest.MockedClass<typeof RetryableHttpClient>).mockImplementation(
      () => mockHttpClient
    );

    client = new DexScreenerClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchTokens', () => {
    it('should return empty array when no pairs found', async () => {
      mockHttpClient.get.mockResolvedValue({ pairs: [] });

      const result = await client.searchTokens('TEST');

      expect(result).toEqual([]);
    });

    it('should return normalized token data for Solana pairs', async () => {
      const mockResponse = {
        pairs: [
          {
            chainId: 'solana',
            baseToken: {
              address: '0x123',
              name: 'Test Token',
              symbol: 'TEST',
            },
            priceUsd: '100',
            priceNative: '0.5',
            volume: { h24: '10000' },
            liquidity: { usd: '50000' },
            fdv: '1000000',
            txns: { h24: { buys: '100', sells: '50' } },
            priceChange: { h1: '5.5', h24: '10.2' },
            dexId: 'Raydium',
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.searchTokens('TEST');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        token_address: '0x123',
        token_name: 'Test Token',
        token_ticker: 'TEST',
        protocol: 'Raydium',
        source: 'dexscreener',
      });
      expect(result[0].price_sol).toBeDefined();
      expect(result[0].volume_sol).toBeDefined();
    });

    it('should filter out non-Solana pairs', async () => {
      const mockResponse = {
        pairs: [
          {
            chainId: 'ethereum',
            baseToken: { address: '0x456', name: 'ETH Token', symbol: 'ETHT' },
          },
          {
            chainId: 'solana',
            baseToken: { address: '0x123', name: 'SOL Token', symbol: 'SOLT' },
            priceNative: '1',
            priceUsd: '100',
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.searchTokens('TOKEN');

      expect(result).toHaveLength(1);
      expect(result[0].token_ticker).toBe('SOLT');
    });

    it('should return empty array on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));

      const result = await client.searchTokens('TEST');

      expect(result).toEqual([]);
    });
  });

  describe('getTokenByAddress', () => {
    it('should return token data for valid address', async () => {
      const mockResponse = {
        pairs: [
          {
            chainId: 'solana',
            baseToken: {
              address: '0x123',
              name: 'Test Token',
              symbol: 'TEST',
            },
            priceNative: '0.5',
            priceUsd: '100',
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getTokenByAddress('0x123');

      expect(result).not.toBeNull();
      expect(result?.token_address).toBe('0x123');
    });

    it('should return null when token not found', async () => {
      mockHttpClient.get.mockResolvedValue({ pairs: [] });

      const result = await client.getTokenByAddress('0xnonexistent');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));

      const result = await client.getTokenByAddress('0x123');

      expect(result).toBeNull();
    });
  });

  describe('getTrendingTokens', () => {
    it('should fetch trending tokens', async () => {
      const mockResponse = {
        pairs: [
          {
            chainId: 'solana',
            baseToken: { address: '0x123', name: 'Trending', symbol: 'TREND' },
            priceNative: '1',
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getTrendingTokens();

      expect(result).toHaveLength(1);
      expect(mockHttpClient.get).toHaveBeenCalled();
    });
  });
});
