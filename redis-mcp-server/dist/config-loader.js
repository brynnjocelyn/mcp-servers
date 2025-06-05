import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
/**
 * Loads Redis configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export function loadConfig() {
    // Check for local config file
    const configPath = join(process.cwd(), '.redis-mcp.json');
    let fileConfig = {};
    if (existsSync(configPath)) {
        try {
            const configData = readFileSync(configPath, 'utf-8');
            fileConfig = JSON.parse(configData);
            console.error('Loaded config from .redis-mcp.json');
        }
        catch (error) {
            console.error('Error reading config file:', error);
        }
    }
    // Check for Redis URL (common in cloud environments)
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
    if (redisUrl && !fileConfig.host) {
        try {
            const url = new URL(redisUrl);
            fileConfig.host = url.hostname;
            fileConfig.port = parseInt(url.port) || 6379;
            if (url.password) {
                fileConfig.password = url.password;
            }
            if (url.username) {
                fileConfig.username = url.username;
            }
            if (url.pathname && url.pathname.length > 1) {
                fileConfig.db = parseInt(url.pathname.substring(1));
            }
            if (url.protocol === 'rediss:') {
                fileConfig.tls = fileConfig.tls || {};
            }
        }
        catch (error) {
            console.error('Error parsing Redis URL:', error);
        }
    }
    // Build configuration with precedence
    const config = {
        host: fileConfig.host || process.env.REDIS_HOST || 'localhost',
        port: fileConfig.port || parseInt(process.env.REDIS_PORT || '6379'),
        password: fileConfig.password || process.env.REDIS_PASSWORD,
        username: fileConfig.username || process.env.REDIS_USERNAME,
        db: fileConfig.db !== undefined ? fileConfig.db : parseInt(process.env.REDIS_DB || '0'),
        family: fileConfig.family || 4,
        connectTimeout: fileConfig.connectTimeout || 20000,
        commandTimeout: fileConfig.commandTimeout || 20000,
        keepAlive: fileConfig.keepAlive || 30000,
        noDelay: fileConfig.noDelay !== undefined ? fileConfig.noDelay : true,
        connectionName: fileConfig.connectionName || 'redis-mcp-server',
        maxRetriesPerRequest: fileConfig.maxRetriesPerRequest || 3,
        enableReadyCheck: fileConfig.enableReadyCheck !== undefined ? fileConfig.enableReadyCheck : true,
        enableOfflineQueue: fileConfig.enableOfflineQueue !== undefined ? fileConfig.enableOfflineQueue : true,
        lazyConnect: fileConfig.lazyConnect || false,
        keyPrefix: fileConfig.keyPrefix || process.env.REDIS_KEY_PREFIX
    };
    // Handle TLS configuration
    if (fileConfig.tls || process.env.REDIS_TLS === 'true' || process.env.REDIS_TLS_URL) {
        config.tls = {
            rejectUnauthorized: fileConfig.tls?.rejectUnauthorized !== undefined
                ? fileConfig.tls.rejectUnauthorized
                : process.env.NODE_ENV === 'production',
            ...fileConfig.tls
        };
        // Load TLS files if paths are provided
        if (config.tls.ca && typeof config.tls.ca === 'string' && existsSync(config.tls.ca)) {
            config.tls.ca = readFileSync(config.tls.ca, 'utf-8');
        }
        if (config.tls.cert && typeof config.tls.cert === 'string' && existsSync(config.tls.cert)) {
            config.tls.cert = readFileSync(config.tls.cert, 'utf-8');
        }
        if (config.tls.key && typeof config.tls.key === 'string' && existsSync(config.tls.key)) {
            config.tls.key = readFileSync(config.tls.key, 'utf-8');
        }
    }
    // Handle Sentinel configuration
    if (fileConfig.sentinels || process.env.REDIS_SENTINELS) {
        if (process.env.REDIS_SENTINELS && !fileConfig.sentinels) {
            try {
                config.sentinels = JSON.parse(process.env.REDIS_SENTINELS);
            }
            catch {
                // Parse comma-separated host:port pairs
                config.sentinels = process.env.REDIS_SENTINELS.split(',').map(s => {
                    const [host, port] = s.trim().split(':');
                    return { host, port: parseInt(port) || 26379 };
                });
            }
        }
        else {
            config.sentinels = fileConfig.sentinels;
        }
        config.sentinelName = fileConfig.sentinelName || process.env.REDIS_SENTINEL_NAME || 'mymaster';
        config.sentinelPassword = fileConfig.sentinelPassword || process.env.REDIS_SENTINEL_PASSWORD;
    }
    // Handle Cluster configuration
    if (fileConfig.cluster || process.env.REDIS_CLUSTER === 'true') {
        config.cluster = true;
        if (process.env.REDIS_CLUSTER_NODES && !fileConfig.clusterNodes) {
            try {
                config.clusterNodes = JSON.parse(process.env.REDIS_CLUSTER_NODES);
            }
            catch {
                // Parse comma-separated host:port pairs
                config.clusterNodes = process.env.REDIS_CLUSTER_NODES.split(',').map(s => {
                    const [host, port] = s.trim().split(':');
                    return { host, port: parseInt(port) || 6379 };
                });
            }
        }
        else {
            config.clusterNodes = fileConfig.clusterNodes;
        }
    }
    return config;
}
/**
 * Get connection options for ioredis
 */
export function getRedisOptions() {
    const config = loadConfig();
    // For cluster mode
    if (config.cluster && config.clusterNodes) {
        return {
            clusters: config.clusterNodes,
            redisOptions: {
                password: config.password,
                username: config.username,
                tls: config.tls,
                connectionName: config.connectionName,
                commandTimeout: config.commandTimeout,
                keyPrefix: config.keyPrefix
            }
        };
    }
    // For sentinel mode
    if (config.sentinels) {
        return {
            sentinels: config.sentinels,
            name: config.sentinelName,
            sentinelPassword: config.sentinelPassword,
            password: config.password,
            username: config.username,
            db: config.db,
            tls: config.tls,
            connectionName: config.connectionName,
            commandTimeout: config.commandTimeout,
            keyPrefix: config.keyPrefix
        };
    }
    // For standard mode
    return {
        host: config.host,
        port: config.port,
        password: config.password,
        username: config.username,
        db: config.db,
        family: config.family,
        connectTimeout: config.connectTimeout,
        commandTimeout: config.commandTimeout,
        keepAlive: config.keepAlive,
        noDelay: config.noDelay,
        connectionName: config.connectionName,
        tls: config.tls,
        maxRetriesPerRequest: config.maxRetriesPerRequest,
        enableReadyCheck: config.enableReadyCheck,
        enableOfflineQueue: config.enableOfflineQueue,
        lazyConnect: config.lazyConnect,
        keyPrefix: config.keyPrefix
    };
}
//# sourceMappingURL=config-loader.js.map