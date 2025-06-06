#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { loadConfig } from './config-loader.js';
import { PrismaService } from './prisma-service.js';
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Tool parameter schemas
const InitSchema = z.object({
  provider: z.enum(['postgresql', 'mysql', 'sqlite', 'sqlserver', 'mongodb', 'cockroachdb']).optional()
    .describe('Database provider to use'),
});

const ReadSchemaSchema = z.object({});

const WriteSchemaSchema = z.object({
  content: z.string().describe('The Prisma schema content'),
});

const FormatSchemaSchema = z.object({});

const ValidateSchemaSchema = z.object({});

const GenerateClientSchema = z.object({});

const DbPullSchema = z.object({});

const DbPushSchema = z.object({
  acceptDataLoss: z.boolean().optional().default(false)
    .describe('Accept data loss when pushing schema changes'),
});

const MigrateCreateSchema = z.object({
  name: z.string().describe('Name for the migration'),
});

const MigrateDevSchema = z.object({
  name: z.string().optional().describe('Name for the migration'),
});

const MigrateDeploySchema = z.object({});

const MigrateResetSchema = z.object({
  force: z.boolean().optional().default(false)
    .describe('Skip confirmation prompt'),
});

const MigrateStatusSchema = z.object({});

const MigrateResolveSchema = z.object({
  applied: z.string().optional().describe('Mark migration as applied'),
  rolledBack: z.string().optional().describe('Mark migration as rolled back'),
});

const MigrateDiffSchema = z.object({
  from: z.string().describe('Source to compare from (schema, database, migrations, etc)'),
  to: z.string().describe('Target to compare to'),
  script: z.boolean().optional().default(false).describe('Output as SQL script'),
});

const SeedDatabaseSchema = z.object({});

const ListModelsSchema = z.object({});

const ExecuteRawSchema = z.object({
  query: z.string().describe('Raw SQL query to execute'),
  parameters: z.array(z.any()).optional().describe('Query parameters'),
});

const FindManySchema = z.object({
  model: z.string().describe('Model name to query'),
  where: z.record(z.any()).optional().describe('Filter conditions'),
  select: z.record(z.boolean()).optional().describe('Fields to select'),
  include: z.record(z.any()).optional().describe('Relations to include'),
  orderBy: z.record(z.enum(['asc', 'desc'])).optional().describe('Sort order'),
  skip: z.number().optional().describe('Number of records to skip'),
  take: z.number().optional().describe('Number of records to take'),
});

const FindUniqueSchema = z.object({
  model: z.string().describe('Model name to query'),
  where: z.record(z.any()).describe('Unique identifier'),
  select: z.record(z.boolean()).optional().describe('Fields to select'),
  include: z.record(z.any()).optional().describe('Relations to include'),
});

const CreateSchema = z.object({
  model: z.string().describe('Model name'),
  data: z.record(z.any()).describe('Data to create'),
  select: z.record(z.boolean()).optional().describe('Fields to select'),
  include: z.record(z.any()).optional().describe('Relations to include'),
});

const UpdateSchema = z.object({
  model: z.string().describe('Model name'),
  where: z.record(z.any()).describe('Record identifier'),
  data: z.record(z.any()).describe('Data to update'),
  select: z.record(z.boolean()).optional().describe('Fields to select'),
  include: z.record(z.any()).optional().describe('Relations to include'),
});

const DeleteSchema = z.object({
  model: z.string().describe('Model name'),
  where: z.record(z.any()).describe('Record identifier'),
});

const CountSchema = z.object({
  model: z.string().describe('Model name'),
  where: z.record(z.any()).optional().describe('Filter conditions'),
});

const AggregateSchema = z.object({
  model: z.string().describe('Model name'),
  where: z.record(z.any()).optional().describe('Filter conditions'),
  _count: z.boolean().optional().describe('Include count'),
  _sum: z.record(z.boolean()).optional().describe('Fields to sum'),
  _avg: z.record(z.boolean()).optional().describe('Fields to average'),
  _min: z.record(z.boolean()).optional().describe('Fields to get minimum'),
  _max: z.record(z.boolean()).optional().describe('Fields to get maximum'),
});

/**
 * Create an MCP server for Prisma operations
 */
const server = new Server(
  {
    name: 'prisma-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Load configuration
const config = loadConfig();
const prismaService = new PrismaService(
  config.schemaPath || 'prisma/schema.prisma',
  config.migrationsDir || 'prisma/migrations'
);

// Dynamic Prisma Client instance (only created when schema exists and is valid)
let prisma: PrismaClient | null = null;

/**
 * Initialize Prisma Client if schema exists
 */
async function initializePrismaClient() {
  try {
    if (prismaService.schemaExists()) {
      await prismaService.generate();
      // Dynamically import Prisma Client
      const { PrismaClient } = await import('@prisma/client');
      prisma = new PrismaClient({
        log: config.enableLogging ? ['query', 'info', 'warn', 'error'] : [],
      });
      await prisma.$connect();
      console.error('Prisma Client initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Prisma Client:', error);
    prisma = null;
  }
}

// Initialize on startup
initializePrismaClient().catch(console.error);

/**
 * Handler for tool requests
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Schema Management Tools
      {
        name: 'init_prisma',
        description: 'Initialize a new Prisma project with schema and configuration',
        inputSchema: zodToJsonSchema(InitSchema),
      },
      {
        name: 'read_schema',
        description: 'Read the current Prisma schema file',
        inputSchema: zodToJsonSchema(ReadSchemaSchema),
      },
      {
        name: 'write_schema',
        description: 'Write or update the Prisma schema file',
        inputSchema: zodToJsonSchema(WriteSchemaSchema),
      },
      {
        name: 'format_schema',
        description: 'Format the Prisma schema file',
        inputSchema: zodToJsonSchema(FormatSchemaSchema),
      },
      {
        name: 'validate_schema',
        description: 'Validate the Prisma schema syntax and consistency',
        inputSchema: zodToJsonSchema(ValidateSchemaSchema),
      },
      {
        name: 'generate_client',
        description: 'Generate or regenerate the Prisma Client',
        inputSchema: zodToJsonSchema(GenerateClientSchema),
      },
      // Database Management Tools
      {
        name: 'db_pull',
        description: 'Pull the database schema and update Prisma schema',
        inputSchema: zodToJsonSchema(DbPullSchema),
      },
      {
        name: 'db_push',
        description: 'Push Prisma schema changes to the database without migrations',
        inputSchema: zodToJsonSchema(DbPushSchema),
      },
      // Migration Tools
      {
        name: 'migrate_create',
        description: 'Create a new migration without applying it',
        inputSchema: zodToJsonSchema(MigrateCreateSchema),
      },
      {
        name: 'migrate_dev',
        description: 'Create and apply migrations in development',
        inputSchema: zodToJsonSchema(MigrateDevSchema),
      },
      {
        name: 'migrate_deploy',
        description: 'Apply pending migrations in production',
        inputSchema: zodToJsonSchema(MigrateDeploySchema),
      },
      {
        name: 'migrate_reset',
        description: 'Reset the database and reapply all migrations',
        inputSchema: zodToJsonSchema(MigrateResetSchema),
      },
      {
        name: 'migrate_status',
        description: 'Check the status of migrations',
        inputSchema: zodToJsonSchema(MigrateStatusSchema),
      },
      {
        name: 'migrate_resolve',
        description: 'Resolve migration issues by marking as applied or rolled back',
        inputSchema: zodToJsonSchema(MigrateResolveSchema),
      },
      {
        name: 'migrate_diff',
        description: 'Compare schema differences between sources',
        inputSchema: zodToJsonSchema(MigrateDiffSchema),
      },
      // Data Management Tools
      {
        name: 'seed_database',
        description: 'Run database seed script',
        inputSchema: zodToJsonSchema(SeedDatabaseSchema),
      },
      {
        name: 'list_models',
        description: 'List all models and enums defined in the schema',
        inputSchema: zodToJsonSchema(ListModelsSchema),
      },
      // Query Tools
      {
        name: 'find_many',
        description: 'Find multiple records with filtering, sorting, and pagination',
        inputSchema: zodToJsonSchema(FindManySchema),
      },
      {
        name: 'find_unique',
        description: 'Find a single record by unique identifier',
        inputSchema: zodToJsonSchema(FindUniqueSchema),
      },
      {
        name: 'create',
        description: 'Create a new record',
        inputSchema: zodToJsonSchema(CreateSchema),
      },
      {
        name: 'update',
        description: 'Update an existing record',
        inputSchema: zodToJsonSchema(UpdateSchema),
      },
      {
        name: 'delete',
        description: 'Delete a record',
        inputSchema: zodToJsonSchema(DeleteSchema),
      },
      {
        name: 'count',
        description: 'Count records matching criteria',
        inputSchema: zodToJsonSchema(CountSchema),
      },
      {
        name: 'aggregate',
        description: 'Perform aggregations on numeric fields',
        inputSchema: zodToJsonSchema(AggregateSchema),
      },
      {
        name: 'execute_raw',
        description: 'Execute raw SQL queries',
        inputSchema: zodToJsonSchema(ExecuteRawSchema),
      },
    ],
  };
});

/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
        const schemaDir = dirname(config.schemaPath || 'prisma/schema.prisma');
        if (!existsSync(schemaDir)) {
          mkdirSync(schemaDir, { recursive: true });
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
        const model = (prisma as any)[params.model];
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
        const model = (prisma as any)[params.model];
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
        const model = (prisma as any)[params.model];
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
        const model = (prisma as any)[params.model];
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
        const model = (prisma as any)[params.model];
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
        const model = (prisma as any)[params.model];
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
        const model = (prisma as any)[params.model];
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

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
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
  const transport = new StdioServerTransport();
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