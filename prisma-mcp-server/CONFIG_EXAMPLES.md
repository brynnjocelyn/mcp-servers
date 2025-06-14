# Prisma MCP Server Configuration Examples

This document provides configuration examples for various database setups and use cases.

## Configuration Methods

The Prisma MCP Server can be configured in three ways (in order of precedence):

1. **Local configuration file** (`.prisma-mcp.json`)
2. **Environment variables**
3. **Default values**

## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `projectRoot` | string | Root directory of your Prisma project (supports relative paths) | Current working directory |
| `databaseUrl` | string | Database connection URL | Value from DATABASE_URL env var |
| `databaseProvider` | string | Database provider (auto-detected from URL) | Auto-detected |
| `schemaPath` | string | Path to Prisma schema file (relative to projectRoot) | `./prisma/schema.prisma` |
| `migrationsDir` | string | Path to migrations directory (relative to projectRoot) | `./prisma/migrations` |
| `enableLogging` | boolean | Enable Prisma query logging | false |
| `connectionLimit` | number | Database connection pool limit | 10 |
| `ssl` | object | SSL/TLS configuration | undefined |
| `pool` | object | Connection pool configuration | undefined |
| `connection` | object | Alternative connection format | undefined |

## Basic Configuration Examples

### PostgreSQL Configuration

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "postgresql://postgres:password@localhost:5432/mydb",
  "schemaPath": "./prisma/schema.prisma",
  "enableLogging": true
}
```

**Environment Variables:**
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb"
export PRISMA_SCHEMA_PATH="./prisma/schema.prisma"
export PRISMA_LOGGING=true
```

### MySQL Configuration

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "mysql://root:password@localhost:3306/mydb",
  "schemaPath": "./prisma/schema.prisma",
  "connectionLimit": 20
}
```

**Environment Variables:**
```bash
export DATABASE_URL="mysql://root:password@localhost:3306/mydb"
export PRISMA_CONNECTION_LIMIT=20
```

### SQLite Configuration

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "file:./dev.db",
  "schemaPath": "./prisma/schema.prisma"
}
```

**Environment Variables:**
```bash
export DATABASE_URL="file:./dev.db"
```

### MongoDB Configuration

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "mongodb+srv://user:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority",
  "schemaPath": "./prisma/schema.prisma"
}
```

### SQL Server Configuration

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "sqlserver://localhost:1433;database=mydb;user=sa;password=YourStrong@Passw0rd;encrypt=true;trustServerCertificate=true",
  "schemaPath": "./prisma/schema.prisma"
}
```

## Claude Desktop Configuration Examples

### Single Database Setup

```json
{
  "mcpServers": {
    "prisma": {
      "command": "/path/to/prisma-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/myapp"
      }
    }
  }
}
```

### Multiple Database Setup

```json
{
  "mcpServers": {
    "prisma-dev": {
      "command": "/path/to/prisma-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/myapp_dev",
        "PRISMA_SCHEMA_PATH": "./projects/myapp/prisma/schema.prisma"
      }
    },
    "prisma-staging": {
      "command": "/path/to/prisma-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@staging.example.com:5432/myapp",
        "PRISMA_SCHEMA_PATH": "./projects/myapp/prisma/schema.prisma"
      }
    },
    "prisma-prod": {
      "command": "/path/to/prisma-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@prod.example.com:5432/myapp",
        "PRISMA_SCHEMA_PATH": "./projects/myapp/prisma/schema.prisma",
        "PRISMA_LOGGING": "false"
      }
    }
  }
}
```

### Microservices Architecture

```json
{
  "mcpServers": {
    "prisma-users": {
      "command": "/path/to/prisma-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/users_db",
        "PRISMA_SCHEMA_PATH": "./services/users/prisma/schema.prisma"
      }
    },
    "prisma-orders": {
      "command": "/path/to/prisma-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/orders_db",
        "PRISMA_SCHEMA_PATH": "./services/orders/prisma/schema.prisma"
      }
    },
    "prisma-inventory": {
      "command": "/path/to/prisma-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/inventory_db",
        "PRISMA_SCHEMA_PATH": "./services/inventory/prisma/schema.prisma"
      }
    }
  }
}
```

## Connection URL Examples

### PostgreSQL with SSL

```
postgresql://user:password@host:5432/database?sslmode=require&sslcert=./certs/client-cert.pem&sslkey=./certs/client-key.pem&sslrootcert=./certs/ca-cert.pem
```

### Enhanced SSL Configuration

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "postgresql://user:password@host:5432/database",
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": true,
    "ca": "./certs/ca-cert.pem",
    "cert": "./certs/client-cert.pem",
    "key": "./certs/client-key.pem"
  }
}
```

### MySQL with Connection Pool

```
mysql://user:password@host:3306/database?connection_limit=10&connect_timeout=30
```

### MongoDB Replica Set

```
mongodb://user:password@host1:27017,host2:27017,host3:27017/database?replicaSet=myReplicaSet&authSource=admin
```

### SQLite In-Memory Database

```
file::memory:
```

### SQL Server with Named Instance

```
sqlserver://host\\instance:1433;database=mydb;user=sa;password=YourPassword;encrypt=true
```

## Cloud Provider Configurations

### AWS RDS PostgreSQL

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "postgresql://username:password@mydb.c123456789012.us-east-1.rds.amazonaws.com:5432/dbname",
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": true
  }
}
```

### Supabase

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "postgresql://postgres.username:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  "ssl": {
    "enabled": true
  },
  "pool": {
    "max": 20
  }
}
```

### PlanetScale (MySQL)

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "mysql://username:password@aws.connect.psdb.cloud/dbname?ssl={\"rejectUnauthorized\":true}"
}
```

### Neon

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/dbname?sslmode=require"
}
```

### Railway

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway",
  "ssl": {
    "enabled": true
  }
}
```

### Component-Based Connection

**.prisma-mcp.json:**
```json
{
  "connection": {
    "host": "mydb.c123456789012.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "database": "myapp",
    "user": "dbuser",
    "password": "securepassword"
  },
  "databaseProvider": "postgresql",
  "ssl": {
    "enabled": true
  }
}
```

## Advanced Configurations

### Development with Docker

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "postgresql://postgres:postgres@localhost:5432/dev_db",
  "schemaPath": "./prisma/schema.prisma",
  "migrationsDir": "./prisma/migrations",
  "enableLogging": true
}
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dev_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Production with Connection Pooling

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "postgresql://user:password@db.example.com:5432/prod_db?connection_limit=50&pool_timeout=30",
  "schemaPath": "./prisma/schema.prisma",
  "enableLogging": false,
  "connectionLimit": 50
}
```

### Multi-Schema PostgreSQL

**.prisma-mcp.json:**
```json
{
  "databaseUrl": "postgresql://user:password@localhost:5432/mydb?schema=public&schema=auth&schema=billing",
  "schemaPath": "./prisma/schema.prisma"
}
```

## Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `databaseUrl` | string | - | Database connection URL |
| `databaseProvider` | string | auto-detect | Database provider (postgresql, mysql, sqlite, etc.) |
| `schemaPath` | string | `./prisma/schema.prisma` | Path to Prisma schema file |
| `migrationsDir` | string | `./prisma/migrations` | Path to migrations directory |
| `enableLogging` | boolean | false | Enable Prisma query logging |
| `connectionLimit` | number | 10 | Maximum number of connections |

## Troubleshooting

### Connection Timeout

For slow connections, increase the timeout:
```
postgresql://user:password@host:5432/db?connect_timeout=30
```

### SSL Certificate Issues

For self-signed certificates:
```
postgresql://user:password@host:5432/db?sslmode=require&sslaccept=accept_invalid_certs
```

### Character Encoding

For UTF-8 support:
```
mysql://user:password@host:3306/db?charset=utf8mb4
```

### Time Zone Configuration

For specific timezone:
```
postgresql://user:password@host:5432/db?timezone=UTC
```

## Monorepo and Subdirectory Configuration

When your Prisma project is in a subdirectory of your main project (common in monorepos), use the `projectRoot` option:

### Basic Subdirectory Setup

**.prisma-mcp.json:**
```json
{
  "projectRoot": "./api",
  "schemaPath": "./prisma/schema.prisma",
  "migrationsDir": "./prisma/migrations"
}
```

This configuration:
- Sets the working directory to `./api` relative to where the MCP server starts
- Loads the `.env` file from `./api/.env` (if it exists)
- Runs all Prisma commands from the `./api` directory
- Loads the generated Prisma Client from `./api/node_modules/@prisma/client`

### Full Monorepo Example

For a project structure like:
```
my-app/
├── frontend/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── .env
│   └── node_modules/
└── .prisma-mcp.json
```

**.prisma-mcp.json:**
```json
{
  "projectRoot": "./backend",
  "schemaPath": "./prisma/schema.prisma",
  "enableLogging": true
}
```

### Absolute Path Configuration

You can also use absolute paths:

```json
{
  "projectRoot": "/Users/username/projects/my-app/api",
  "schemaPath": "./prisma/schema.prisma"
}
```

### Environment Variable Loading

When `projectRoot` is specified, the server will:
1. First look for `.env` in the project root directory
2. Load environment variables from that file
3. Use those variables for DATABASE_URL and other configuration

This eliminates the need for symlinks or duplicate `.env` files.

## Security Best Practices

1. **Never commit credentials**: Use environment variables for sensitive data
2. **Use SSL/TLS**: Always encrypt database connections in production
3. **Limit permissions**: Create database users with minimal required permissions
4. **Rotate credentials**: Regularly update database passwords
5. **Use connection pooling**: Prevent connection exhaustion attacks

Last Updated On: June 14, 2025