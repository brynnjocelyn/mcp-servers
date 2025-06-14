# Prisma MCP Server - Authentication Guide

This guide covers all authentication and connection options for the Prisma MCP Server.

**Last Updated On:** December 13, 2024

## Table of Contents

1. [Configuration Methods](#configuration-methods)
2. [Database Connection Options](#database-connection-options)
3. [SSL/TLS Configuration](#ssltls-configuration)
4. [Connection Pooling](#connection-pooling)
5. [Cloud Provider Examples](#cloud-provider-examples)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

## Configuration Methods

The Prisma MCP Server supports three configuration methods, with the following precedence:

1. **Local config file** (`.prisma-mcp.json`) - Highest priority
2. **Environment variables** - Medium priority
3. **Default values** - Lowest priority

### Method 1: Local Configuration File

Create a `.prisma-mcp.json` file in your project root:

```json
{
  "databaseUrl": "postgresql://user:password@localhost:5432/mydb",
  "projectRoot": "./my-project",
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": true
  }
}
```

### Method 2: Environment Variables

Set environment variables in your shell or `.env` file:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
export PRISMA_SSL_ENABLED="true"
export PRISMA_POOL_MAX="20"
```

### Method 3: Component-Based Configuration

Instead of a connection URL, you can specify connection components:

```json
{
  "connection": {
    "host": "localhost",
    "port": 5432,
    "database": "mydb",
    "user": "myuser",
    "password": "mypassword"
  },
  "databaseProvider": "postgresql"
}
```

## Database Connection Options

### PostgreSQL

Standard connection:
```json
{
  "databaseUrl": "postgresql://user:password@localhost:5432/mydb"
}
```

With SSL:
```json
{
  "databaseUrl": "postgresql://user:password@localhost:5432/mydb?sslmode=require",
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": true
  }
}
```

### MySQL

Standard connection:
```json
{
  "databaseUrl": "mysql://user:password@localhost:3306/mydb"
}
```

With SSL:
```json
{
  "databaseUrl": "mysql://user:password@localhost:3306/mydb?ssl=true",
  "ssl": {
    "enabled": true,
    "ca": "/path/to/ca-cert.pem"
  }
}
```

### SQLite

Local file:
```json
{
  "databaseUrl": "file:./dev.db"
}
```

### SQL Server

Standard connection:
```json
{
  "databaseUrl": "sqlserver://localhost:1433;database=mydb;user=sa;password=mypassword;encrypt=true"
}
```

### MongoDB

Standard connection:
```json
{
  "databaseUrl": "mongodb://user:password@localhost:27017/mydb"
}
```

With replica set:
```json
{
  "databaseUrl": "mongodb://user:password@host1:27017,host2:27017,host3:27017/mydb?replicaSet=myReplSet"
}
```

### CockroachDB

```json
{
  "databaseUrl": "postgresql://user:password@cluster.cockroachlabs.cloud:26257/mydb?sslmode=require"
}
```

## SSL/TLS Configuration

### Basic SSL

Enable SSL with default settings:

```json
{
  "ssl": {
    "enabled": true
  }
}
```

### Advanced SSL

Full SSL configuration with certificates:

```json
{
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": true,
    "ca": "/path/to/ca-cert.pem",
    "cert": "/path/to/client-cert.pem",
    "key": "/path/to/client-key.pem"
  }
}
```

### Environment Variables for SSL

```bash
export PRISMA_SSL_ENABLED="true"
export PRISMA_SSL_REJECT_UNAUTHORIZED="true"
export PRISMA_SSL_CA="/path/to/ca-cert.pem"
export PRISMA_SSL_CERT="/path/to/client-cert.pem"
export PRISMA_SSL_KEY="/path/to/client-key.pem"
```

## Connection Pooling

### Basic Pool Configuration

```json
{
  "pool": {
    "min": 2,
    "max": 20,
    "acquire": 30000,
    "idle": 10000
  }
}
```

### Environment Variables for Pooling

```bash
export PRISMA_POOL_MIN="2"
export PRISMA_POOL_MAX="20"
export PRISMA_POOL_ACQUIRE="30000"
export PRISMA_POOL_IDLE="10000"
```

### Connection Limit (Legacy)

For backward compatibility:

```json
{
  "connectionLimit": 10
}
```

## Cloud Provider Examples

### AWS RDS PostgreSQL

```json
{
  "databaseUrl": "postgresql://username:password@mydb.c123456789012.us-east-1.rds.amazonaws.com:5432/dbname",
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": true
  }
}
```

### AWS RDS MySQL with IAM Authentication

```json
{
  "connection": {
    "host": "mydb.c123456789012.us-east-1.rds.amazonaws.com",
    "port": 3306,
    "database": "mydb",
    "user": "iam_user"
  },
  "ssl": {
    "enabled": true,
    "ca": "/opt/aws/rds-ca-2019-root.pem"
  }
}
```

### Azure Database for PostgreSQL

```json
{
  "databaseUrl": "postgresql://username@servername:password@servername.postgres.database.azure.com:5432/dbname?sslmode=require",
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": false
  }
}
```

### Google Cloud SQL

```json
{
  "databaseUrl": "postgresql://username:password@127.0.0.1:5432/dbname",
  "ssl": {
    "enabled": true,
    "ca": "/path/to/server-ca.pem",
    "cert": "/path/to/client-cert.pem",
    "key": "/path/to/client-key.pem"
  }
}
```

### Heroku PostgreSQL

```json
{
  "databaseUrl": "postgresql://username:password@ec2-xx-xxx-xxx-xx.compute-1.amazonaws.com:5432/dbname",
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": false
  }
}
```

### Railway

```json
{
  "databaseUrl": "postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway",
  "ssl": {
    "enabled": true
  }
}
```

### PlanetScale (MySQL)

```json
{
  "databaseUrl": "mysql://username:password@aws.connect.psdb.cloud/dbname?ssl={\"rejectUnauthorized\":true}"
}
```

### Supabase

```json
{
  "databaseUrl": "postgresql://postgres.username:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  "ssl": {
    "enabled": true
  }
}
```

### Neon

```json
{
  "databaseUrl": "postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/dbname?sslmode=require"
}
```

## Security Best Practices

### 1. Never Commit Credentials

Add to `.gitignore`:
```
.prisma-mcp.json
.env
*.pem
*.key
*.cert
```

### 2. Use Environment Variables for Production

```bash
# Production deployment
export DATABASE_URL="${SECRET_DATABASE_URL}"
export PRISMA_SSL_CA="${SECRET_CA_CERT}"
```

### 3. Rotate Credentials Regularly

```json
{
  "databaseUrl": "${DATABASE_URL}",
  "_comment": "Rotate credentials monthly"
}
```

### 4. Use Read-Only Credentials When Possible

For read-only operations:
```json
{
  "connection": {
    "host": "read-replica.example.com",
    "user": "readonly_user",
    "password": "${READONLY_PASSWORD}"
  }
}
```

### 5. Validate SSL Certificates

Always use in production:
```json
{
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": true
  }
}
```

## Troubleshooting

### Connection Refused

**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
1. Check if database is running
2. Verify host and port
3. Check firewall rules

### Authentication Failed

**Error**: `password authentication failed for user "username"`

**Solutions**:
1. Verify username and password
2. Check user permissions
3. Ensure user exists in database

### SSL Connection Required

**Error**: `FATAL: SSL connection is required`

**Solutions**:
```json
{
  "databaseUrl": "postgresql://...?sslmode=require",
  "ssl": {
    "enabled": true
  }
}
```

### Certificate Verification Failed

**Error**: `self signed certificate in certificate chain`

**Solutions**:

For development only:
```json
{
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": false
  }
}
```

For production:
```json
{
  "ssl": {
    "enabled": true,
    "rejectUnauthorized": true,
    "ca": "/path/to/ca-cert.pem"
  }
}
```

### Connection Pool Exhausted

**Error**: `Too many connections`

**Solutions**:
```json
{
  "pool": {
    "max": 50,
    "min": 5,
    "idle": 10000
  }
}
```

### Wrong Database URL Format

**Error**: `Invalid connection string`

**Solutions**:
1. Check URL format matches provider
2. Ensure special characters are URL-encoded
3. Verify all required parameters are present

### Environment Variable Not Found

**Error**: `DATABASE_URL is not defined`

**Solutions**:
1. Check `.env` file is in project root
2. Verify environment variable names
3. Restart application after setting variables

## Advanced Configuration

### Multi-Database Setup

For projects with multiple databases:

```json
{
  "databaseUrl": "${PRIMARY_DATABASE_URL}",
  "databases": {
    "analytics": "${ANALYTICS_DATABASE_URL}",
    "cache": "${CACHE_DATABASE_URL}"
  }
}
```

### Read/Write Splitting

```json
{
  "databaseUrl": "${WRITE_DATABASE_URL}",
  "readUrl": "${READ_DATABASE_URL}",
  "pool": {
    "max": 20
  }
}
```

### Connection Timeout Settings

```json
{
  "databaseUrl": "postgresql://...?connect_timeout=30",
  "pool": {
    "acquire": 30000,
    "idle": 10000
  }
}
```

## Testing Your Configuration

1. **Validate connection on startup**: The server will log configuration details
2. **Test with db_pull**: Try `prisma db pull` to verify connection
3. **Check logs**: Look for connection success/failure messages
4. **Use test tool**: Run `prisma db execute --sql "SELECT 1"`

## Getting Help

If you encounter issues:

1. Check the logs for detailed error messages
2. Verify your database is accessible from your network
3. Consult your database provider's documentation
4. Check Prisma's connection URL documentation
5. File an issue with sanitized configuration details