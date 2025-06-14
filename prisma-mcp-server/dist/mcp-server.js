#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const zod_1 = require("zod");
const zod_to_json_schema_1 = require("zod-to-json-schema");
const config_loader_js_1 = require("./config-loader.js");
const prisma_service_js_1 = require("./prisma-service.js");
const fs_1 = require("fs");
const path_1 = require("path");
// Tool parameter schemas
const InitSchema = zod_1.z.object({
    provider: zod_1.z.enum(['postgresql', 'mysql', 'sqlite', 'sqlserver', 'mongodb', 'cockroachdb']).optional()
        .describe('Database provider to use'),
});
const ReadSchemaSchema = zod_1.z.object({});
const WriteSchemaSchema = zod_1.z.object({
    content: zod_1.z.string().describe('The Prisma schema content'),
});
const FormatSchemaSchema = zod_1.z.object({});
const ValidateSchemaSchema = zod_1.z.object({});
const GenerateClientSchema = zod_1.z.object({});
const DbPullSchema = zod_1.z.object({});
const DbPushSchema = zod_1.z.object({
    acceptDataLoss: zod_1.z.boolean().optional().default(false)
        .describe('Accept data loss when pushing schema changes'),
});
const MigrateCreateSchema = zod_1.z.object({
    name: zod_1.z.string().describe('Name for the migration'),
});
const MigrateDevSchema = zod_1.z.object({
    name: zod_1.z.string().optional().describe('Name for the migration'),
});
const MigrateDeploySchema = zod_1.z.object({});
const MigrateResetSchema = zod_1.z.object({
    force: zod_1.z.boolean().optional().default(false)
        .describe('Skip confirmation prompt'),
});
const MigrateStatusSchema = zod_1.z.object({});
const MigrateResolveSchema = zod_1.z.object({
    applied: zod_1.z.string().optional().describe('Mark migration as applied'),
    rolledBack: zod_1.z.string().optional().describe('Mark migration as rolled back'),
});
const MigrateDiffSchema = zod_1.z.object({
    from: zod_1.z.string().describe('Source to compare from (schema, database, migrations, etc)'),
    to: zod_1.z.string().describe('Target to compare to'),
    script: zod_1.z.boolean().optional().default(false).describe('Output as SQL script'),
});
const SeedDatabaseSchema = zod_1.z.object({});
const ListModelsSchema = zod_1.z.object({});
const ExecuteRawSchema = zod_1.z.object({
    query: zod_1.z.string().describe('Raw SQL query to execute'),
    parameters: zod_1.z.array(zod_1.z.any()).optional().describe('Query parameters'),
});
const FindManySchema = zod_1.z.object({
    model: zod_1.z.string().describe('Model name to query'),
    where: zod_1.z.record(zod_1.z.any()).optional().describe('Filter conditions'),
    select: zod_1.z.record(zod_1.z.boolean()).optional().describe('Fields to select'),
    include: zod_1.z.record(zod_1.z.any()).optional().describe('Relations to include'),
    orderBy: zod_1.z.record(zod_1.z.enum(['asc', 'desc'])).optional().describe('Sort order'),
    skip: zod_1.z.number().optional().describe('Number of records to skip'),
    take: zod_1.z.number().optional().describe('Number of records to take'),
});
const FindUniqueSchema = zod_1.z.object({
    model: zod_1.z.string().describe('Model name to query'),
    where: zod_1.z.record(zod_1.z.any()).describe('Unique identifier'),
    select: zod_1.z.record(zod_1.z.boolean()).optional().describe('Fields to select'),
    include: zod_1.z.record(zod_1.z.any()).optional().describe('Relations to include'),
});
const CreateSchema = zod_1.z.object({
    model: zod_1.z.string().describe('Model name'),
    data: zod_1.z.record(zod_1.z.any()).describe('Data to create'),
    select: zod_1.z.record(zod_1.z.boolean()).optional().describe('Fields to select'),
    include: zod_1.z.record(zod_1.z.any()).optional().describe('Relations to include'),
});
const UpdateSchema = zod_1.z.object({
    model: zod_1.z.string().describe('Model name'),
    where: zod_1.z.record(zod_1.z.any()).describe('Record identifier'),
    data: zod_1.z.record(zod_1.z.any()).describe('Data to update'),
    select: zod_1.z.record(zod_1.z.boolean()).optional().describe('Fields to select'),
    include: zod_1.z.record(zod_1.z.any()).optional().describe('Relations to include'),
});
const DeleteSchema = zod_1.z.object({
    model: zod_1.z.string().describe('Model name'),
    where: zod_1.z.record(zod_1.z.any()).describe('Record identifier'),
});
const CountSchema = zod_1.z.object({
    model: zod_1.z.string().describe('Model name'),
    where: zod_1.z.record(zod_1.z.any()).optional().describe('Filter conditions'),
});
const AggregateSchema = zod_1.z.object({
    model: zod_1.z.string().describe('Model name'),
    where: zod_1.z.record(zod_1.z.any()).optional().describe('Filter conditions'),
    _count: zod_1.z.boolean().optional().describe('Include count'),
    _sum: zod_1.z.record(zod_1.z.boolean()).optional().describe('Fields to sum'),
    _avg: zod_1.z.record(zod_1.z.boolean()).optional().describe('Fields to average'),
    _min: zod_1.z.record(zod_1.z.boolean()).optional().describe('Fields to get minimum'),
    _max: zod_1.z.record(zod_1.z.boolean()).optional().describe('Fields to get maximum'),
});
/**
 * Create an MCP server for Prisma operations
 */
const server = new index_js_1.Server({
    name: 'prisma-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Load configuration
const config = (0, config_loader_js_1.loadConfig)();
const prismaService = new prisma_service_js_1.PrismaService(config.schemaPath || 'prisma/schema.prisma', config.migrationsDir || 'prisma/migrations', config.projectRoot);
// Dynamic Prisma Client instance (only created when schema exists and is valid)
let prisma = null;
/**
 * Initialize Prisma Client if schema exists
 */
async function initializePrismaClient() {
    try {
        if (prismaService.schemaExists()) {
            await prismaService.generate();
            // Dynamically import Prisma Client from project root
            const prismaClientPath = config.projectRoot ?
                (0, path_1.join)(config.projectRoot, 'node_modules', '@prisma/client') :
                '@prisma/client';
            const { PrismaClient } = await Promise.resolve(`${prismaClientPath}`).then(s => __importStar(require(s)));
            prisma = new PrismaClient({
                log: config.enableLogging ? ['query', 'info', 'warn', 'error'] : [],
            });
            await prisma.$connect();
            console.error(`Prisma Client initialized successfully from ${prismaClientPath}`);
        }
    }
    catch (error) {
        console.error('Failed to initialize Prisma Client:', error);
        prisma = null;
    }
}
// Initialize on startup
initializePrismaClient().catch(console.error);
/**
 * Handler for tool requests
 */
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            // Schema Management Tools
            {
                name: 'init_prisma',
                description: 'Initialize a new Prisma project with schema and configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(InitSchema),
            },
            {
                name: 'read_schema',
                description: 'Read the current Prisma schema file',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ReadSchemaSchema),
            },
            {
                name: 'write_schema',
                description: 'Write or update the Prisma schema file',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(WriteSchemaSchema),
            },
            {
                name: 'format_schema',
                description: 'Format the Prisma schema file',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(FormatSchemaSchema),
            },
            {
                name: 'validate_schema',
                description: 'Validate the Prisma schema syntax and consistency',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ValidateSchemaSchema),
            },
            {
                name: 'generate_client',
                description: 'Generate or regenerate the Prisma Client',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GenerateClientSchema),
            },
            // Database Management Tools
            {
                name: 'db_pull',
                description: 'Pull the database schema and update Prisma schema',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DbPullSchema),
            },
            {
                name: 'db_push',
                description: 'Push Prisma schema changes to the database without migrations',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DbPushSchema),
            },
            // Migration Tools
            {
                name: 'migrate_create',
                description: 'Create a new migration without applying it',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(MigrateCreateSchema),
            },
            {
                name: 'migrate_dev',
                description: 'Create and apply migrations in development',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(MigrateDevSchema),
            },
            {
                name: 'migrate_deploy',
                description: 'Apply pending migrations in production',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(MigrateDeploySchema),
            },
            {
                name: 'migrate_reset',
                description: 'Reset the database and reapply all migrations',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(MigrateResetSchema),
            },
            {
                name: 'migrate_status',
                description: 'Check the status of migrations',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(MigrateStatusSchema),
            },
            {
                name: 'migrate_resolve',
                description: 'Resolve migration issues by marking as applied or rolled back',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(MigrateResolveSchema),
            },
            {
                name: 'migrate_diff',
                description: 'Compare schema differences between sources',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(MigrateDiffSchema),
            },
            // Data Management Tools
            {
                name: 'seed_database',
                description: 'Run database seed script',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(SeedDatabaseSchema),
            },
            {
                name: 'list_models',
                description: 'List all models and enums defined in the schema',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListModelsSchema),
            },
            // Query Tools
            {
                name: 'find_many',
                description: 'Find multiple records with filtering, sorting, and pagination',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(FindManySchema),
            },
            {
                name: 'find_unique',
                description: 'Find a single record by unique identifier',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(FindUniqueSchema),
            },
            {
                name: 'create',
                description: 'Create a new record',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateSchema),
            },
            {
                name: 'update',
                description: 'Update an existing record',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateSchema),
            },
            {
                name: 'delete',
                description: 'Delete a record',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteSchema),
            },
            {
                name: 'count',
                description: 'Count records matching criteria',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CountSchema),
            },
            {
                name: 'aggregate',
                description: 'Perform aggregations on numeric fields',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(AggregateSchema),
            },
            {
                name: 'execute_raw',
                description: 'Execute raw SQL queries',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ExecuteRawSchema),
            },
            {
                name: 'test_connection',
                description: 'Test database connection and validate configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(zod_1.z.object({})),
            },
        ],
    };
});
/**
 * Handler for tool execution
 */
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            // Schema Management
            case 'init_prisma': {
                const { provider } = InitSchema.parse(args);
                await prismaService.init(provider || 'postgresql');
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Prisma project initialized with ${provider || 'postgresql'} provider. Schema file created at ${config.schemaPath}`,
                        },
                    ],
                };
            }
            case 'read_schema': {
                const schema = prismaService.readSchema();
                return {
                    content: [
                        {
                            type: 'text',
                            text: schema,
                        },
                    ],
                };
            }
            case 'write_schema': {
                const { content } = WriteSchemaSchema.parse(args);
                // Ensure directory exists
                const schemaDir = (0, path_1.dirname)(config.schemaPath || 'prisma/schema.prisma');
                if (!(0, fs_1.existsSync)(schemaDir)) {
                    (0, fs_1.mkdirSync)(schemaDir, { recursive: true });
                }
                prismaService.writeSchema(content);
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Schema written successfully',
                        },
                    ],
                };
            }
            case 'format_schema': {
                await prismaService.format();
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Schema formatted successfully',
                        },
                    ],
                };
            }
            case 'validate_schema': {
                await prismaService.validate();
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Schema is valid',
                        },
                    ],
                };
            }
            case 'generate_client': {
                await prismaService.generate();
                await initializePrismaClient(); // Reinitialize client after generation
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Prisma Client generated successfully',
                        },
                    ],
                };
            }
            // Database Management
            case 'db_pull': {
                await prismaService.dbPull();
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Database schema pulled successfully',
                        },
                    ],
                };
            }
            case 'db_push': {
                const { acceptDataLoss } = DbPushSchema.parse(args);
                const result = await prismaService.dbPush(acceptDataLoss);
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.stdout || 'Schema pushed to database successfully',
                        },
                    ],
                };
            }
            // Migration Management
            case 'migrate_create': {
                const { name } = MigrateCreateSchema.parse(args);
                await prismaService.migrateCreate(name);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Migration "${name}" created successfully`,
                        },
                    ],
                };
            }
            case 'migrate_dev': {
                const { name } = MigrateDevSchema.parse(args);
                const result = await prismaService.migrateDev(name);
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.stdout || 'Migration applied successfully',
                        },
                    ],
                };
            }
            case 'migrate_deploy': {
                await prismaService.migrateDeploy();
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Migrations deployed successfully',
                        },
                    ],
                };
            }
            case 'migrate_reset': {
                const { force } = MigrateResetSchema.parse(args);
                await prismaService.migrateReset(force);
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Database reset and migrations reapplied',
                        },
                    ],
                };
            }
            case 'migrate_status': {
                const status = await prismaService.migrateStatus();
                return {
                    content: [
                        {
                            type: 'text',
                            text: status,
                        },
                    ],
                };
            }
            case 'migrate_resolve': {
                const { applied, rolledBack } = MigrateResolveSchema.parse(args);
                await prismaService.migrateResolve(applied, rolledBack);
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Migration resolved successfully',
                        },
                    ],
                };
            }
            case 'migrate_diff': {
                const { from, to, script } = MigrateDiffSchema.parse(args);
                const diff = await prismaService.migrateDiff(from, to, script);
                return {
                    content: [
                        {
                            type: 'text',
                            text: diff,
                        },
                    ],
                };
            }
            // Data Management
            case 'seed_database': {
                await prismaService.seed();
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Database seeded successfully',
                        },
                    ],
                };
            }
            case 'list_models': {
                const { models, enums } = prismaService.parseSchema();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ models, enums }, null, 2),
                        },
                    ],
                };
            }
            // Query Operations
            case 'find_many': {
                if (!prisma) {
                    throw new Error('Prisma Client not initialized. Please ensure schema is valid and run generate_client.');
                }
                const params = FindManySchema.parse(args);
                const model = prisma[params.model];
                if (!model) {
                    throw new Error(`Model "${params.model}" not found`);
                }
                const result = await model.findMany({
                    where: params.where,
                    select: params.select,
                    include: params.include,
                    orderBy: params.orderBy,
                    skip: params.skip,
                    take: params.take,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'find_unique': {
                if (!prisma) {
                    throw new Error('Prisma Client not initialized. Please ensure schema is valid and run generate_client.');
                }
                const params = FindUniqueSchema.parse(args);
                const model = prisma[params.model];
                if (!model) {
                    throw new Error(`Model "${params.model}" not found`);
                }
                const result = await model.findUnique({
                    where: params.where,
                    select: params.select,
                    include: params.include,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'create': {
                if (!prisma) {
                    throw new Error('Prisma Client not initialized. Please ensure schema is valid and run generate_client.');
                }
                const params = CreateSchema.parse(args);
                const model = prisma[params.model];
                if (!model) {
                    throw new Error(`Model "${params.model}" not found`);
                }
                const result = await model.create({
                    data: params.data,
                    select: params.select,
                    include: params.include,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'update': {
                if (!prisma) {
                    throw new Error('Prisma Client not initialized. Please ensure schema is valid and run generate_client.');
                }
                const params = UpdateSchema.parse(args);
                const model = prisma[params.model];
                if (!model) {
                    throw new Error(`Model "${params.model}" not found`);
                }
                const result = await model.update({
                    where: params.where,
                    data: params.data,
                    select: params.select,
                    include: params.include,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'delete': {
                if (!prisma) {
                    throw new Error('Prisma Client not initialized. Please ensure schema is valid and run generate_client.');
                }
                const params = DeleteSchema.parse(args);
                const model = prisma[params.model];
                if (!model) {
                    throw new Error(`Model "${params.model}" not found`);
                }
                const result = await model.delete({
                    where: params.where,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'count': {
                if (!prisma) {
                    throw new Error('Prisma Client not initialized. Please ensure schema is valid and run generate_client.');
                }
                const params = CountSchema.parse(args);
                const model = prisma[params.model];
                if (!model) {
                    throw new Error(`Model "${params.model}" not found`);
                }
                const result = await model.count({
                    where: params.where,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ count: result }, null, 2),
                        },
                    ],
                };
            }
            case 'aggregate': {
                if (!prisma) {
                    throw new Error('Prisma Client not initialized. Please ensure schema is valid and run generate_client.');
                }
                const params = AggregateSchema.parse(args);
                const model = prisma[params.model];
                if (!model) {
                    throw new Error(`Model "${params.model}" not found`);
                }
                const result = await model.aggregate({
                    where: params.where,
                    _count: params._count,
                    _sum: params._sum,
                    _avg: params._avg,
                    _min: params._min,
                    _max: params._max,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'execute_raw': {
                if (!prisma) {
                    throw new Error('Prisma Client not initialized. Please ensure schema is valid and run generate_client.');
                }
                const { query, parameters } = ExecuteRawSchema.parse(args);
                const result = await prisma.$queryRawUnsafe(query, ...(parameters || []));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'test_connection': {
                const results = [];
                // Check configuration
                results.push('Configuration Status:');
                results.push(`  Database URL: ${config.databaseUrl ? 'Configured' : 'Not configured'}`);
                results.push(`  Database Provider: ${config.databaseProvider || 'Not detected'}`);
                results.push(`  Schema Path: ${config.schemaPath}`);
                results.push(`  Project Root: ${config.projectRoot}`);
                if (config.ssl?.enabled) {
                    results.push(`  SSL Enabled: Yes`);
                    results.push(`    Reject Unauthorized: ${config.ssl.rejectUnauthorized || false}`);
                }
                if (config.pool) {
                    results.push(`  Connection Pool:`);
                    results.push(`    Max: ${config.pool.max || config.connectionLimit || 10}`);
                    if (config.pool.min)
                        results.push(`    Min: ${config.pool.min}`);
                }
                results.push('');
                // Check schema file
                results.push('Schema Status:');
                if (prismaService.schemaExists()) {
                    results.push('  ✓ Schema file exists');
                }
                else {
                    results.push('  ✗ Schema file not found');
                    results.push('    Run init_prisma to create a schema file');
                }
                results.push('');
                // Test database connection
                results.push('Database Connection:');
                if (!config.databaseUrl) {
                    results.push('  ✗ No database URL configured');
                    results.push('    Please configure DATABASE_URL or add to .prisma-mcp.json');
                }
                else if (!prisma) {
                    results.push('  ✗ Prisma Client not initialized');
                    results.push('    Ensure schema is valid and run generate_client');
                }
                else {
                    try {
                        // Try a simple query to test connection
                        await prisma.$queryRaw `SELECT 1`;
                        results.push('  ✓ Database connection successful');
                        // Get database version if possible
                        try {
                            let versionQuery;
                            switch (config.databaseProvider) {
                                case 'postgresql':
                                case 'cockroachdb':
                                    versionQuery = await prisma.$queryRaw `SELECT version()`;
                                    break;
                                case 'mysql':
                                    versionQuery = await prisma.$queryRaw `SELECT VERSION()`;
                                    break;
                                case 'sqlserver':
                                    versionQuery = await prisma.$queryRaw `SELECT @@VERSION`;
                                    break;
                                default:
                                    versionQuery = null;
                            }
                            if (versionQuery && Array.isArray(versionQuery) && versionQuery.length > 0) {
                                const version = Object.values(versionQuery[0])[0];
                                results.push(`  Database Version: ${version}`);
                            }
                        }
                        catch (e) {
                            // Version query failed, not critical
                        }
                    }
                    catch (error) {
                        results.push('  ✗ Database connection failed');
                        results.push(`    Error: ${error instanceof Error ? error.message : String(error)}`);
                        results.push('');
                        results.push('  Troubleshooting:');
                        results.push('    1. Check if database is running');
                        results.push('    2. Verify connection URL and credentials');
                        results.push('    3. Check network connectivity');
                        results.push('    4. Ensure database user has proper permissions');
                        if (config.ssl?.enabled) {
                            results.push('    5. Verify SSL certificates are valid');
                        }
                    }
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: results.join('\n'),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        console.error(`Error executing ${name}:`, error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
/**
 * Start the server
 */
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Prisma MCP server started');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
// Cleanup on exit
process.on('SIGINT', async () => {
    if (prisma) {
        await prisma.$disconnect();
    }
    process.exit(0);
});
//# sourceMappingURL=mcp-server.js.map