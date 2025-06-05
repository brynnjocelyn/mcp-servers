# PostgreSQL MCP Server Authentication Guide

This guide covers all authentication methods supported by the PostgreSQL MCP server and how to configure them.

## Table of Contents
- [Configuration Hierarchy](#configuration-hierarchy)
- [Authentication Methods](#authentication-methods)
- [Configuration Examples](#configuration-examples)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Configuration Hierarchy

The PostgreSQL MCP server looks for configuration in the following order (first found wins):

1. **Local Configuration File** (`.postgresql-mcp.json`)
   - Project-specific configuration
   - Place in your project root directory
   - Highest priority

2. **Environment Variables**
   - Standard PostgreSQL environment variables
   - Good for CI/CD and containerized deployments
   - Medium priority

3. **Default Values**
   - Built-in defaults for local development
   - Lowest priority

## Authentication Methods

### 1. Password Authentication

The most common authentication method. PostgreSQL supports several password authentication mechanisms:

#### Plain Password
```json
{
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "user": "myuser",
  "password": "mypassword"
}
```

#### MD5 Authentication
Automatically handled by the PostgreSQL client when the server requires it.

#### SCRAM-SHA-256 (PostgreSQL 10+)
The most secure password authentication method, automatically negotiated when available.

### 2. SSL/TLS Authentication

For secure connections, especially important for remote databases:

#### Basic SSL (Encrypted Connection Only)
```json
{
  "host": "remote-db.example.com",
  "database": "production",
  "user": "appuser",
  "password": "secret",
  "ssl": true
}
```

#### SSL with Certificate Verification
```json
{
  "host": "secure-db.example.com",
  "database": "production",
  "user": "appuser",
  "password": "secret",
  "ssl": {
    "rejectUnauthorized": true,
    "ca": "/path/to/server-ca.pem"
  }
}
```

#### Mutual TLS (Client Certificate Authentication)
```json
{
  "host": "mtls-db.example.com",
  "database": "production",
  "user": "certuser",
  "ssl": {
    "rejectUnauthorized": true,
    "ca": "/path/to/server-ca.pem",
    "cert": "/path/to/client-cert.pem",
    "key": "/path/to/client-key.pem"
  }
}
```

### 3. Environment Variable Authentication

Using standard PostgreSQL environment variables:

```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=mydb
export PGUSER=myuser
export PGPASSWORD=mypassword
export PGSSLMODE=require  # Options: disable, allow, prefer, require, verify-ca, verify-full
```

### 4. Connection String Authentication

While not directly exposed, the server internally builds a connection URL:

```
postgresql://user:password@host:port/database?sslmode=require
```

### 5. Unix Domain Socket Authentication

For local connections on Unix systems:

```json
{
  "host": "/var/run/postgresql",
  "database": "mydb",
  "user": "myuser"
}
```

## Configuration Examples

### Local Development
```json
{
  "host": "localhost",
  "port": 5432,
  "database": "dev_db",
  "user": "developer",
  "password": "dev_password"
}
```

### Docker Compose
```json
{
  "host": "postgres",
  "port": 5432,
  "database": "app_db",
  "user": "app_user",
  "password": "app_password"
}
```

### AWS RDS
```json
{
  "host": "myinstance.c1234567890.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "database": "production",
  "user": "rds_user",
  "password": "rds_password",
  "ssl": {
    "rejectUnauthorized": false
  }
}
```

### Google Cloud SQL
```json
{
  "host": "127.0.0.1",
  "port": 5432,
  "database": "production",
  "user": "cloud_user",
  "password": "cloud_password",
  "ssl": {
    "rejectUnauthorized": false
  }
}
```

### Heroku Postgres
```bash
# Heroku provides DATABASE_URL
export DATABASE_URL="postgres://user:pass@host:5432/dbname?sslmode=require"

# Or parse it into components
export PGHOST=$(echo $DATABASE_URL | grep -oP '(?<=@)[^:]+')
export PGPORT=$(echo $DATABASE_URL | grep -oP '(?<=:)[0-9]+(?=/)')
export PGDATABASE=$(echo $DATABASE_URL | grep -oP '(?<=/)[^?]+')
export PGUSER=$(echo $DATABASE_URL | grep -oP '(?<=://)[^:]+')
export PGPASSWORD=$(echo $DATABASE_URL | grep -oP '(?<=:)[^@]+(?=@)')
export PGSSLMODE=require
```

### Azure Database for PostgreSQL
```json
{
  "host": "myserver.postgres.database.azure.com",
  "port": 5432,
  "database": "postgres",
  "user": "username@myserver",
  "password": "password",
  "ssl": {
    "rejectUnauthorized": true,
    "ca": "/path/to/BaltimoreCyberTrustRoot.crt.pem"
  }
}
```

## Connection Pool Configuration

The server uses connection pooling for better performance:

```json
{
  "host": "localhost",
  "database": "mydb",
  "user": "myuser",
  "password": "mypassword",
  "max": 20,                          // Maximum pool size
  "connectionTimeoutMillis": 30000,   // Connection timeout
  "idleTimeoutMillis": 30000,         // Idle client timeout
  "query_timeout": 30000,             // Query timeout
  "statement_timeout": 30000          // Statement timeout
}
```

## Security Best Practices

### 1. Never Commit Credentials
```bash
# Add to .gitignore
.postgresql-mcp.json
.env
```

### 2. Use Environment Variables in Production
```bash
# Load from .env file
source .env
```

### 3. Create Limited Database Users
```sql
-- Create a user with limited permissions
CREATE USER mcp_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mydb TO mcp_user;
GRANT USAGE ON SCHEMA public TO mcp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mcp_user;
```

### 4. Enable SSL for Remote Connections
```json
{
  "ssl": {
    "rejectUnauthorized": true
  }
}
```

### 5. Use Strong Passwords
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Consider using a password manager

### 6. Rotate Credentials Regularly
- Set up automated credential rotation
- Update both database and application credentials

## Troubleshooting

### Common Authentication Errors

#### FATAL: password authentication failed
- Check username and password
- Verify user exists in PostgreSQL
- Check pg_hba.conf authentication method

#### FATAL: no pg_hba.conf entry for host
- Add client IP to pg_hba.conf
- Check firewall rules
- Verify SSL requirements

#### timeout expired
- Check network connectivity
- Verify host and port
- Check firewall rules

#### self signed certificate
```json
{
  "ssl": {
    "rejectUnauthorized": false
  }
}
```

### Testing Connection
Use the `database_stats` tool to test your connection:

```json
{
  "tool": "database_stats",
  "arguments": {}
}
```

### Debug Connection Issues
1. Test with psql client first:
   ```bash
   psql -h localhost -U myuser -d mydb
   ```

2. Check PostgreSQL logs:
   ```bash
   tail -f /var/log/postgresql/postgresql-*.log
   ```

3. Verify network connectivity:
   ```bash
   telnet hostname 5432
   ```

## Advanced Configuration

### Custom Connection Parameters
```json
{
  "host": "localhost",
  "database": "mydb",
  "user": "myuser",
  "password": "mypassword",
  "application_name": "mcp-server",
  "options": "-c search_path=myschema"
}
```

### Read Replicas
Configure multiple servers for read scaling:
```json
{
  "host": "primary.example.com,replica1.example.com,replica2.example.com",
  "target_session_attrs": "any",
  "database": "mydb",
  "user": "readonly_user",
  "password": "password"
}
```

### Connection String Override
For complex scenarios, you can use a full connection string:
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&application_name=mcp"
```