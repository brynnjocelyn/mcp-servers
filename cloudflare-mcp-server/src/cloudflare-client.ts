import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { CloudflareConfig } from './config-loader.js';

export interface CloudflareResponse<T = any> {
  success: boolean;
  errors: any[];
  messages: any[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    count: number;
    total_count: number;
  };
}

export class CloudflareClient {
  private client: AxiosInstance;
  private config: CloudflareConfig;

  constructor(config: CloudflareConfig) {
    this.config = config;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: this.getAuthHeaders()
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.data) {
          const cfError = error.response.data;
          const errorMessages = cfError.errors?.map((e: any) => e.message).join(', ') || 'Unknown error';
          throw new Error(`Cloudflare API error: ${errorMessages}`);
        }
        throw error;
      }
    );
  }

  /**
   * Get authentication headers based on configuration
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiToken) {
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    } else if (this.config.apiKey && this.config.email) {
      headers['X-Auth-Key'] = this.config.apiKey;
      headers['X-Auth-Email'] = this.config.email;
    }

    return headers;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(path: string, params?: any): Promise<CloudflareResponse<T>> {
    const response = await this.client.get<CloudflareResponse<T>>(path, { params });
    return response.data;
  }

  /**
   * Make a POST request
   */
  async post<T = any>(path: string, data?: any): Promise<CloudflareResponse<T>> {
    const response = await this.client.post<CloudflareResponse<T>>(path, data);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(path: string, data?: any): Promise<CloudflareResponse<T>> {
    const response = await this.client.put<CloudflareResponse<T>>(path, data);
    return response.data;
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(path: string, data?: any): Promise<CloudflareResponse<T>> {
    const response = await this.client.patch<CloudflareResponse<T>>(path, data);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(path: string): Promise<CloudflareResponse<T>> {
    const response = await this.client.delete<CloudflareResponse<T>>(path);
    return response.data;
  }

  /**
   * Verify API token
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await this.get('/user/tokens/verify');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user details
   */
  async getUser(): Promise<any> {
    const response = await this.get('/user');
    return response.result;
  }

  /**
   * List all zones with pagination support
   */
  async listAllZones(params?: any): Promise<any[]> {
    const allZones: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.get('/zones', { ...params, page, per_page: 50 });
      allZones.push(...response.result);
      
      if (response.result_info) {
        hasMore = page * response.result_info.per_page < response.result_info.total_count;
        page++;
      } else {
        hasMore = false;
      }
    }

    return allZones;
  }

  /**
   * Get account ID (if not provided in config)
   */
  async getAccountId(): Promise<string> {
    if (this.config.accountId) {
      return this.config.accountId;
    }

    const user = await this.getUser();
    if (user.accounts && user.accounts.length > 0) {
      return user.accounts[0].id;
    }

    throw new Error('No account ID found');
  }
}