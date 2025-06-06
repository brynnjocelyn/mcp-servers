"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = require("fs");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Service for managing Prisma operations
 */
class PrismaService {
    schemaPath;
    migrationsDir;
    constructor(schemaPath, migrationsDir) {
        this.schemaPath = schemaPath;
        this.migrationsDir = migrationsDir;
    }
    /**
     * Execute a Prisma CLI command
     */
    async executePrismaCommand(command) {
        try {
            const { stdout, stderr } = await execAsync(`npx prisma ${command}`, {
                env: {
                    ...process.env,
                    PRISMA_SCHEMA_PATH: this.schemaPath
                }
            });
            return { stdout, stderr };
        }
        catch (error) {
            const execError = error;
            throw new Error(`Prisma command failed: ${execError.message}\n${execError.stderr || ''}`);
        }
    }
    /**
     * Read the Prisma schema file
     */
    readSchema() {
        if (!(0, fs_1.existsSync)(this.schemaPath)) {
            throw new Error(`Schema file not found at ${this.schemaPath}`);
        }
        return (0, fs_1.readFileSync)(this.schemaPath, 'utf-8');
    }
    /**
     * Write to the Prisma schema file
     */
    writeSchema(content) {
        (0, fs_1.writeFileSync)(this.schemaPath, content, 'utf-8');
    }
    /**
     * Check if schema file exists
     */
    schemaExists() {
        return (0, fs_1.existsSync)(this.schemaPath);
    }
    /**
     * Initialize a new Prisma project
     */
    async init(datasourceProvider = 'postgresql') {
        const result = await this.executePrismaCommand(`init --datasource-provider ${datasourceProvider}`);
        if (result.stderr && !result.stderr.includes('success')) {
            throw new Error(`Failed to initialize Prisma: ${result.stderr}`);
        }
    }
    /**
     * Format the Prisma schema
     */
    async format() {
        await this.executePrismaCommand('format');
    }
    /**
     * Validate the Prisma schema
     */
    async validate() {
        await this.executePrismaCommand('validate');
    }
    /**
     * Generate Prisma Client
     */
    async generate() {
        await this.executePrismaCommand('generate');
    }
    /**
     * Pull database schema
     */
    async dbPull() {
        await this.executePrismaCommand('db pull');
    }
    /**
     * Push schema changes without migrations
     */
    async dbPush(acceptDataLoss = false) {
        const command = acceptDataLoss ? 'db push --accept-data-loss' : 'db push';
        return await this.executePrismaCommand(command);
    }
    /**
     * Create a new migration
     */
    async migrateCreate(name) {
        await this.executePrismaCommand(`migrate dev --name ${name} --create-only`);
    }
    /**
     * Apply migrations in development
     */
    async migrateDev(name) {
        const command = name ? `migrate dev --name ${name}` : 'migrate dev';
        return await this.executePrismaCommand(command);
    }
    /**
     * Deploy migrations in production
     */
    async migrateDeploy() {
        await this.executePrismaCommand('migrate deploy');
    }
    /**
     * Reset database
     */
    async migrateReset(force = false) {
        const command = force ? 'migrate reset --force' : 'migrate reset';
        await this.executePrismaCommand(command);
    }
    /**
     * Get migration status
     */
    async migrateStatus() {
        const result = await this.executePrismaCommand('migrate status');
        return result.stdout;
    }
    /**
     * Resolve migration issues
     */
    async migrateResolve(applied, rolledBack) {
        let command = 'migrate resolve';
        if (applied)
            command += ` --applied ${applied}`;
        if (rolledBack)
            command += ` --rolled-back ${rolledBack}`;
        await this.executePrismaCommand(command);
    }
    /**
     * Get schema diff
     */
    async migrateDiff(from, to, script = false) {
        const scriptFlag = script ? '--script' : '';
        const result = await this.executePrismaCommand(`migrate diff --from-${from} --to-${to} ${scriptFlag}`);
        return result.stdout;
    }
    /**
     * Seed the database
     */
    async seed() {
        await this.executePrismaCommand('db seed');
    }
    /**
     * Execute raw SQL
     */
    async executeRaw(query) {
        // This would require a Prisma Client instance
        // For now, we'll return a placeholder
        throw new Error('Raw query execution requires an active Prisma Client instance');
    }
    /**
     * Parse schema to extract models
     */
    parseSchema() {
        const schema = this.readSchema();
        const models = [];
        const enums = [];
        // Simple regex parsing for models
        const modelRegex = /model\s+(\w+)\s*{/g;
        let match;
        while ((match = modelRegex.exec(schema)) !== null) {
            models.push(match[1]);
        }
        // Simple regex parsing for enums
        const enumRegex = /enum\s+(\w+)\s*{/g;
        while ((match = enumRegex.exec(schema)) !== null) {
            enums.push(match[1]);
        }
        return { models, enums };
    }
}
exports.PrismaService = PrismaService;
//# sourceMappingURL=prisma-service.js.map