"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.getSchemaDir = getSchemaDir;
const fs_1 = require("fs");
const path_1 = require("path");
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
    // Build configuration with precedence
    const config = {
        databaseUrl: fileConfig.databaseUrl || process.env.DATABASE_URL,
        databaseProvider: fileConfig.databaseProvider || detectDatabaseProvider(fileConfig.databaseUrl || process.env.DATABASE_URL),
        schemaPath: fileConfig.schemaPath || process.env.PRISMA_SCHEMA_PATH || (0, path_1.join)(process.cwd(), 'prisma', 'schema.prisma'),
        migrationsDir: fileConfig.migrationsDir || process.env.PRISMA_MIGRATIONS_DIR || (0, path_1.join)(process.cwd(), 'prisma', 'migrations'),
        enableLogging: fileConfig.enableLogging !== undefined ? fileConfig.enableLogging : process.env.PRISMA_LOGGING === 'true',
        connectionLimit: fileConfig.connectionLimit || parseInt(process.env.PRISMA_CONNECTION_LIMIT || '10')
    };
    return config;
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
//# sourceMappingURL=config-loader.js.map