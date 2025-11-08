import { RetryableHttpClient } from '../utils/httpClient';
import { TokenData } from '../types';
import logger from '../utils/logger';

export class DexScreenerClient {
  private client: RetryableHttpClient;
  private readonly baseURL = 'https://api.dexscreener.com';

  constructor() {
    this.client = new RetryableHttpClient(
      this.baseURL,
      parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
      parseInt(process.env.RETRY_BASE_DELAY || '1000')
    );
  }

  async searchTokens(query: string): Promise<TokenData[]> {
    try {
      const data = await this.client.get<any>(
        `/latest/dex/search`,
        { q: query }
      );

      if (!data.pairs || data.pairs.length === 0) {
        return [];
      }

      return data.pairs
        .filter((pair: any) => pair.chainId === 'solana')
        .map((pair: any) => this.normalizePairData(pair));
    } catch (error) {
      logger.error('DexScreener search failed', { query, error });
      return [];
    }
  }

  async getTokenByAddress(address: string): Promise<TokenData | null> {
    try {
      const data = await this.client.get<any>(`/latest/dex/tokens/${address}`);

      if (!data.pairs || data.pairs.length === 0) {
        return null;
      }

      const solanaPair = data.pairs.find((pair: any) => pair.chainId === 'solana');
      return solanaPair ? this.normalizePairData(solanaPair) : null;
    } catch (error) {
      logger.error('DexScreener token fetch failed', { address, error });
      return null;
    }
  }

  async getTrendingTokens(): Promise<TokenData[]> {
    try {
      // Using a popular search term to get trending tokens
      return await this.searchTokens('SOL');
    } catch (error) {
      logger.error('DexScreener trending fetch failed', { error });
      return [];
    }
  }

  private normalizePairData(pair: any): TokenData {
    const priceUsd = parseFloat(pair.priceUsd || '0');
    const priceNative = parseFloat(pair.priceNative || '0');
    const volume24h = parseFloat(pair.volume?.h24 || '0');
    const liquidity = parseFloat(pair.liquidity?.usd || '0');
    const fdv = parseFloat(pair.fdv || '0');

    // Convert USD values to SOL (approximate)
    const solPrice = priceNative > 0 ? priceUsd / priceNative : 0;
    
    return {
      token_address: pair.baseToken?.address || '',
      token_name: pair.baseToken?.name || '',
      token_ticker: pair.baseToken?.symbol || '',
      price_sol: priceNative,
      market_cap_sol: fdv / (solPrice || 1),
      volume_sol: volume24h / (solPrice || 1),
      liquidity_sol: liquidity / (solPrice || 1),
      transaction_count: parseInt(pair.txns?.h24?.buys || '0') + parseInt(pair.txns?.h24?.sells || '0'),
      price_1hr_change: parseFloat(pair.priceChange?.h1 || '0'),
      price_24hr_change: parseFloat(pair.priceChange?.h24 || '0'),
      protocol: pair.dexId || 'Unknown',
      source: 'dexscreener',
      last_updated: Date.now(),
    };
  }
}
