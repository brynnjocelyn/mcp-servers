interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    username?: string;
    db?: number;
    family?: 4 | 6;
    connectTimeout?: number;
    commandTimeout?: number;
    keepAlive?: number;
    noDelay?: boolean;
    connectionName?: string;
    tls?: {
        rejectUnauthorized?: boolean;
        ca?: string;
        cert?: string;
        key?: string;
        checkServerIdentity?: boolean;
    };
    sentinels?: Array<{
        host: string;
        port: number;
    }>;
    sentinelName?: string;
    sentinelPassword?: string;
    cluster?: boolean;
    clusterNodes?: Array<{
        host: string;
        port: number;
    }>;
    maxRetriesPerRequest?: number;
    enableReadyCheck?: boolean;
    enableOfflineQueue?: boolean;
    lazyConnect?: boolean;
    keyPrefix?: string;
}
/**
 * Loads Redis configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export declare function loadConfig(): RedisConfig;
/**
 * Get connection options for ioredis
 */
export declare function getRedisOptions(): any;
export {};
//# sourceMappingURL=config-loader.d.ts.map