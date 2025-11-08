import { RetryableHttpClient, RateLimitError } from '../utils/httpClient';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RetryableHttpClient', () => {
  let client: RetryableHttpClient;

  beforeEach(() => {
    client = new RetryableHttpClient('https://api.example.com', 3, 100);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('get method', () => {
    it('should successfully fetch data on first attempt', async () => {
      const mockData = { data: 'test' };
      mockedAxios.create = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockData }),
      });

      client = new RetryableHttpClient('https://api.example.com');
      const result = await client.get('/test');

      expect(result).toEqual(mockData);
    });

    it('should throw RateLimitError on 429 status', async () => {
      mockedAxios.create = jest.fn().mockReturnValue({
        get: jest.fn().mockRejectedValue({
          response: { status: 429 },
          isAxiosError: true,
        }),
      });

      client = new RetryableHttpClient('https://api.example.com');

      await expect(client.get('/test')).rejects.toThrow(RateLimitError);
    });

    it('should retry on 500 error', async () => {
      const mockAxiosInstance = {
        get: jest.fn()
          .mockRejectedValueOnce({
            response: { status: 500 },
            isAxiosError: true,
          })
          .mockResolvedValueOnce({ data: { success: true } }),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      client = new RetryableHttpClient('https://api.example.com', 3, 50);

      const result = await client.get('/test');

      expect(result).toEqual({ success: true });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      const mockError = {
        response: { status: 500 },
        isAxiosError: true,
        message: 'Server error',
      };

      mockedAxios.create = jest.fn().mockReturnValue({
        get: jest.fn().mockRejectedValue(mockError),
      });

      client = new RetryableHttpClient('https://api.example.com', 2, 50);

      await expect(client.get('/test')).rejects.toMatchObject(mockError);
    });

    it('should handle network errors with retry', async () => {
      const mockAxiosInstance = {
        get: jest.fn()
          .mockRejectedValueOnce({
            isAxiosError: true,
            message: 'Network Error',
          })
          .mockResolvedValueOnce({ data: { success: true } }),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      client = new RetryableHttpClient('https://api.example.com', 3, 50);

      const result = await client.get('/test');

      expect(result).toEqual({ success: true });
    });
  });

  describe('post method', () => {
    it('should successfully post data', async () => {
      const mockData = { id: 1, name: 'test' };
      mockedAxios.create = jest.fn().mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockData }),
      });

      client = new RetryableHttpClient('https://api.example.com');
      const result = await client.post('/test', { name: 'test' });

      expect(result).toEqual(mockData);
    });
  });
});
