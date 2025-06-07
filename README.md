# MCP Servers Collection

A collection of Model Context Protocol (MCP) servers for integrating databases and services with LLM applications like Claude Desktop, Cursor, and other MCP-compatible clients.

## Overview

This repository contains seven comprehensive MCP servers:

- **[PostgreSQL MCP Server](./postgresql-mcp-server)** - Full-featured PostgreSQL database management (25+ tools)
- **[Redis MCP Server](./redis-mcp-server)** - Complete Redis operations and data structures (70+ tools)
- **[PocketBase MCP Server](./pocketbase-mcp-server)** - Comprehensive PocketBase instance management (60+ tools)
- **[S3 MCP Server](./s3-mcp-server)** - S3-compatible object storage management (AWS S3, MinIO, DigitalOcean Spaces, etc.) (20+ tools)
- **[Prisma MCP Server](./prisma-mcp-server)** - Universal database ORM supporting PostgreSQL, MySQL, SQLite, MongoDB, and more (25+ tools)
- **[Proxmox MCP Server](./proxmox-mcp-server)** - Proxmox VE virtualization platform management for VMs, containers, and infrastructure (30+ tools)
- **[Cloudflare MCP Server](./cloudflare-mcp-server)** - Complete Cloudflare services management including DNS, security, Workers, and R2 storage (40+ tools)

Each server implements the Model Context Protocol specification, enabling LLMs to interact with these services through standardized tools.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- The respective database/service installed and running:
  - PostgreSQL for postgresql-mcp-server
  - Redis for redis-mcp-server
  - PocketBase for pocketbase-mcp-server
  - S3-compatible storage (AWS S3, MinIO, etc.) for s3-mcp-server
  - Any Prisma-supported database for prisma-mcp-server
  - Proxmox VE for proxmox-mcp-server
  - Cloudflare account for cloudflare-mcp-server

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

# S3 MCP Server
cd ../s3-mcp-server
npm install
npm run build

# Prisma MCP Server
cd ../prisma-mcp-server
npm install
npm run build

# Proxmox MCP Server
cd ../proxmox-mcp-server
npm install
npm run build

# Cloudflare MCP Server
cd ../cloudflare-mcp-server
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

#### S3 Configuration

Create `.s3-mcp.json` in your project:
```json
{
  "endPoint": "s3.amazonaws.com",
  "port": 443,
  "useSSL": true,
  "accessKey": "your-access-key",
  "secretKey": "your-secret-key",
  "region": "us-east-1"
}
```

Or use environment variables:
```bash
# For AWS S3
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1

# For MinIO or other S3-compatible services
export MINIO_ENDPOINT=localhost
export MINIO_PORT=9000
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin
```

#### Prisma Configuration

Create `.prisma-mcp.json` in your project:
```json
{
  "databaseUrl": "postgresql://user:password@localhost:5432/mydb",
  "schemaPath": "./prisma/schema.prisma",
  "enableLogging": true
}
```

Or use environment variables:
```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/mydb
export PRISMA_SCHEMA_PATH=./prisma/schema.prisma
```

#### Proxmox Configuration

Create `.proxmox-mcp.json` in your project:
```json
{
  "host": "proxmox.example.com",
  "port": 8006,
  "username": "api-user",
  "realm": "pve",
  "tokenId": "mcp-token",
  "tokenSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

Or use environment variables:
```bash
export PROXMOX_HOST=proxmox.example.com
export PROXMOX_USERNAME=api-user
export PROXMOX_REALM=pve
export PROXMOX_TOKEN_ID=mcp-token
export PROXMOX_TOKEN_SECRET=your-token-secret
```

#### Cloudflare Configuration

Create `.cloudflare-mcp.json` in your project:
```json
{
  "apiToken": "your-cloudflare-api-token",
  "accountId": "your-account-id"
}
```

Or use environment variables:
```bash
export CLOUDFLARE_API_TOKEN=your-api-token
export CLOUDFLARE_ACCOUNT_ID=your-account-id
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
    },
    "s3": {
      "command": "/path/to/mcp-servers/s3-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "AWS_ACCESS_KEY_ID": "your-access-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret-key",
        "AWS_REGION": "us-east-1"
      }
    },
    "prisma": {
      "command": "/path/to/mcp-servers/prisma-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/mydb"
      }
    },
    "proxmox": {
      "command": "/path/to/mcp-servers/proxmox-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "PROXMOX_HOST": "proxmox.example.com",
        "PROXMOX_USERNAME": "api-user",
        "PROXMOX_REALM": "pve",
        "PROXMOX_TOKEN_ID": "mcp-token",
        "PROXMOX_TOKEN_SECRET": "your-token-secret"
      }
    },
    "cloudflare": {
      "command": "/path/to/mcp-servers/cloudflare-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your-api-token"
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

### S3 MCP Server
- **Universal S3 Support**: Works with AWS S3, MinIO, DigitalOcean Spaces, Backblaze B2, etc.
- **Bucket Operations**: Create, list, delete, policies, versioning
- **Object Management**: Upload, download, copy, delete, metadata
- **Storage Tools**: Presigned URLs, tags, usage statistics
- **Binary Support**: Handle text and binary content seamlessly

### Prisma MCP Server
- **Multi-Database Support**: PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, CockroachDB
- **Schema Management**: Read, write, validate, format Prisma schemas
- **Migration System**: Create, apply, deploy, rollback database migrations
- **Data Operations**: Full CRUD with relations, filtering, pagination
- **Advanced Queries**: Aggregations, raw SQL, transactions
- **Development Tools**: Database introspection, seeding, reset

### Proxmox MCP Server
- **VM Management**: Create, clone, start, stop, migrate virtual machines
- **Container Support**: Full LXC container lifecycle management
- **Storage Operations**: Manage disks, ISOs, templates, and backups
- **Cluster Management**: Monitor nodes, resources, and cluster health
- **Backup/Restore**: Automated backups with compression and scheduling
- **Task Monitoring**: Track long-running operations and migrations

### Cloudflare MCP Server
- **DNS Management**: Complete DNS record management with all record types
- **Security Features**: Firewall rules, WAF, SSL/TLS certificates, DDoS protection
- **Performance**: Cache management, page rules, performance optimization
- **Workers Platform**: Deploy and manage Workers scripts, KV storage, cron triggers
- **R2 Storage**: S3-compatible object storage management
- **Zone Management**: Create, configure, and manage Cloudflare zones

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

- [S3 MCP Server](./s3-mcp-server/README.md)
  - [Tools Reference](./s3-mcp-server/TOOLS.md)
  - [Config Examples](./s3-mcp-server/CONFIG_EXAMPLES.md)
  - [MinIO Configuration Guide](./s3-mcp-server/MINIO_GUIDE.md)

- [Prisma MCP Server](./prisma-mcp-server/README.md)
  - [Tools Reference](./prisma-mcp-server/TOOLS.md)
  - [Config Examples](./prisma-mcp-server/CONFIG_EXAMPLES.md)

- [Proxmox MCP Server](./proxmox-mcp-server/README.md)
  - [Tools Reference](./proxmox-mcp-server/TOOLS.md)
  - [Config Examples](./proxmox-mcp-server/CONFIG_EXAMPLES.md)

- [Cloudflare MCP Server](./cloudflare-mcp-server/README.md)
  - [Tools Reference](./cloudflare-mcp-server/TOOLS.md)
  - [Config Examples](./cloudflare-mcp-server/CONFIG_EXAMPLES.md)

- [MCP Scopes Documentation](./MCP_SCOPES.md)

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