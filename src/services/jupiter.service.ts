import { RetryableHttpClient } from '../utils/httpClient';
import { TokenData } from '../types';
import logger from '../utils/logger';

interface JupiterPriceResponse {
  data: {
    [key: string]: {
      id: string;
      mintSymbol: string;
      vsToken: string;
      vsTokenSymbol: string;
      price: number;
    };
  };
}

export class JupiterClient {
  private client: RetryableHttpClient;
  private readonly baseURL = 'https://price.jup.ag';

  constructor() {
    this.client = new RetryableHttpClient(this.baseURL, 3, 1000);
  }

  async getTokenPrices(tokenIds: string[]): Promise<Map<string, number>> {
    try {
      if (tokenIds.length === 0) return new Map();

      const ids = tokenIds.join(',');
      const data = await this.client.get<JupiterPriceResponse>(
        `/v4/price`,
        { ids }
      );

      const priceMap = new Map<string, number>();
      
      if (data.data) {
        Object.entries(data.data).forEach(([id, priceInfo]) => {
          priceMap.set(id, priceInfo.price);
        });
      }

      return priceMap;
    } catch (error) {
      logger.error('Jupiter price fetch failed', { tokenIds, error });
      return new Map();
    }
  }

  async enrichTokenData(tokens: TokenData[]): Promise<TokenData[]> {
    try {
      const addresses = tokens.map(t => t.token_address);
      const prices = await this.getTokenPrices(addresses);

      return tokens.map(token => {
        const jupiterPrice = prices.get(token.token_address);
        if (jupiterPrice) {
          return {
            ...token,
            price_sol: jupiterPrice,
            source: token.source ? `${token.source},jupiter` : 'jupiter',
          };
        }
        return token;
      });
    } catch (error) {
      logger.error('Jupiter enrichment failed', { error });
      return tokens;
    }
  }
}
