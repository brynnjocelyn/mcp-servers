interface S3Config {
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    region?: string;
    sessionToken?: string;
    partSize?: number;
    pathStyle?: boolean;
}
/**
 * Loads S3 configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export declare function loadConfig(): S3Config;
/**
 * Get formatted endpoint URL for display
 */
export declare function getEndpointUrl(config: S3Config): string;
export {};
//# sourceMappingURL=config-loader.d.ts.map