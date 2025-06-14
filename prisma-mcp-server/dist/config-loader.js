"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.getSchemaDir = getSchemaDir;
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = require("dotenv");
/**
 * Loads Prisma configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
function loadConfig() {
    // Check for local config file
    const configPath = (0, path_1.join)(process.cwd(), '.prisma-mcp.json');
    let fileConfig = {};
    if ((0, fs_1.existsSync)(configPath)) {
        try {
            const configData = (0, fs_1.readFileSync)(configPath, 'utf-8');
            fileConfig = JSON.parse(configData);
            console.error('Loaded config from .prisma-mcp.json');
        }
        catch (error) {
            console.error('Error reading config file:', error);
        }
    }
    // Resolve project root if specified
    const projectRoot = fileConfig.projectRoot ?
        ((0, path_1.isAbsolute)(fileConfig.projectRoot) ?
            fileConfig.projectRoot :
            (0, path_1.resolve)(process.cwd(), fileConfig.projectRoot)) :
        process.cwd();
    // Load .env from project root if specified
    if (fileConfig.projectRoot) {
        const envPath = (0, path_1.join)(projectRoot, '.env');
        if ((0, fs_1.existsSync)(envPath)) {
            (0, dotenv_1.config)({ path: envPath });
            console.error(`Loaded .env from ${envPath}`);
        }
    }
    // Build database URL from components if provided
    let databaseUrl = fileConfig.databaseUrl || process.env.DATABASE_URL;
    // If connection components are provided, build the URL
    if (!databaseUrl && fileConfig.connection) {
        databaseUrl = buildDatabaseUrl(fileConfig.connection, fileConfig.databaseProvider);
    }
    // Build configuration with precedence
    const config = {
        projectRoot: projectRoot,
        databaseUrl: databaseUrl,
        databaseProvider: fileConfig.databaseProvider || detectDatabaseProvider(databaseUrl),
        schemaPath: resolvePathRelativeToRoot(fileConfig.schemaPath || process.env.PRISMA_SCHEMA_PATH || './prisma/schema.prisma', projectRoot),
        migrationsDir: resolvePathRelativeToRoot(fileConfig.migrationsDir || process.env.PRISMA_MIGRATIONS_DIR || './prisma/migrations', projectRoot),
        enableLogging: fileConfig.enableLogging !== undefined ? fileConfig.enableLogging : process.env.PRISMA_LOGGING === 'true',
        connectionLimit: fileConfig.connectionLimit || parseInt(process.env.PRISMA_CONNECTION_LIMIT || '10'),
        ssl: fileConfig.ssl || parseSSLConfig(),
        pool: fileConfig.pool || parsePoolConfig(),
        connection: fileConfig.connection
    };
    // Log configuration (mask sensitive data)
    logConfiguration(config);
    // Validate configuration
    validateConfiguration(config);
    return config;
}
/**
 * Resolve a path relative to the project root
 */
function resolvePathRelativeToRoot(path, projectRoot) {
    return (0, path_1.isAbsolute)(path) ? path : (0, path_1.resolve)(projectRoot, path);
}
/**
 * Detect database provider from connection URL
 */
function detectDatabaseProvider(databaseUrl) {
    if (!databaseUrl)
        return undefined;
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
        return 'postgresql';
    }
    else if (databaseUrl.startsWith('mysql://')) {
        return 'mysql';
    }
    else if (databaseUrl.startsWith('file:') || databaseUrl.endsWith('.db')) {
        return 'sqlite';
    }
    else if (databaseUrl.startsWith('sqlserver://')) {
        return 'sqlserver';
    }
    else if (databaseUrl.startsWith('mongodb://') || databaseUrl.startsWith('mongodb+srv://')) {
        return 'mongodb';
    }
    else if (databaseUrl.includes('cockroach')) {
        return 'cockroachdb';
    }
    return undefined;
}
/**
 * Get schema directory from schema path
 */
function getSchemaDir(schemaPath) {
    return (0, path_1.join)(schemaPath, '..');
}
/**
 * Build database URL from connection components
 */
function buildDatabaseUrl(connection, provider) {
    if (!connection || !connection.host)
        return undefined;
    const { host, port, database, user, password } = connection;
    const protocol = provider || 'postgresql';
    let url = `${protocol}://`;
    if (user) {
        url += user;
        if (password) {
            url += `:${password}`;
        }
        url += '@';
    }
    url += host;
    if (port) {
        url += `:${port}`;
    }
    if (database) {
        url += `/${database}`;
    }
    return url;
}
/**
 * Parse SSL configuration from environment variables
 */
function parseSSLConfig() {
    const sslEnabled = process.env.PRISMA_SSL_ENABLED === 'true' || process.env.DATABASE_SSL === 'true';
    if (!sslEnabled && !process.env.PRISMA_SSL_CA && !process.env.PRISMA_SSL_CERT) {
        return undefined;
    }
    return {
        enabled: sslEnabled,
        rejectUnauthorized: process.env.PRISMA_SSL_REJECT_UNAUTHORIZED !== 'false',
        ca: process.env.PRISMA_SSL_CA,
        cert: process.env.PRISMA_SSL_CERT,
        key: process.env.PRISMA_SSL_KEY
    };
}
/**
 * Parse connection pool configuration from environment variables
 */
function parsePoolConfig() {
    const hasPoolConfig = process.env.PRISMA_POOL_MIN || process.env.PRISMA_POOL_MAX;
    if (!hasPoolConfig) {
        return undefined;
    }
    return {
        min: process.env.PRISMA_POOL_MIN ? parseInt(process.env.PRISMA_POOL_MIN) : undefined,
        max: process.env.PRISMA_POOL_MAX ? parseInt(process.env.PRISMA_POOL_MAX) : undefined,
        acquire: process.env.PRISMA_POOL_ACQUIRE ? parseInt(process.env.PRISMA_POOL_ACQUIRE) : undefined,
        idle: process.env.PRISMA_POOL_IDLE ? parseInt(process.env.PRISMA_POOL_IDLE) : undefined
    };
}
/**
 * Log configuration with sensitive data masked
 */
function logConfiguration(config) {
    console.error('Prisma MCP Server Configuration:');
    console.error(`  Project Root: ${config.projectRoot}`);
    console.error(`  Schema Path: ${config.schemaPath}`);
    console.error(`  Database Provider: ${config.databaseProvider || 'Auto-detected'}`);
    console.error(`  Database URL: ${maskDatabaseUrl(config.databaseUrl)}`);
    console.error(`  SSL Enabled: ${config.ssl?.enabled || false}`);
    console.error(`  Connection Pool Max: ${config.pool?.max || config.connectionLimit || 10}`);
    console.error(`  Logging Enabled: ${config.enableLogging || false}`);
}
/**
 * Mask sensitive parts of database URL
 */
function maskDatabaseUrl(url) {
    if (!url)
        return 'Not configured';
    try {
        const urlObj = new URL(url.replace('postgresql://', 'https://').replace('mysql://', 'https://'));
        if (urlObj.password) {
            urlObj.password = '****';
        }
        return urlObj.toString().replace('https://', url.split('://')[0] + '://');
    }
    catch {
        // Fallback for non-standard URLs
        return url.replace(/:[^:@]+@/, ':****@');
    }
}
/**
 * Validate configuration and provide helpful error messages
 */
function validateConfiguration(config) {
    // Check for database URL
    if (!config.databaseUrl) {
        console.error('\n⚠️  WARNING: No database URL configured!');
        console.error('Please configure your database connection using one of these methods:');
        console.error('  1. Set DATABASE_URL environment variable');
        console.error('  2. Add "databaseUrl" to .prisma-mcp.json');
        console.error('  3. Configure connection components in .prisma-mcp.json');
        console.error('\nExample .prisma-mcp.json:');
        console.error(JSON.stringify({
            databaseUrl: "postgresql://user:password@localhost:5432/mydb",
            ssl: { enabled: true }
        }, null, 2));
    }
    // Check schema file exists
    if (!(0, fs_1.existsSync)(config.schemaPath)) {
        console.error(`\n⚠️  WARNING: Schema file not found at ${config.schemaPath}`);
        console.error('Prisma init will be required to create the schema file.');
    }
}
//# sourceMappingURL=config-loader.js.map