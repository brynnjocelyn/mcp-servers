export interface ExecResult {
    stdout: string;
    stderr: string;
}
/**
 * Service for managing Prisma operations
 */
export declare class PrismaService {
    private schemaPath;
    private migrationsDir;
    private projectRoot;
    constructor(schemaPath: string, migrationsDir: string, projectRoot?: string);
    /**
     * Execute a Prisma CLI command
     */
    executePrismaCommand(command: string): Promise<ExecResult>;
    /**
     * Get the full schema path, handling both absolute and relative paths
     */
    private getFullSchemaPath;
    /**
     * Read the Prisma schema file
     */
    readSchema(): string;
    /**
     * Write to the Prisma schema file
     */
    writeSchema(content: string): void;
    /**
     * Check if schema file exists
     */
    schemaExists(): boolean;
    /**
     * Initialize a new Prisma project
     */
    init(datasourceProvider?: string): Promise<void>;
    /**
     * Format the Prisma schema
     */
    format(): Promise<void>;
    /**
     * Validate the Prisma schema
     */
    validate(): Promise<void>;
    /**
     * Generate Prisma Client
     */
    generate(): Promise<void>;
    /**
     * Pull database schema
     */
    dbPull(): Promise<void>;
    /**
     * Push schema changes without migrations
     */
    dbPush(acceptDataLoss?: boolean): Promise<ExecResult>;
    /**
     * Create a new migration
     */
    migrateCreate(name: string): Promise<void>;
    /**
     * Apply migrations in development
     */
    migrateDev(name?: string): Promise<ExecResult>;
    /**
     * Deploy migrations in production
     */
    migrateDeploy(): Promise<void>;
    /**
     * Reset database
     */
    migrateReset(force?: boolean): Promise<void>;
    /**
     * Get migration status
     */
    migrateStatus(): Promise<string>;
    /**
     * Resolve migration issues
     */
    migrateResolve(applied?: string, rolledBack?: string): Promise<void>;
    /**
     * Get schema diff
     */
    migrateDiff(from: string, to: string, script?: boolean): Promise<string>;
    /**
     * Seed the database
     */
    seed(): Promise<void>;
    /**
     * Execute raw SQL
     */
    executeRaw(query: string): Promise<any>;
    /**
     * Parse schema to extract models
     */
    parseSchema(): {
        models: string[];
        enums: string[];
    };
}
//# sourceMappingURL=prisma-service.d.ts.map