interface PrismaConfig {
    databaseUrl?: string;
    databaseProvider?: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb' | 'cockroachdb';
    schemaPath?: string;
    migrationsDir?: string;
    enableLogging?: boolean;
    connectionLimit?: number;
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