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
export declare class CloudflareClient {
    private client;
    private config;
    constructor(config: CloudflareConfig);
    /**
     * Get authentication headers based on configuration
     */
    private getAuthHeaders;
    /**
     * Make a GET request
     */
    get<T = any>(path: string, params?: any): Promise<CloudflareResponse<T>>;
    /**
     * Make a POST request
     */
    post<T = any>(path: string, data?: any): Promise<CloudflareResponse<T>>;
    /**
     * Make a PUT request
     */
    put<T = any>(path: string, data?: any): Promise<CloudflareResponse<T>>;
    /**
     * Make a PATCH request
     */
    patch<T = any>(path: string, data?: any): Promise<CloudflareResponse<T>>;
    /**
     * Make a DELETE request
     */
    delete<T = any>(path: string): Promise<CloudflareResponse<T>>;
    /**
     * Verify API token
     */
    verifyToken(): Promise<boolean>;
    /**
     * Get user details
     */
    getUser(): Promise<any>;
    /**
     * List all zones with pagination support
     */
    listAllZones(params?: any): Promise<any[]>;
    /**
     * Get account ID (if not provided in config)
     */
    getAccountId(): Promise<string>;
}
//# sourceMappingURL=cloudflare-client.d.ts.map