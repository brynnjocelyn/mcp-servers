/**
 * Jenkins MCP Server Configuration
 */
export interface JenkinsConfig {
    url: string;
    username?: string;
    password?: string;
    apiToken?: string;
    timeout?: number;
    verifySsl?: boolean;
    projectRoot?: string;
    maxRetries?: number;
}
/**
 * Load configuration from multiple sources
 */
export declare function loadConfig(): JenkinsConfig;
//# sourceMappingURL=config-loader.d.ts.map