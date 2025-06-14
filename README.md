# MCP Servers Collection

A collection of Model Context Protocol (MCP) servers for integrating databases and services with LLM applications like Claude Desktop, Cursor, and other MCP-compatible clients.

## Overview

This repository contains eleven comprehensive MCP servers:

- **[PostgreSQL MCP Server](./postgresql-mcp-server)** - Full-featured PostgreSQL database management (25+ tools)
- **[Redis MCP Server](./redis-mcp-server)** - Complete Redis operations and data structures (70+ tools)
- **[PocketBase MCP Server](./pocketbase-mcp-server)** - Comprehensive PocketBase instance management (60+ tools)
- **[S3 MCP Server](./s3-mcp-server)** - S3-compatible object storage management (AWS S3, MinIO, DigitalOcean Spaces, etc.) (20+ tools)
- **[Prisma MCP Server](./prisma-mcp-server)** - Universal database ORM supporting PostgreSQL, MySQL, SQLite, MongoDB, and more (25+ tools)
- **[Proxmox MCP Server](./proxmox-mcp-server)** - Proxmox VE virtualization platform management for VMs, containers, and infrastructure (30+ tools)
- **[Cloudflare MCP Server](./cloudflare-mcp-server)** - Complete Cloudflare services management including DNS, security, Workers, and R2 storage (40+ tools)
- **[LinkedIn MCP Server](./linkedin-mcp-server)** - LinkedIn integration for sharing posts, managing content, and social media automation (12+ tools)
- **[Ansible MCP Server](./ansible-mcp-server)** - Ansible automation with playbook execution, inventory management, and infrastructure orchestration (17+ tools)
- **[Ceph MCP Server](./ceph-mcp-server)** - Ceph distributed storage cluster management including pools, OSDs, RBD, CephFS, and S3 gateway (25+ tools)
- **[Jenkins MCP Server](./jenkins-mcp-server)** - Jenkins CI/CD automation with job management, build operations, and pipeline support (23+ tools)

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
  - LinkedIn account and app credentials for linkedin-mcp-server
  - Ansible 2.9+ for ansible-mcp-server
  - Ceph cluster and CLI tools for ceph-mcp-server
  - Jenkins instance for jenkins-mcp-server

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

# LinkedIn MCP Server
cd ../linkedin-mcp-server
npm install
npm run build

# Ansible MCP Server
cd ../ansible-mcp-server
npm install
npm run build

# Ceph MCP Server
cd ../ceph-mcp-server
npm install
npm run build
```

### Configuration

Each server can be configured using environment variables, configuration files, or Claude Desktop/Claude Code settings.

#### Multiple Instance Support

All MCP servers support running multiple instances with different configurations using the `MCP_SERVER_NAME` environment variable. This is especially useful for:

- **Multi-environment setups** (development, staging, production)
- **Microservices architectures** with separate databases
- **Multiple projects** requiring different configurations
- **Claude Code CLI usage** with named instances

**Example: Multiple PostgreSQL databases**

```bash
# Create instance-specific config files
echo '{"host":"dev-db","database":"app_dev"}' > .dev-postgres.json
echo '{"host":"prod-db","database":"app_prod"}' > .prod-postgres.json

# Run with instance names
MCP_SERVER_NAME=dev-postgres node postgresql-mcp-server/dist/mcp-server.js
MCP_SERVER_NAME=prod-postgres node postgresql-mcp-server/dist/mcp-server.js
```

**Instance Naming Convention:**
- Primary config: `.{MCP_SERVER_NAME}.json` (e.g., `.my-postgres.json`)
- Fallback config: `.{service}-mcp.json` (e.g., `.postgresql-mcp.json`)
- Environment variables remain the same

#### Claude Code vs Claude Desktop

**Claude Code (CLI)**: Supports named instances natively through the server name configuration. Use `MCP_SERVER_NAME` environment variable to specify which configuration to load.

**Claude Desktop**: Configure multiple instances in the JSON config file with different server names and environment variables.

#### Basic Configuration Examples

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

#### LinkedIn Configuration

Create `.linkedin-mcp.json` in your project:
```json
{
  "clientId": "your-linkedin-client-id",
  "clientSecret": "your-linkedin-client-secret",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social"
}
```

Or use environment variables:
```bash
export LINKEDIN_CLIENT_ID=your-client-id
export LINKEDIN_CLIENT_SECRET=your-client-secret
export LINKEDIN_REDIRECT_URI=http://localhost:3000/callback
```

#### Ansible Configuration

Create `.ansible-mcp.json` in your project:
```json
{
  "inventoryPath": "./inventory",
  "playbooksPath": "./playbooks",
  "vaultPasswordFile": "./.vault_pass",
  "remoteUser": "ansible",
  "forks": 10,
  "hostKeyChecking": false
}
```

Or use environment variables:
```bash
export ANSIBLE_INVENTORY=./inventory
export ANSIBLE_PLAYBOOKS_PATH=./playbooks
export ANSIBLE_VAULT_PASSWORD_FILE=./.vault_pass
export ANSIBLE_HOST_KEY_CHECKING=false
```

#### Ceph Configuration

Create `.ceph-mcp.json` in your project:
```json
{
  "cluster_name": "ceph",
  "monitor_hosts": ["mon1.example.com", "mon2.example.com"],
  "username": "client.admin",
  "keyring_path": "/etc/ceph/ceph.client.admin.keyring",
  "pool_name": "default"
}
```

Or use environment variables:
```bash
export CEPH_CLUSTER_NAME=ceph
export CEPH_MONITOR_HOSTS="mon1.example.com,mon2.example.com"
export CEPH_USERNAME=client.admin
export CEPH_KEYRING_PATH=/etc/ceph/ceph.client.admin.keyring
export CEPH_POOL_NAME=default
```

## Client Integration

### Claude Desktop Integration

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
    },
    "linkedin": {
      "command": "/path/to/mcp-servers/linkedin-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {}
    },
    "ansible": {
      "command": "/path/to/mcp-servers/ansible-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "ANSIBLE_INVENTORY": "/path/to/inventory"
      }
    },
    "ceph": {
      "command": "/path/to/mcp-servers/ceph-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "CEPH_CLUSTER_NAME": "ceph",
        "CEPH_MONITOR_HOSTS": "mon1.example.com,mon2.example.com"
      }
    }
  }
}
```

### Claude Code Integration

With Claude Code, you can use named instances by setting the `MCP_SERVER_NAME` environment variable:

```bash
# Development database
MCP_SERVER_NAME=dev-db node postgresql-mcp-server/dist/mcp-server.js

# Production database  
MCP_SERVER_NAME=prod-db node postgresql-mcp-server/dist/mcp-server.js

# Different S3 buckets
MCP_SERVER_NAME=images-bucket node s3-mcp-server/dist/mcp-server.js
MCP_SERVER_NAME=docs-bucket node s3-mcp-server/dist/mcp-server.js
```

Create corresponding config files:
```bash
# .dev-db.json
{"host": "dev-postgres", "database": "app_dev"}

# .prod-db.json  
{"host": "prod-postgres", "database": "app_prod"}

# .images-bucket.json
{"endPoint": "s3.amazonaws.com", "accessKey": "...", "region": "us-east-1"}

# .docs-bucket.json
{"endPoint": "eu.minio.com", "accessKey": "...", "region": "eu-west-1"}
```

## Microservices Architecture Support

For microservices with multiple databases, configure separate named instances:

**Claude Desktop Configuration:**
```json
{
  "mcpServers": {
    "postgres-service1": {
      "command": "/path/to/postgresql-mcp-server/dist/mcp-server.js",
      "env": {
        "MCP_SERVER_NAME": "service1-db",
        "PGDATABASE": "service1_db",
        "PGPORT": "5432"
      }
    },
    "postgres-service2": {
      "command": "/path/to/postgresql-mcp-server/dist/mcp-server.js",
      "env": {
        "MCP_SERVER_NAME": "service2-db", 
        "PGDATABASE": "service2_db",
        "PGPORT": "5433"
      }
    }
  }
}
```

**Claude Code Usage:**
```bash
# Create config files
echo '{"host":"service1-db","database":"service1_db"}' > .service1-db.json
echo '{"host":"service2-db","database":"service2_db"}' > .service2-db.json

# Run with instance names
MCP_SERVER_NAME=service1-db node postgresql-mcp-server/dist/mcp-server.js
MCP_SERVER_NAME=service2-db node postgresql-mcp-server/dist/mcp-server.js
```

Then specify which database in your prompts:
- "Using postgres-service1, show all users"
- "Query orders in postgres-service2"

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

### LinkedIn MCP Server
- **OAuth2 Authentication**: Secure login with automatic token refresh
- **Content Sharing**: Share text posts, articles, and images on LinkedIn
- **Post Management**: View, analyze, and delete your LinkedIn posts
- **Analytics**: Get engagement metrics and post performance data
- **Company Pages**: Search companies and share content as company admin
- **Media Upload**: Upload and share images with captions

### Ansible MCP Server
- **Playbook Execution**: Run playbooks with full option support and history tracking
- **Inventory Management**: Dynamic inventory with SQLite backend and Proxmox integration
- **Ad-hoc Commands**: Execute Ansible modules on any host pattern
- **Playbook Library**: Organize, categorize, and track playbook usage
- **Vault Integration**: Encrypt/decrypt sensitive data with Ansible Vault
- **Execution History**: Track all runs with detailed logging and metrics
- **Galaxy Support**: Install roles and collections from requirements files
- **Proxmox Import**: Import VMs and containers from Proxmox clusters

### Ceph MCP Server
- **Cluster Management**: Monitor health, status, configuration, and performance
- **Pool Operations**: Create, manage, and monitor storage pools
- **OSD Management**: View and manage Object Storage Daemons
- **RBD Support**: Full RADOS Block Device management
- **CephFS Operations**: Monitor metadata servers and filesystems
- **S3 Gateway**: Manage RADOS Gateway users and buckets

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

- [LinkedIn MCP Server](./linkedin-mcp-server/README.md)
  - [Authentication Guide](./linkedin-mcp-server/AUTHENTICATION.md)
  - [Tools Reference](./linkedin-mcp-server/TOOLS.md)
  - [Config Examples](./linkedin-mcp-server/CONFIG_EXAMPLES.md)

- [Ansible MCP Server](./ansible-mcp-server/README.md)
  - [Tools Reference](./ansible-mcp-server/TOOLS.md)
  - [Config Examples](./ansible-mcp-server/CONFIG_EXAMPLES.md)

- [Ceph MCP Server](./ceph-mcp-server/README.md)
  - [Tools Reference](./ceph-mcp-server/TOOLS.md)
  - [Config Examples](./ceph-mcp-server/CONFIG_EXAMPLES.md)

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

Last Updated On: 2025-06-14