#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import format from 'pg-format';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { loadConfig } from './config-loader.js';
// Initialize PostgreSQL connection pool
let pool;
/**
 * Initialize database connection pool
 */
function initializePool() {
    const config = loadConfig();
    pool = new Pool(config);
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
    });
}
/**
 * Execute a query with proper error handling
 */
async function executeQuery(query, params) {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(query, params);
        return result;
    }
    catch (error) {
        console.error('Query execution error:', error);
        throw error;
    }
    finally {
        if (client) {
            client.release();
        }
    }
}
/**
 * Format query results for consistent output
 */
function formatQueryResult(result) {
    return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(f => ({
            name: f.name,
            dataTypeID: f.dataTypeID,
            tableID: f.tableID,
            columnID: f.columnID
        }))
    };
}
// Tool schemas
const QuerySchema = z.object({
    query: z.string().describe('SQL query to execute'),
    params: z.array(z.any()).optional().describe('Query parameters for parameterized queries')
});
const TableSchema = z.object({
    schema: z.string().default('public').describe('Schema name'),
    table: z.string().describe('Table name')
});
const CreateTableSchema = z.object({
    schema: z.string().default('public').describe('Schema name'),
    table: z.string().describe('Table name'),
    columns: z.array(z.object({
        name: z.string().describe('Column name'),
        type: z.string().describe('Column data type (e.g., INTEGER, VARCHAR(255), TIMESTAMP)'),
        constraints: z.string().optional().describe('Column constraints (e.g., NOT NULL, PRIMARY KEY, UNIQUE)')
    })).describe('Array of column definitions'),
    constraints: z.array(z.string()).optional().describe('Table-level constraints (e.g., foreign keys, composite primary keys)')
});
const InsertSchema = z.object({
    schema: z.string().default('public').describe('Schema name'),
    table: z.string().describe('Table name'),
    data: z.record(z.any()).describe('Object with column names as keys and values to insert'),
    returning: z.array(z.string()).optional().describe('Columns to return after insert')
});
const UpdateSchema = z.object({
    schema: z.string().default('public').describe('Schema name'),
    table: z.string().describe('Table name'),
    data: z.record(z.any()).describe('Object with column names as keys and new values'),
    where: z.string().describe('WHERE clause conditions (without WHERE keyword)'),
    returning: z.array(z.string()).optional().describe('Columns to return after update')
});
const DeleteSchema = z.object({
    schema: z.string().default('public').describe('Schema name'),
    table: z.string().describe('Table name'),
    where: z.string().describe('WHERE clause conditions (without WHERE keyword)'),
    returning: z.array(z.string()).optional().describe('Columns to return after delete')
});
const SelectSchema = z.object({
    schema: z.string().default('public').describe('Schema name'),
    table: z.string().describe('Table name'),
    columns: z.array(z.string()).default(['*']).describe('Columns to select'),
    where: z.string().optional().describe('WHERE clause conditions (without WHERE keyword)'),
    orderBy: z.string().optional().describe('ORDER BY clause (without ORDER BY keyword)'),
    limit: z.number().optional().describe('Maximum number of rows to return'),
    offset: z.number().optional().describe('Number of rows to skip')
});
const TransactionSchema = z.object({
    queries: z.array(z.object({
        query: z.string().describe('SQL query to execute'),
        params: z.array(z.any()).optional().describe('Query parameters')
    })).describe('Array of queries to execute in a transaction')
});
const BackupSchema = z.object({
    schema: z.string().optional().describe('Schema to backup (omit for all schemas)'),
    table: z.string().optional().describe('Table to backup (omit for all tables in schema)'),
    format: z.enum(['sql', 'csv']).default('sql').describe('Backup format')
});
// Create server instance
const server = new Server({
    name: 'postgresql-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'query',
                description: 'Execute a raw SQL query with optional parameters',
                inputSchema: zodToJsonSchema(QuerySchema),
            },
            {
                name: 'list_tables',
                description: 'List all tables in a schema with their columns and types',
                inputSchema: zodToJsonSchema(z.object({
                    schema: z.string().default('public').describe('Schema name to list tables from')
                })),
            },
            {
                name: 'describe_table',
                description: 'Get detailed information about a table including columns, constraints, and indexes',
                inputSchema: zodToJsonSchema(TableSchema),
            },
            {
                name: 'create_table',
                description: 'Create a new table with specified columns and constraints',
                inputSchema: zodToJsonSchema(CreateTableSchema),
            },
            {
                name: 'drop_table',
                description: 'Drop a table (use with caution)',
                inputSchema: zodToJsonSchema(z.object({
                    schema: z.string().default('public').describe('Schema name'),
                    table: z.string().describe('Table name'),
                    cascade: z.boolean().default(false).describe('Drop dependent objects')
                })),
            },
            {
                name: 'insert',
                description: 'Insert data into a table',
                inputSchema: zodToJsonSchema(InsertSchema),
            },
            {
                name: 'update',
                description: 'Update records in a table',
                inputSchema: zodToJsonSchema(UpdateSchema),
            },
            {
                name: 'delete',
                description: 'Delete records from a table',
                inputSchema: zodToJsonSchema(DeleteSchema),
            },
            {
                name: 'select',
                description: 'Select data from a table with filtering and sorting',
                inputSchema: zodToJsonSchema(SelectSchema),
            },
            {
                name: 'list_schemas',
                description: 'List all schemas in the database',
                inputSchema: zodToJsonSchema(z.object({})),
            },
            {
                name: 'create_schema',
                description: 'Create a new schema',
                inputSchema: zodToJsonSchema(z.object({
                    name: z.string().describe('Schema name'),
                    authorization: z.string().optional().describe('Schema owner')
                })),
            },
            {
                name: 'list_indexes',
                description: 'List all indexes on a table',
                inputSchema: zodToJsonSchema(TableSchema),
            },
            {
                name: 'create_index',
                description: 'Create an index on a table',
                inputSchema: zodToJsonSchema(z.object({
                    schema: z.string().default('public').describe('Schema name'),
                    table: z.string().describe('Table name'),
                    name: z.string().describe('Index name'),
                    columns: z.array(z.string()).describe('Columns to index'),
                    unique: z.boolean().default(false).describe('Create unique index'),
                    method: z.enum(['btree', 'hash', 'gist', 'spgist', 'gin', 'brin']).default('btree').describe('Index method')
                })),
            },
            {
                name: 'analyze_table',
                description: 'Update table statistics for query optimization',
                inputSchema: zodToJsonSchema(TableSchema),
            },
            {
                name: 'vacuum_table',
                description: 'Clean up and optimize table storage',
                inputSchema: zodToJsonSchema(z.object({
                    schema: z.string().default('public').describe('Schema name'),
                    table: z.string().describe('Table name'),
                    full: z.boolean().default(false).describe('Perform FULL vacuum'),
                    analyze: z.boolean().default(true).describe('Update statistics after vacuum')
                })),
            },
            {
                name: 'list_functions',
                description: 'List all functions in a schema',
                inputSchema: zodToJsonSchema(z.object({
                    schema: z.string().default('public').describe('Schema name')
                })),
            },
            {
                name: 'list_views',
                description: 'List all views in a schema',
                inputSchema: zodToJsonSchema(z.object({
                    schema: z.string().default('public').describe('Schema name')
                })),
            },
            {
                name: 'create_view',
                description: 'Create a view',
                inputSchema: zodToJsonSchema(z.object({
                    schema: z.string().default('public').describe('Schema name'),
                    name: z.string().describe('View name'),
                    query: z.string().describe('SELECT query for the view'),
                    replace: z.boolean().default(false).describe('Replace if exists')
                })),
            },
            {
                name: 'list_constraints',
                description: 'List all constraints on a table',
                inputSchema: zodToJsonSchema(TableSchema),
            },
            {
                name: 'list_sequences',
                description: 'List all sequences in a schema',
                inputSchema: zodToJsonSchema(z.object({
                    schema: z.string().default('public').describe('Schema name')
                })),
            },
            {
                name: 'transaction',
                description: 'Execute multiple queries in a transaction',
                inputSchema: zodToJsonSchema(TransactionSchema),
            },
            {
                name: 'explain',
                description: 'Get query execution plan',
                inputSchema: zodToJsonSchema(z.object({
                    query: z.string().describe('SQL query to explain'),
                    analyze: z.boolean().default(false).describe('Run EXPLAIN ANALYZE'),
                    params: z.array(z.any()).optional().describe('Query parameters')
                })),
            },
            {
                name: 'table_stats',
                description: 'Get table statistics including size and row count',
                inputSchema: zodToJsonSchema(TableSchema),
            },
            {
                name: 'database_stats',
                description: 'Get database statistics and connection info',
                inputSchema: zodToJsonSchema(z.object({})),
            },
            {
                name: 'list_extensions',
                description: 'List installed PostgreSQL extensions',
                inputSchema: zodToJsonSchema(z.object({})),
            },
            {
                name: 'backup_table',
                description: 'Generate backup SQL or CSV for a table',
                inputSchema: zodToJsonSchema(BackupSchema),
            }
        ],
    };
});
// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'query': {
                const { query, params } = QuerySchema.parse(args);
                const result = await executeQuery(query, params);
                return { content: [{ type: 'text', text: JSON.stringify(formatQueryResult(result), null, 2) }] };
            }
            case 'list_tables': {
                const { schema } = z.object({ schema: z.string().default('public') }).parse(args);
                const query = `
          SELECT 
            t.table_name,
            t.table_type,
            obj_description(c.oid) as comment,
            array_agg(
              json_build_object(
                'column_name', col.column_name,
                'data_type', col.data_type,
                'is_nullable', col.is_nullable,
                'column_default', col.column_default
              ) ORDER BY col.ordinal_position
            ) as columns
          FROM information_schema.tables t
          JOIN pg_class c ON c.relname = t.table_name
          JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
          LEFT JOIN information_schema.columns col ON col.table_schema = t.table_schema AND col.table_name = t.table_name
          WHERE t.table_schema = $1
            AND t.table_type IN ('BASE TABLE', 'VIEW')
          GROUP BY t.table_name, t.table_type, c.oid
          ORDER BY t.table_name;
        `;
                const result = await executeQuery(query, [schema]);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
            }
            case 'describe_table': {
                const { schema, table } = TableSchema.parse(args);
                // Get columns
                const columnsQuery = `
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            is_nullable,
            column_default,
            is_identity,
            identity_generation
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;
                // Get constraints
                const constraintsQuery = `
          SELECT 
            conname as constraint_name,
            contype as constraint_type,
            pg_get_constraintdef(oid) as definition
          FROM pg_constraint
          WHERE conrelid = ($1 || '.' || $2)::regclass;
        `;
                // Get indexes
                const indexesQuery = `
          SELECT 
            indexname,
            indexdef
          FROM pg_indexes
          WHERE schemaname = $1 AND tablename = $2;
        `;
                const [columns, constraints, indexes] = await Promise.all([
                    executeQuery(columnsQuery, [schema, table]),
                    executeQuery(constraintsQuery, [schema, table]),
                    executeQuery(indexesQuery, [schema, table])
                ]);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                columns: columns.rows,
                                constraints: constraints.rows,
                                indexes: indexes.rows
                            }, null, 2)
                        }]
                };
            }
            case 'create_table': {
                const { schema, table, columns, constraints } = CreateTableSchema.parse(args);
                const columnDefs = columns.map(col => {
                    let def = format.ident(col.name) + ' ' + col.type;
                    if (col.constraints) {
                        def += ' ' + col.constraints;
                    }
                    return def;
                }).join(', ');
                let query = format('CREATE TABLE %I.%I (%s', schema, table, columnDefs);
                if (constraints && constraints.length > 0) {
                    query += ', ' + constraints.join(', ');
                }
                query += ')';
                await executeQuery(query);
                return { content: [{ type: 'text', text: `Table ${schema}.${table} created successfully` }] };
            }
            case 'drop_table': {
                const { schema, table, cascade } = z.object({
                    schema: z.string().default('public'),
                    table: z.string(),
                    cascade: z.boolean().default(false)
                }).parse(args);
                const query = format('DROP TABLE %I.%I %s', schema, table, cascade ? 'CASCADE' : '');
                await executeQuery(query);
                return { content: [{ type: 'text', text: `Table ${schema}.${table} dropped successfully` }] };
            }
            case 'insert': {
                const { schema, table, data, returning } = InsertSchema.parse(args);
                const columns = Object.keys(data);
                const values = Object.values(data);
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                let query = format('INSERT INTO %I.%I (%s) VALUES (%s)', schema, table, columns.map(c => format.ident(c)).join(', '), placeholders);
                if (returning && returning.length > 0) {
                    query += ' RETURNING ' + returning.map(c => format.ident(c)).join(', ');
                }
                const result = await executeQuery(query, values);
                return { content: [{ type: 'text', text: JSON.stringify(formatQueryResult(result), null, 2) }] };
            }
            case 'update': {
                const { schema, table, data, where, returning } = UpdateSchema.parse(args);
                const columns = Object.keys(data);
                const values = Object.values(data);
                const setClauses = columns.map((col, i) => `${format.ident(col)} = $${i + 1}`).join(', ');
                let query = format('UPDATE %I.%I SET %s WHERE %s', schema, table, setClauses, where);
                if (returning && returning.length > 0) {
                    query += ' RETURNING ' + returning.map(c => format.ident(c)).join(', ');
                }
                const result = await executeQuery(query, values);
                return { content: [{ type: 'text', text: JSON.stringify(formatQueryResult(result), null, 2) }] };
            }
            case 'delete': {
                const { schema, table, where, returning } = DeleteSchema.parse(args);
                let query = format('DELETE FROM %I.%I WHERE %s', schema, table, where);
                if (returning && returning.length > 0) {
                    query += ' RETURNING ' + returning.map(c => format.ident(c)).join(', ');
                }
                const result = await executeQuery(query);
                return { content: [{ type: 'text', text: JSON.stringify(formatQueryResult(result), null, 2) }] };
            }
            case 'select': {
                const { schema, table, columns, where, orderBy, limit, offset } = SelectSchema.parse(args);
                let query = format('SELECT %s FROM %I.%I', columns.map(c => c === '*' ? c : format.ident(c)).join(', '), schema, table);
                if (where) {
                    query += ' WHERE ' + where;
                }
                if (orderBy) {
                    query += ' ORDER BY ' + orderBy;
                }
                if (limit) {
                    query += ' LIMIT ' + limit;
                }
                if (offset) {
                    query += ' OFFSET ' + offset;
                }
                const result = await executeQuery(query);
                return { content: [{ type: 'text', text: JSON.stringify(formatQueryResult(result), null, 2) }] };
            }
            case 'list_schemas': {
                const query = `
          SELECT 
            schema_name,
            schema_owner,
            array_agg(privilege_type) as privileges
          FROM information_schema.schemata
          LEFT JOIN information_schema.usage_privileges 
            ON object_schema = schema_name 
            AND object_type = 'SCHEMA'
          WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
          GROUP BY schema_name, schema_owner
          ORDER BY schema_name;
        `;
                const result = await executeQuery(query);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
            }
            case 'create_schema': {
                const { name, authorization } = z.object({
                    name: z.string(),
                    authorization: z.string().optional()
                }).parse(args);
                let query = format('CREATE SCHEMA %I', name);
                if (authorization) {
                    query += format(' AUTHORIZATION %I', authorization);
                }
                await executeQuery(query);
                return { content: [{ type: 'text', text: `Schema ${name} created successfully` }] };
            }
            case 'list_indexes': {
                const { schema, table } = TableSchema.parse(args);
                const query = `
          SELECT 
            indexname,
            indexdef,
            tablespace
          FROM pg_indexes
          WHERE schemaname = $1 AND tablename = $2
          ORDER BY indexname;
        `;
                const result = await executeQuery(query, [schema, table]);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
            }
            case 'create_index': {
                const { schema, table, name, columns, unique, method } = z.object({
                    schema: z.string().default('public'),
                    table: z.string(),
                    name: z.string(),
                    columns: z.array(z.string()),
                    unique: z.boolean().default(false),
                    method: z.enum(['btree', 'hash', 'gist', 'spgist', 'gin', 'brin']).default('btree')
                }).parse(args);
                const query = format('CREATE %s INDEX %I ON %I.%I USING %s (%s)', unique ? 'UNIQUE' : '', name, schema, table, method, columns.map(c => format.ident(c)).join(', '));
                await executeQuery(query);
                return { content: [{ type: 'text', text: `Index ${name} created successfully` }] };
            }
            case 'analyze_table': {
                const { schema, table } = TableSchema.parse(args);
                const query = format('ANALYZE %I.%I', schema, table);
                await executeQuery(query);
                return { content: [{ type: 'text', text: `Table ${schema}.${table} analyzed successfully` }] };
            }
            case 'vacuum_table': {
                const { schema, table, full, analyze } = z.object({
                    schema: z.string().default('public'),
                    table: z.string(),
                    full: z.boolean().default(false),
                    analyze: z.boolean().default(true)
                }).parse(args);
                const options = [];
                if (full)
                    options.push('FULL');
                if (analyze)
                    options.push('ANALYZE');
                const query = format('VACUUM %s %I.%I', options.join(' '), schema, table);
                await executeQuery(query);
                return { content: [{ type: 'text', text: `Table ${schema}.${table} vacuumed successfully` }] };
            }
            case 'list_functions': {
                const { schema } = z.object({ schema: z.string().default('public') }).parse(args);
                const query = `
          SELECT 
            routine_name,
            routine_type,
            data_type as return_type,
            routine_definition
          FROM information_schema.routines
          WHERE routine_schema = $1
          ORDER BY routine_name;
        `;
                const result = await executeQuery(query, [schema]);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
            }
            case 'list_views': {
                const { schema } = z.object({ schema: z.string().default('public') }).parse(args);
                const query = `
          SELECT 
            table_name as view_name,
            view_definition
          FROM information_schema.views
          WHERE table_schema = $1
          ORDER BY table_name;
        `;
                const result = await executeQuery(query, [schema]);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
            }
            case 'create_view': {
                const { schema, name, query, replace } = z.object({
                    schema: z.string().default('public'),
                    name: z.string(),
                    query: z.string(),
                    replace: z.boolean().default(false)
                }).parse(args);
                const createQuery = format('CREATE %s VIEW %I.%I AS %s', replace ? 'OR REPLACE' : '', schema, name, query);
                await executeQuery(createQuery);
                return { content: [{ type: 'text', text: `View ${schema}.${name} created successfully` }] };
            }
            case 'list_constraints': {
                const { schema, table } = TableSchema.parse(args);
                const query = `
          SELECT 
            conname as constraint_name,
            CASE contype
              WHEN 'c' THEN 'CHECK'
              WHEN 'f' THEN 'FOREIGN KEY'
              WHEN 'p' THEN 'PRIMARY KEY'
              WHEN 'u' THEN 'UNIQUE'
              WHEN 't' THEN 'TRIGGER'
              WHEN 'x' THEN 'EXCLUSION'
            END as constraint_type,
            pg_get_constraintdef(oid) as definition
          FROM pg_constraint
          WHERE conrelid = ($1 || '.' || $2)::regclass
          ORDER BY conname;
        `;
                const result = await executeQuery(query, [schema, table]);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
            }
            case 'list_sequences': {
                const { schema } = z.object({ schema: z.string().default('public') }).parse(args);
                const query = `
          SELECT 
            sequence_name,
            data_type,
            start_value,
            minimum_value,
            maximum_value,
            increment,
            cycle_option
          FROM information_schema.sequences
          WHERE sequence_schema = $1
          ORDER BY sequence_name;
        `;
                const result = await executeQuery(query, [schema]);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
            }
            case 'transaction': {
                const { queries } = TransactionSchema.parse(args);
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    const results = [];
                    for (const { query, params } of queries) {
                        const result = await client.query(query, params);
                        results.push(formatQueryResult(result));
                    }
                    await client.query('COMMIT');
                    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
                }
                catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                }
                finally {
                    client.release();
                }
            }
            case 'explain': {
                const { query, analyze, params } = z.object({
                    query: z.string(),
                    analyze: z.boolean().default(false),
                    params: z.array(z.any()).optional()
                }).parse(args);
                const explainQuery = `EXPLAIN ${analyze ? 'ANALYZE' : ''} ${query}`;
                const result = await executeQuery(explainQuery, params);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
            }
            case 'table_stats': {
                const { schema, table } = TableSchema.parse(args);
                const query = `
          SELECT 
            pg_size_pretty(pg_total_relation_size($1||'.'||$2)) as total_size,
            pg_size_pretty(pg_relation_size($1||'.'||$2)) as table_size,
            pg_size_pretty(pg_indexes_size($1||'.'||$2)) as indexes_size,
            n_live_tup as row_count,
            n_dead_tup as dead_rows,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
          FROM pg_stat_user_tables
          WHERE schemaname = $1 AND relname = $2;
        `;
                const result = await executeQuery(query, [schema, table]);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows[0] || {}, null, 2) }] };
            }
            case 'database_stats': {
                const query = `
          SELECT 
            current_database() as database,
            pg_size_pretty(pg_database_size(current_database())) as database_size,
            (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections,
            (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
            (SELECT setting FROM pg_settings WHERE name = 'server_version') as postgres_version,
            current_timestamp as current_time
        `;
                const result = await executeQuery(query);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows[0], null, 2) }] };
            }
            case 'list_extensions': {
                const query = `
          SELECT 
            extname as name,
            extversion as version,
            extnamespace::regnamespace as schema
          FROM pg_extension
          ORDER BY extname;
        `;
                const result = await executeQuery(query);
                return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] };
            }
            case 'backup_table': {
                const { schema = 'public', table, format: outputFormat } = BackupSchema.parse(args);
                if (outputFormat === 'csv') {
                    // For CSV, we need to get the data
                    const query = format('SELECT * FROM %I.%I', schema, table);
                    const result = await executeQuery(query);
                    if (result.rows.length === 0) {
                        return { content: [{ type: 'text', text: 'No data to backup' }] };
                    }
                    // Generate CSV
                    const headers = Object.keys(result.rows[0]);
                    const csv = [
                        headers.join(','),
                        ...result.rows.map(row => headers.map(h => {
                            const value = row[h];
                            if (value === null)
                                return '';
                            if (typeof value === 'string' && value.includes(',')) {
                                return `"${value.replace(/"/g, '""')}"`;
                            }
                            return value;
                        }).join(','))
                    ].join('\n');
                    return { content: [{ type: 'text', text: csv }] };
                }
                else {
                    // Generate SQL backup
                    const columnsResult = await executeQuery(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = $1 AND table_name = $2 
            ORDER BY ordinal_position
          `, [schema, table]);
                    const dataResult = await executeQuery(format('SELECT * FROM %I.%I', schema, table));
                    let sql = `-- Backup of ${schema}.${table}\n`;
                    sql += `-- Generated at ${new Date().toISOString()}\n\n`;
                    // Generate INSERT statements
                    if (dataResult.rows.length > 0) {
                        const columns = columnsResult.rows.map(r => r.column_name);
                        sql += format('INSERT INTO %I.%I (%s) VALUES\n', schema, table, columns.map(c => format.ident(c)).join(', '));
                        const values = dataResult.rows.map((row, index) => {
                            const vals = columns.map(col => {
                                const value = row[col];
                                if (value === null)
                                    return 'NULL';
                                if (typeof value === 'number')
                                    return value;
                                if (typeof value === 'boolean')
                                    return value;
                                if (value instanceof Date)
                                    return `'${value.toISOString()}'`;
                                return format.literal(String(value));
                            }).join(', ');
                            return `(${vals})${index === dataResult.rows.length - 1 ? ';' : ','}`;
                        });
                        sql += values.join('\n');
                    }
                    return { content: [{ type: 'text', text: sql }] };
                }
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
        }
        if (error instanceof McpError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Database operation failed: ${errorMessage}`);
    }
});
// Start the server
async function main() {
    try {
        // Initialize the database connection
        initializePool();
        // Test the connection
        await executeQuery('SELECT 1');
        console.error('PostgreSQL connection established');
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('PostgreSQL MCP server running on stdio');
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.error('Shutting down...');
    if (pool) {
        await pool.end();
    }
    process.exit(0);
});
// Run the server
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map