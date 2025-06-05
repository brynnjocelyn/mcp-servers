# MCP Servers Collection

A collection of Model Context Protocol (MCP) servers for integrating databases and services with LLM applications like Claude Desktop, Cursor, and other MCP-compatible clients.

## Overview

This repository contains three comprehensive MCP servers:

- **[PostgreSQL MCP Server](./postgresql-mcp-server)** - Full-featured PostgreSQL database management (25+ tools)
- **[Redis MCP Server](./redis-mcp-server)** - Complete Redis operations and data structures (70+ tools)
- **[PocketBase MCP Server](./pocketbase-mcp-server)** - Comprehensive PocketBase instance management (60+ tools)

Each server implements the Model Context Protocol specification, enabling LLMs to interact with these services through standardized tools.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- The respective database/service installed and running:
  - PostgreSQL for postgresql-mcp-server
  - Redis for redis-mcp-server
  - PocketBase for pocketbase-mcp-server

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/mcp-servers.git
cd mcp-servers
```

2. Install and build each server you need:

```bash
# PostgreSQL MCP Server
cd postgresql-mcp-server
npm install
npm run build

# Redis MCP Server
cd ../redis-mcp-server
npm install
npm run build

# PocketBase MCP Server
cd ../pocketbase-mcp-server
npm install
npm run build
```

### Configuration

Each server can be configured using environment variables, configuration files, or Claude Desktop settings.

#### PostgreSQL Configuration

Create `.postgresql-mcp.json` in your project:
```json
{
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "user": "postgres",
  "password": "password"
}
```

Or use environment variables:
```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=mydb
export PGUSER=postgres
export PGPASSWORD=password
```

#### Redis Configuration

Create `.redis-mcp.json` in your project:
```json
{
  "host": "localhost",
  "port": 6379,
  "password": "optional_password"
}
```

Or use environment variables:
```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=optional_password
```

#### PocketBase Configuration

Create `.pocketbase-mcp.json` in your project:
```json
{
  "url": "http://localhost:8090"
}
```

Or use environment variables:
```bash
export POCKETBASE_URL=http://localhost:8090
```

## Claude Desktop Integration

Add the servers to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "/path/to/mcp-servers/postgresql-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "PGHOST": "localhost",
        "PGPORT": "5432",
        "PGDATABASE": "mydb",
        "PGUSER": "postgres",
        "PGPASSWORD": "password"
      }
    },
    "redis": {
      "command": "/path/to/mcp-servers/redis-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "REDIS_HOST": "localhost",
        "REDIS_PORT": "6379"
      }
    },
    "pocketbase": {
      "command": "/path/to/mcp-servers/pocketbase-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "POCKETBASE_URL": "http://localhost:8090"
      }
    }
  }
}
```

## Microservices Architecture Support

For microservices with multiple databases, configure separate named instances:

```json
{
  "mcpServers": {
    "postgres-service1": {
      "command": "/path/to/postgresql-mcp-server/dist/mcp-server.js",
      "env": {
        "PGDATABASE": "service1_db",
        "PGPORT": "5432"
      }
    },
    "postgres-service2": {
      "command": "/path/to/postgresql-mcp-server/dist/mcp-server.js",
      "env": {
        "PGDATABASE": "service2_db",
        "PGPORT": "5433"
      }
    }
  }
}
```

Then specify which database in your prompts:
- "Using postgres-service1, show all users"
- "Query orders in postgres-service2"

See [Multi-Database Setup Guide](./docs/multi-database-setup.md) for detailed instructions.

## Features by Server

### PostgreSQL MCP Server
- **Query Execution**: Raw SQL, parameterized queries, transactions
- **Schema Management**: Create/list schemas, full DDL support
- **Table Operations**: CRUD, statistics, maintenance
- **Performance Tools**: EXPLAIN plans, indexes, VACUUM, ANALYZE
- **Advanced Features**: Views, functions, constraints, backups

### Redis MCP Server
- **Data Types**: Strings, lists, hashes, sets, sorted sets, streams
- **Advanced Operations**: Geo, HyperLogLog, pub/sub, transactions
- **Management**: Configuration, monitoring, persistence
- **Cluster Support**: Standalone, Sentinel, and Cluster modes
- **Scripting**: Lua script execution

### PocketBase MCP Server
- **Collection Management**: CRUD, schema updates, import/export
- **Record Operations**: Full CRUD with filtering and pagination
- **Authentication**: Multiple auth methods, user management
- **File Management**: URL generation, private files
- **System Operations**: Backups, logs, settings, hooks

## Development

### Running in Development

```bash
# In any server directory
npm run dev
```

### Building

```bash
npm run build
```

### Adding New Tools

1. Define the tool schema using Zod
2. Add to the tools list in `mcp-server.ts`
3. Implement the handler
4. Rebuild and test

## Troubleshooting

### Server Won't Load in Claude Desktop

1. **Check permissions**: Ensure `dist/mcp-server.js` is executable:
   ```bash
   chmod +x dist/mcp-server.js
   ```

2. **Verify build**: Make sure the TypeScript is compiled:
   ```bash
   npm run build
   ```

3. **Check credentials**: Verify database connection settings

4. **View logs**: Check Claude Desktop logs for detailed error messages

### Connection Issues

- Ensure the database/service is running
- Check firewall rules
- Verify credentials and permissions
- Test connection with native clients first

### Schema Validation Errors

If you see "Invalid literal value, expected 'object'" errors, ensure all servers are using the latest build with proper JSON Schema formatting.

## Documentation

Each server has detailed documentation:

- [PostgreSQL MCP Server](./postgresql-mcp-server/README.md)
  - [Authentication Guide](./postgresql-mcp-server/AUTHENTICATION.md)
  - [Tools Reference](./postgresql-mcp-server/TOOLS.md)
  - [Config Examples](./postgresql-mcp-server/CONFIG_EXAMPLES.md)

- [Redis MCP Server](./redis-mcp-server/README.md)
  - [Authentication Guide](./redis-mcp-server/AUTHENTICATION.md)
  - [Tools Reference](./redis-mcp-server/TOOLS.md)
  - [Config Examples](./redis-mcp-server/CONFIG_EXAMPLES.md)

- [PocketBase MCP Server](./pocketbase-mcp-server/README.md)
  - [Config Examples](./pocketbase-mcp-server/CONFIG_EXAMPLES.md)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests if applicable
4. Submit a pull request

## License

ISC License - See individual server directories for details.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review closed issues for solutions

Last Updated On: 2025-06-05