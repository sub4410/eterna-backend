import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from './logger';

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class RetryableHttpClient {
  private axiosInstance: AxiosInstance;
  private maxRetries: number;
  private baseDelay: number;

  constructor(
    baseURL: string,
    maxRetries = 3,
    baseDelay = 1000
  ) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  private async exponentialBackoff(attempt: number): Promise<void> {
    const delay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    const totalDelay = delay + jitter;
    
    logger.debug(`Backing off for ${totalDelay}ms (attempt ${attempt + 1})`);
    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) return true; // Network error
    
    const status = error.response.status;
    return status === 429 || status >= 500;
  }

  async get<T>(url: string, params?: any): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.get<T>(url, { params });
        return response.data;
      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;

        if (axiosError.response?.status === 429) {
          logger.warn(`Rate limit hit on ${url}, attempt ${attempt + 1}`);
          throw new RateLimitError('Rate limit exceeded');
        }

        if (this.isRetryableError(axiosError) && attempt < this.maxRetries - 1) {
          logger.warn(`Request failed, retrying... (${attempt + 1}/${this.maxRetries})`, {
            url,
            error: axiosError.message,
          });
          await this.exponentialBackoff(attempt);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }
}
