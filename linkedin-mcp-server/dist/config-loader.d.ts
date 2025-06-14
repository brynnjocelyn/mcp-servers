export interface LinkedInConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
}
/**
 * Load configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 * @returns LinkedInConfig object
 */
export declare function loadConfig(): LinkedInConfig;
/**
 * Save updated configuration (primarily for tokens)
 * @param updates Partial configuration to update
 */
export declare function saveConfig(updates: Partial<LinkedInConfig>): void;
//# sourceMappingURL=config-loader.d.ts.map