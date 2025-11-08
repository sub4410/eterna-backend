import { RetryableHttpClient } from '../utils/httpClient';
import { TokenData } from '../types';
import logger from '../utils/logger';

export class GeckoTerminalClient {
  private client: RetryableHttpClient;
  private readonly baseURL = 'https://api.geckoterminal.com/api/v2';

  constructor() {
    this.client = new RetryableHttpClient(this.baseURL, 3, 1000);
  }

  async getSolanaTokens(page = 1): Promise<TokenData[]> {
    try {
      const data = await this.client.get<any>(
        `/networks/solana/tokens`,
        { page }
      );

      if (!data.data || data.data.length === 0) {
        return [];
      }

      return data.data.map((token: any) => this.normalizeTokenData(token));
    } catch (error) {
      logger.error('GeckoTerminal fetch failed', { page, error });
      return [];
    }
  }

  async getTokenInfo(address: string): Promise<TokenData | null> {
    try {
      const data = await this.client.get<any>(
        `/networks/solana/tokens/${address}`
      );

      if (!data.data) {
        return null;
      }

      return this.normalizeTokenData(data.data);
    } catch (error) {
      logger.error('GeckoTerminal token info failed', { address, error });
      return null;
    }
  }

  private normalizeTokenData(token: any): TokenData {
    const attributes = token.attributes || {};
    const priceUsd = parseFloat(attributes.price_usd || '0');
    const volumeUsd24h = parseFloat(attributes.volume_usd?.h24 || '0');
    const marketCap = parseFloat(attributes.market_cap_usd || '0');
    
    // Approximate SOL conversion (SOL ~= $100)
    const solPrice = 100;
    
    return {
      token_address: attributes.address || token.id || '',
      token_name: attributes.name || '',
      token_ticker: attributes.symbol || '',
      price_sol: priceUsd / solPrice,
      market_cap_sol: marketCap / solPrice,
      volume_sol: volumeUsd24h / solPrice,
      liquidity_sol: parseFloat(attributes.reserve_in_usd || '0') / solPrice,
      transaction_count: 0, // Not provided by GeckoTerminal
      price_1hr_change: parseFloat(attributes.price_change_percentage?.h1 || '0'),
      price_24hr_change: parseFloat(attributes.price_change_percentage?.h24 || '0'),
      price_7d_change: parseFloat(attributes.price_change_percentage?.d7 || '0'),
      protocol: 'GeckoTerminal',
      source: 'geckoterminal',
      last_updated: Date.now(),
    };
  }
}
