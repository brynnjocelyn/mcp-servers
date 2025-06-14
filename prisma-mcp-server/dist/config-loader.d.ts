interface PrismaConfig {
    projectRoot?: string;
    databaseUrl?: string;
    databaseProvider?: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb' | 'cockroachdb';
    schemaPath?: string;
    migrationsDir?: string;
    enableLogging?: boolean;
    connectionLimit?: number;
    ssl?: {
        enabled?: boolean;
        rejectUnauthorized?: boolean;
        ca?: string;
        cert?: string;
        key?: string;
    };
    pool?: {
        min?: number;
        max?: number;
        acquire?: number;
        idle?: number;
    };
    connection?: {
        host?: string;
        port?: number;
        database?: string;
        user?: string;
        password?: string;
    };
}
/**
 * Loads Prisma configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export declare function loadConfig(): PrismaConfig;
/**
 * Get schema directory from schema path
 */
export declare function getSchemaDir(schemaPath: string): string;
export {};
//# sourceMappingURL=config-loader.d.ts.map