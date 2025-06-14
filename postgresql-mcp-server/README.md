# PostgreSQL MCP Server

A comprehensive Model Context Protocol (MCP) server that provides tools for managing PostgreSQL databases. This server enables LLMs to interact with PostgreSQL databases through a standardized protocol.

## Overview

This MCP server exposes PostgreSQL functionality as tools that can be used by any MCP-compatible client (like Claude Desktop, Cursor, or other LLM applications). It provides comprehensive access to PostgreSQL features with 25+ tools covering all major database operations.

## Quick Start

1. Install dependencies: `npm install`
2. Build the server: `npm run build`
3. Configure your database connection (see [Authentication Guide](./AUTHENTICATION.md))
4. Add to your MCP client configuration

## Documentation

- **[Authentication Guide](./AUTHENTICATION.md)** - Comprehensive guide to all authentication methods
- **[Tools Reference](./TOOLS.md)** - Detailed documentation for all available tools
- **[Configuration Examples](./CONFIG_EXAMPLES.md)** - Complete configuration examples and troubleshooting

## Features

### Database Operations
- Execute raw SQL queries with parameterized query support
- Transaction management with rollback support
- Query execution plans with EXPLAIN/EXPLAIN ANALYZE

### Schema Management
- List, create, and manage schemas
- Full DDL operations support

### Table Operations
- List tables with detailed column information
- Create tables with columns and constraints
- Drop tables with cascade options
- Describe tables including columns, constraints, and indexes
- Table statistics and size information

### Data Operations
- INSERT with RETURNING clause support
- UPDATE with WHERE conditions and RETURNING
- DELETE with WHERE conditions and RETURNING
- SELECT with filtering, sorting, pagination

### Index Management
- List indexes on tables
- Create indexes (B-tree, Hash, GiST, SP-GiST, GIN, BRIN)
- Support for unique indexes

### Performance Tools
- ANALYZE tables for query optimization
- VACUUM tables (with FULL option)
- Table and database statistics
- Query execution plans

### Advanced Features
- Views: List and create views
- Functions: List database functions
- Sequences: List sequences with details
- Constraints: List all table constraints
- Extensions: List installed PostgreSQL extensions
- Backup: Export table data as SQL or CSV

## Installation

```bash
npm install
npm run build
```

## Authentication & Configuration

The PostgreSQL MCP server supports all standard PostgreSQL authentication methods including password, SSL/TLS, certificate-based authentication, and more.

### Multiple Instance Support

The PostgreSQL MCP server supports running multiple instances with different configurations using the `MCP_SERVER_NAME` environment variable. This is useful for:

- **Multi-environment setups** (development, staging, production)
- **Multiple database connections** (different schemas, databases)
- **Microservices architectures** with separate databases
- **Claude Code CLI usage** with named instances

**Example: Multiple database environments**

```bash
# Create instance-specific config files
echo '{"host":"dev-db","database":"app_dev","user":"dev_user"}' > .dev-postgres.json
echo '{"host":"prod-db","database":"app_prod","user":"prod_user"}' > .prod-postgres.json

# Run with instance names
MCP_SERVER_NAME=dev-postgres node dist/mcp-server.js
MCP_SERVER_NAME=prod-postgres node dist/mcp-server.js
```

**Configuration File Resolution:**
1. **Instance-specific**: `.{MCP_SERVER_NAME}.json` (e.g., `.my-database.json`)
2. **Default fallback**: `.postgresql-mcp.json`
3. **Environment variables**: Always available as fallback

### Quick Configuration

**Option 1: Environment Variables**
```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=mydb
export PGUSER=myuser
export PGPASSWORD=mypassword
```

**Option 2: Configuration File** (`.postgresql-mcp.json`)
```json
{
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "user": "myuser",
  "password": "mypassword",
  "ssl": false
}
```

**Option 3: Instance-Specific Configuration**
```bash
# .dev-db.json
{
  "host": "dev-postgres",
  "database": "app_dev", 
  "user": "dev_user",
  "password": "dev_pass"
}

# .prod-db.json
{
  "host": "prod-postgres",
  "database": "app_prod",
  "user": "prod_user", 
  "password": "prod_pass",
  "ssl": true
}
```

**Option 3: Connection URL**
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/mydb?sslmode=require"
```

For detailed authentication options including SSL/TLS setup, certificate authentication, connection pooling, and cloud-specific configurations (AWS RDS, Google Cloud SQL, Azure, Heroku), see the **[Authentication Guide](./AUTHENTICATION.md)**.

For more configuration examples and troubleshooting tips, see the **[Configuration Examples](./CONFIG_EXAMPLES.md)**.

## Usage with Claude Desktop

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "node",
      "args": ["/path/to/postgresql-mcp-server/dist/mcp-server.js"],
      "env": {
        "PGHOST": "localhost",
        "PGPORT": "5432",
        "PGDATABASE": "mydb",
        "PGUSER": "myuser",
        "PGPASSWORD": "mypassword"
      }
    }
  }
}
```

## Available Tools

The server provides 25+ tools organized into the following categories:

### Query Execution
- `query` - Execute raw SQL queries with parameterized values
- `transaction` - Execute multiple queries atomically
- `explain` - Analyze query execution plans

### Schema Management
- `list_schemas` - List database schemas
- `create_schema` - Create new schemas

### Table Operations
- `list_tables` - List tables with column details
- `describe_table` - Get comprehensive table information
- `create_table` - Create tables with full constraint support
- `drop_table` - Drop tables with cascade options
- `table_stats` - Get table size and performance statistics

### Data Manipulation (DML)
- `select` - Query data with filtering, sorting, pagination
- `insert` - Insert records with RETURNING support
- `update` - Update records with conditions
- `delete` - Delete records with conditions

### Performance Optimization
- `list_indexes` - View table indexes
- `create_index` - Create B-tree, Hash, GIN, GiST indexes
- `analyze_table` - Update query planner statistics
- `vacuum_table` - Reclaim storage and optimize performance

### Advanced Features
- `list_views`, `create_view` - Manage database views
- `list_functions` - List stored procedures and functions
- `list_constraints` - View table constraints
- `list_sequences` - Manage auto-increment sequences
- `list_extensions` - View installed PostgreSQL extensions
- `backup_table` - Export data as SQL or CSV
- `database_stats` - Monitor database health

For detailed documentation of each tool including parameters, examples, and best practices, see the **[Tools Reference](./TOOLS.md)**.

## Tool Examples

### Execute a Query
```json
{
  "tool": "query",
  "arguments": {
    "query": "SELECT * FROM users WHERE created_at > $1",
    "params": ["2024-01-01"]
  }
}
```

### Create a Table
```json
{
  "tool": "create_table",
  "arguments": {
    "schema": "public",
    "table": "users",
    "columns": [
      {
        "name": "id",
        "type": "SERIAL",
        "constraints": "PRIMARY KEY"
      },
      {
        "name": "email",
        "type": "VARCHAR(255)",
        "constraints": "NOT NULL UNIQUE"
      },
      {
        "name": "created_at",
        "type": "TIMESTAMP",
        "constraints": "DEFAULT CURRENT_TIMESTAMP"
      }
    ]
  }
}
```

### Insert Data with RETURNING
```json
{
  "tool": "insert",
  "arguments": {
    "table": "users",
    "data": {
      "email": "user@example.com",
      "name": "John Doe"
    },
    "returning": ["id", "created_at"]
  }
}
```

### Complex SELECT Query
```json
{
  "tool": "select",
  "arguments": {
    "table": "orders",
    "columns": ["id", "customer_id", "total", "status"],
    "where": "status = 'pending' AND total > 100",
    "orderBy": "created_at DESC",
    "limit": 10
  }
}
```

### Transaction Example
```json
{
  "tool": "transaction",
  "arguments": {
    "queries": [
      {
        "query": "INSERT INTO accounts (name, balance) VALUES ($1, $2) RETURNING id",
        "params": ["Alice", 1000]
      },
      {
        "query": "INSERT INTO transactions (account_id, amount, type) VALUES ($1, $2, $3)",
        "params": [1, 1000, "deposit"]
      }
    ]
  }
}
```

### Create Index
```json
{
  "tool": "create_index",
  "arguments": {
    "table": "users",
    "name": "idx_users_email",
    "columns": ["email"],
    "unique": true,
    "method": "btree"
  }
}
```

### Backup Table
```json
{
  "tool": "backup_table",
  "arguments": {
    "schema": "public",
    "table": "users",
    "format": "sql"
  }
}
```

## Security Best Practices

### 1. SQL Injection Prevention
All tools automatically use parameterized queries. Never build queries with string concatenation.

### 2. Credential Management
- Store credentials in environment variables or secure vaults
- Never commit `.postgresql-mcp.json` files with passwords
- Use dedicated database users with minimal required permissions

### 3. Network Security
- Always use SSL/TLS for remote connections
- Configure firewall rules to limit database access
- Use VPN or SSH tunnels for additional security

### 4. Access Control
```sql
-- Create a limited user for the MCP server
CREATE USER mcp_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mydb TO mcp_user;
GRANT USAGE ON SCHEMA public TO mcp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mcp_user;
-- Avoid granting: CREATE, DROP, TRUNCATE, ALTER
```

For more security configurations, see the [Authentication Guide](./AUTHENTICATION.md#security-best-practices).

## Performance Tips

- Use connection pooling (configured via `max` parameter)
- Create appropriate indexes for frequently queried columns
- Regular VACUUM and ANALYZE for optimal performance
- Use EXPLAIN to understand query performance
- Consider pagination for large result sets

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building
```bash
npm run build
```

## Error Handling

All tools include comprehensive error handling:
- Connection errors
- Query syntax errors
- Permission denied errors
- Constraint violations
- Transaction rollbacks

Errors are returned with descriptive messages to help diagnose issues.

## License

ISC