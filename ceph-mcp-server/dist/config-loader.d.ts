/**
 * Configuration for the Ceph MCP Server
 */
export interface CephConfig {
    cluster_name?: string;
    monitor_hosts?: string[];
    username?: string;
    keyring_path?: string;
    api_url?: string;
    api_username?: string;
    api_password?: string;
    api_key?: string;
    timeout?: number;
    pool_name?: string;
    enable_s3?: boolean;
    enable_rbd?: boolean;
    enable_cephfs?: boolean;
}
/**
 * Loads configuration from multiple sources with precedence
 */
export declare function loadConfig(): CephConfig;
//# sourceMappingURL=config-loader.d.ts.map