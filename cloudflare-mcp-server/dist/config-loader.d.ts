export interface CloudflareConfig {
    apiToken?: string;
    apiKey?: string;
    email?: string;
    accountId?: string;
    zoneId?: string;
    baseUrl?: string;
    timeout?: number;
}
/**
 * Loads Cloudflare configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export declare function loadConfig(): CloudflareConfig;
//# sourceMappingURL=config-loader.d.ts.map