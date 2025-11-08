export interface TokenData {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  market_cap_sol: number;
  volume_sol: number;
  liquidity_sol: number;
  transaction_count: number;
  price_1hr_change: number;
  protocol: string;
  source?: string;
  last_updated?: number;
  price_24hr_change?: number;
  price_7d_change?: number;
}

export interface AggregatedToken extends TokenData {
  sources: string[];
  aggregated_at: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  total: number;
}

export interface FilterOptions {
  timeframe?: '1h' | '24h' | '7d';
  sortBy?: 'volume' | 'price_change' | 'market_cap' | 'liquidity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
  minVolume?: number;
  minLiquidity?: number;
}

export interface WebSocketUpdate {
  type: 'price_update' | 'volume_spike' | 'new_token';
  token: TokenData;
  timestamp: number;
}
