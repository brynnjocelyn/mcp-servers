# Prisma MCP Server

A Model Context Protocol (MCP) server that provides comprehensive tools for managing databases using Prisma ORM. This server enables LLMs to interact with databases through Prisma's powerful abstraction layer, supporting multiple database engines including PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, and CockroachDB.

## Overview

This MCP server exposes Prisma's functionality as tools that can be used by any MCP-compatible client (like Claude Desktop, Cursor, or other LLM applications). It provides a unified interface for database operations across different database engines, schema management, migrations, and data manipulation.

## Features

### Schema Management
- Initialize new Prisma projects
- Read, write, and format schema files
- Validate schema syntax and consistency
- Generate Prisma Client from schema
- Introspect existing databases

### Database Operations
- Pull database schema to update Prisma schema
- Push schema changes without migrations (development)
- Execute raw SQL queries
- Support for multiple database providers

### Migration Management
- Create, apply, and manage database migrations
- Development and production migration workflows
- Migration status tracking and resolution
- Schema diffing and comparison
- Database reset capabilities

### Data Operations
- Full CRUD operations (Create, Read, Update, Delete)
- Complex queries with filtering, sorting, and pagination
- Relation management and eager loading
- Aggregations and counting
- Transaction support

## Installation

```bash
npm install
npm run build
```

## Configuration

The Prisma MCP server can be configured in three ways (in order of precedence):

1. **Local configuration file** (`.prisma-mcp.json`)
2. **Environment variables**
3. **Default values**

### Configuration File (.prisma-mcp.json)

Create a `.prisma-mcp.json` file in your project directory:

```json
{
  "databaseUrl": "postgresql://user:password@localhost:5432/mydb",
  "schemaPath": "./prisma/schema.prisma",
  "migrationsDir": "./prisma/migrations",
  "enableLogging": true,
  "connectionLimit": 10
}
```

### Environment Variables

```bash
# Database connection
export DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Prisma configuration
export PRISMA_SCHEMA_PATH="./prisma/schema.prisma"
export PRISMA_MIGRATIONS_DIR="./prisma/migrations"
export PRISMA_LOGGING=true
export PRISMA_CONNECTION_LIMIT=10
```

### Database URL Format

Different database providers use different connection string formats:

**PostgreSQL:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

**MySQL:**
```
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

**SQLite:**
```
file:./dev.db
```

**MongoDB:**
```
mongodb+srv://USER:PASSWORD@HOST/DATABASE
```

**SQL Server:**
```
sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD
```

## Usage with Claude Desktop

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "prisma": {
      "command": "/path/to/prisma-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/mydb"
      }
    }
  }
}
```

## Available Tools

### Schema Management

#### init_prisma
Initialize a new Prisma project with schema and configuration.
- `provider` (optional): Database provider (postgresql, mysql, sqlite, etc.)

#### read_schema
Read the current Prisma schema file.

#### write_schema
Write or update the Prisma schema file.
- `content`: The schema content to write

#### format_schema
Format the Prisma schema file using Prisma's formatter.

#### validate_schema
Validate the schema syntax and consistency.

#### generate_client
Generate or regenerate the Prisma Client from the schema.

### Database Management

#### db_pull
Pull the database schema and update the Prisma schema file.

#### db_push
Push schema changes to the database without creating migrations.
- `acceptDataLoss` (optional): Accept potential data loss

### Migration Tools

#### migrate_create
Create a new migration without applying it.
- `name`: Migration name

#### migrate_dev
Create and apply migrations in development.
- `name` (optional): Migration name

#### migrate_deploy
Apply pending migrations in production.

#### migrate_reset
Reset the database and reapply all migrations.
- `force` (optional): Skip confirmation

#### migrate_status
Check the status of migrations.

#### migrate_resolve
Resolve migration issues.
- `applied` (optional): Mark migration as applied
- `rolledBack` (optional): Mark migration as rolled back

#### migrate_diff
Compare schema differences.
- `from`: Source to compare from
- `to`: Target to compare to
- `script` (optional): Output as SQL script

### Data Operations

#### find_many
Find multiple records with filtering, sorting, and pagination.
- `model`: Model name
- `where` (optional): Filter conditions
- `select` (optional): Fields to select
- `include` (optional): Relations to include
- `orderBy` (optional): Sort order
- `skip` (optional): Records to skip
- `take` (optional): Records to take

#### find_unique
Find a single record by unique identifier.
- `model`: Model name
- `where`: Unique identifier
- `select` (optional): Fields to select
- `include` (optional): Relations to include

#### create
Create a new record.
- `model`: Model name
- `data`: Data to create
- `select` (optional): Fields to return
- `include` (optional): Relations to include

#### update
Update an existing record.
- `model`: Model name
- `where`: Record identifier
- `data`: Update data
- `select` (optional): Fields to return
- `include` (optional): Relations to include

#### delete
Delete a record.
- `model`: Model name
- `where`: Record identifier

#### count
Count records matching criteria.
- `model`: Model name
- `where` (optional): Filter conditions

#### aggregate
Perform aggregations on numeric fields.
- `model`: Model name
- `where` (optional): Filter conditions
- `_count` (optional): Include count
- `_sum` (optional): Fields to sum
- `_avg` (optional): Fields to average
- `_min` (optional): Fields to get minimum
- `_max` (optional): Fields to get maximum

#### execute_raw
Execute raw SQL queries.
- `query`: SQL query
- `parameters` (optional): Query parameters

### Utility Tools

#### seed_database
Run the database seed script.

#### list_models
List all models and enums defined in the schema.

## Example Workflows

### Initialize a New Project

```json
{
  "tool": "init_prisma",
  "arguments": {
    "provider": "postgresql"
  }
}
```

### Define a Schema

```json
{
  "tool": "write_schema",
  "arguments": {
    "content": "datasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\ngenerator client {\n  provider = \"prisma-client-js\"\n}\n\nmodel User {\n  id    Int     @id @default(autoincrement())\n  email String  @unique\n  name  String?\n  posts Post[]\n}\n\nmodel Post {\n  id        Int     @id @default(autoincrement())\n  title     String\n  content   String?\n  published Boolean @default(false)\n  author    User?   @relation(fields: [authorId], references: [id])\n  authorId  Int?\n}"
  }
}
```

### Create and Apply Migration

```json
{
  "tool": "migrate_dev",
  "arguments": {
    "name": "add_user_and_post_models"
  }
}
```

### Query Data

```json
{
  "tool": "find_many",
  "arguments": {
    "model": "User",
    "where": {
      "email": {
        "contains": "@example.com"
      }
    },
    "include": {
      "posts": true
    },
    "orderBy": {
      "name": "asc"
    },
    "take": 10
  }
}
```

### Create a Record

```json
{
  "tool": "create",
  "arguments": {
    "model": "User",
    "data": {
      "email": "alice@example.com",
      "name": "Alice",
      "posts": {
        "create": [
          {
            "title": "My First Post",
            "content": "Hello, world!",
            "published": true
          }
        ]
      }
    },
    "include": {
      "posts": true
    }
  }
}
```

## Best Practices

1. **Schema First**: Always define your schema before creating migrations
2. **Use Migrations**: Use migrations for production schema changes
3. **Validate Changes**: Always validate schema changes before applying
4. **Backup Data**: Backup your database before major schema changes
5. **Test Migrations**: Test migrations in development before production
6. **Use Transactions**: Use transactions for data consistency
7. **Index Optimization**: Add indexes for frequently queried fields

## Development

### Running in Development
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Making the Server Executable
```bash
chmod +x dist/mcp-server.js
```

## Troubleshooting

### Prisma Client Not Found
- Run `generate_client` tool after schema changes
- Ensure `node_modules` contains `@prisma/client`

### Migration Conflicts
- Use `migrate_status` to check migration state
- Use `migrate_resolve` to fix conflicts
- Consider `migrate_reset` for development issues

### Connection Issues
- Verify DATABASE_URL is correct
- Check database server is running
- Ensure proper network access
- Verify credentials and permissions

### Schema Validation Errors
- Use `format_schema` to fix formatting
- Check for syntax errors in schema
- Ensure all relations are properly defined

## Security Considerations

1. **Credentials**: Store database credentials securely
2. **Permissions**: Use least-privilege database users
3. **Raw Queries**: Be cautious with raw SQL execution
4. **Data Access**: Implement proper access controls
5. **Connection Security**: Use SSL/TLS for remote databases

## License

ISC

Last Updated On: 2025-06-06