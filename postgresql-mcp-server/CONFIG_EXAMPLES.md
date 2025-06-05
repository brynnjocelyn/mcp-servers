# PostgreSQL MCP Server Configuration Examples

This document provides configuration examples for the PostgreSQL MCP Server.

## Configuration Methods

The PostgreSQL MCP Server can be configured in three ways (in order of precedence):

1. **Local configuration file** (`.postgresql-mcp.json`)
2. **Environment variables**
3. **Default values**

## Configuration File Examples

### Basic Configuration (.postgresql-mcp.json)

Create a `.postgresql-mcp.json` file in your project directory:

```json
{
  "host": "localhost",
  "port": 5432,
  "database": "myapp_db",
  "user": "postgres",
  "password": "your_password"
}
```

### Production Configuration with SSL

```json
{
  "host": "prod-db.example.com",
  "port": 5432,
  "database": "production_db",
  "user": "app_user",
  "password": "secure_password",
  "ssl": {
    "rejectUnauthorized": true,
    "ca": "/path/to/ca-cert.pem",
    "cert": "/path/to/client-cert.pem",
    "key": "/path/to/client-key.pem"
  },
  "max": 50,
  "connectionTimeoutMillis": 30000,
  "query_timeout": 60000
}
```

### Development Configuration

```json
{
  "host": "localhost",
  "port": 5432,
  "database": "dev_db",
  "user": "dev_user",
  "password": "dev_password",
  "ssl": false,
  "max": 5
}
```

### Cloud Database Configuration (e.g., AWS RDS)

```json
{
  "host": "mydb.c123456789.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "database": "myapp",
  "user": "dbadmin",
  "password": "rds_password",
  "ssl": {
    "rejectUnauthorized": true
  },
  "max": 20,
  "statement_timeout": 30000
}
```

## Environment Variables

You can also configure the server using PostgreSQL standard environment variables:

```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=myapp_db
export PGUSER=postgres
export PGPASSWORD=your_password
export PGSSLMODE=require  # or 'disable'
```

## Claude Desktop Configuration

### Using Configuration File

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "/path/to/postgresql-mcp-server/dist/mcp-server.js",
      "args": [],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### Using Environment Variables

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "/path/to/postgresql-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "PGHOST": "localhost",
        "PGPORT": "5432",
        "PGDATABASE": "myapp_db",
        "PGUSER": "postgres",
        "PGPASSWORD": "your_password"
      }
    }
  }
}
```

## Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | string | `localhost` | Database server hostname |
| `port` | number | `5432` | Database server port |
| `database` | string | `postgres` | Database name |
| `user` | string | `postgres` | Database username |
| `password` | string | `''` | Database password |
| `ssl` | boolean/object | `false` | SSL configuration |
| `max` | number | `10` | Maximum number of clients in pool |
| `connectionTimeoutMillis` | number | `30000` | Connection timeout in milliseconds |
| `query_timeout` | number | `30000` | Query timeout in milliseconds |
| `statement_timeout` | number | `30000` | Statement timeout in milliseconds |
| `idle_in_transaction_session_timeout` | number | `60000` | Idle transaction timeout in milliseconds |

## SSL Configuration Options

When `ssl` is an object, you can specify:

| Option | Type | Description |
|--------|------|-------------|
| `rejectUnauthorized` | boolean | Whether to verify the server certificate |
| `ca` | string | Path to CA certificate file |
| `cert` | string | Path to client certificate file |
| `key` | string | Path to client key file |

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running
- Check if the host and port are correct
- Verify firewall rules allow the connection

### Authentication Failed
- Verify username and password
- Check pg_hba.conf for authentication method
- Ensure the user has proper permissions

### SSL Connection Required
- Set `ssl: true` in configuration
- For cloud databases, you may need `"ssl": { "rejectUnauthorized": false }`

### Connection Timeout
- Increase `connectionTimeoutMillis`
- Check network connectivity
- Verify database server is accessible

Last Updated On: 6/5/2025