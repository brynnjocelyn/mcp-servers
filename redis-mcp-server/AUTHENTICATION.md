# Redis MCP Server Authentication Guide

This guide covers all authentication and connection methods supported by the Redis MCP server.

## Table of Contents
- [Configuration Hierarchy](#configuration-hierarchy)
- [Connection Methods](#connection-methods)
- [Authentication Types](#authentication-types)
- [Advanced Configurations](#advanced-configurations)
- [Cloud Provider Examples](#cloud-provider-examples)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Configuration Hierarchy

The Redis MCP server looks for configuration in the following order (first found wins):

1. **Local Configuration File** (`.redis-mcp.json`)
   - Project-specific configuration
   - Place in your project root directory
   - Highest priority

2. **Redis URL Environment Variables**
   - `REDIS_URL` or `REDIS_TLS_URL`
   - Common in cloud deployments
   - Medium-high priority

3. **Individual Environment Variables**
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, etc.
   - Good for containerized deployments
   - Medium priority

4. **Default Values**
   - Built-in defaults for local development
   - Lowest priority

## Configuration File Examples

The `.redis-mcp.json` file provides the most flexible way to configure your Redis connection. Place this file in your project root directory.

### Basic Local Redis
```json
{
  "host": "localhost",
  "port": 6379,
  "db": 0
}
```

### Redis with Password
```json
{
  "host": "localhost",
  "port": 6379,
  "password": "your-redis-password",
  "db": 0,
  "connectionName": "myapp-dev"
}
```

### Redis with ACL (Redis 6+)
```json
{
  "host": "localhost",
  "port": 6379,
  "username": "app_user",
  "password": "secure_password",
  "db": 0,
  "keyPrefix": "myapp:"
}
```

### Redis with TLS/SSL
```json
{
  "host": "secure-redis.example.com",
  "port": 6380,
  "password": "password",
  "tls": {
    "rejectUnauthorized": true,
    "ca": "/path/to/ca-cert.pem",
    "cert": "/path/to/client-cert.pem",
    "key": "/path/to/client-key.pem"
  }
}
```

### Redis Sentinel (High Availability)
```json
{
  "sentinels": [
    { "host": "sentinel1.example.com", "port": 26379 },
    { "host": "sentinel2.example.com", "port": 26379 },
    { "host": "sentinel3.example.com", "port": 26379 }
  ],
  "sentinelName": "mymaster",
  "password": "redis-password",
  "sentinelPassword": "sentinel-password",
  "db": 0,
  "keyPrefix": "app:"
}
```

### Redis Cluster
```json
{
  "cluster": true,
  "clusterNodes": [
    { "host": "node1.cluster.local", "port": 7000 },
    { "host": "node2.cluster.local", "port": 7001 },
    { "host": "node3.cluster.local", "port": 7002 }
  ],
  "password": "cluster-password",
  "keyPrefix": "myapp:"
}
```

### Development with Docker
```json
{
  "host": "localhost",
  "port": 6379,
  "db": 0,
  "keyPrefix": "dev:",
  "connectionName": "local-development"
}
```

### Production with All Options
```json
{
  "host": "redis.example.com",
  "port": 6379,
  "password": "password",
  "username": "app_user",
  "db": 0,
  "family": 4,
  "connectTimeout": 20000,
  "commandTimeout": 20000,
  "keepAlive": 30000,
  "noDelay": true,
  "connectionName": "my-app-production",
  "keyPrefix": "prod:",
  "maxRetriesPerRequest": 3,
  "enableReadyCheck": true,
  "enableOfflineQueue": true,
  "lazyConnect": false,
  "tls": {
    "rejectUnauthorized": true,
    "ca": "/path/to/ca.crt"
  }
}
```

## Connection Methods

### 1. Basic Connection

The simplest connection method for local Redis:

**Configuration File:**
```json
{
  "host": "localhost",
  "port": 6379,
  "db": 0
}
```

**Environment Variables:**
```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_DB=0
```

### 2. Password Authentication

For Redis instances with password protection:

**Configuration File:**
```json
{
  "host": "localhost",
  "port": 6379,
  "password": "your-redis-password",
  "db": 0
}
```

**Environment Variables:**
```bash
export REDIS_PASSWORD=your-redis-password
```

**Redis URL:**
```bash
export REDIS_URL="redis://:password@localhost:6379/0"
```

### 3. ACL Authentication (Redis 6+)

For Redis 6+ with Access Control Lists:

**Configuration File:**
```json
{
  "host": "localhost",
  "port": 6379,
  "username": "myuser",
  "password": "mypassword",
  "db": 0
}
```

**Redis URL:**
```bash
export REDIS_URL="redis://myuser:mypassword@localhost:6379/0"
```

### 4. TLS/SSL Connection

For encrypted connections:

**Basic TLS:**
```json
{
  "host": "secure-redis.example.com",
  "port": 6380,
  "password": "password",
  "tls": {
    "rejectUnauthorized": true
  }
}
```

**TLS with Certificates:**
```json
{
  "host": "secure-redis.example.com",
  "port": 6380,
  "tls": {
    "rejectUnauthorized": true,
    "ca": "/path/to/ca-cert.pem",
    "cert": "/path/to/client-cert.pem",
    "key": "/path/to/client-key.pem"
  }
}
```

**TLS URL:**
```bash
export REDIS_TLS_URL="rediss://user:password@secure-redis.example.com:6380/0"
```

## Authentication Types

### 1. No Authentication (Development)
Default for local development:
```json
{
  "host": "localhost",
  "port": 6379
}
```

### 2. Password Only (Legacy)
For Redis < 6.0:
```json
{
  "password": "your-password"
}
```

### 3. Username + Password (Redis 6+)
Modern authentication with ACLs:
```json
{
  "username": "app_user",
  "password": "secure_password"
}
```

### 4. Client Certificate Authentication
Mutual TLS authentication:
```json
{
  "tls": {
    "cert": "/path/to/client.crt",
    "key": "/path/to/client.key",
    "ca": "/path/to/ca.crt",
    "rejectUnauthorized": true
  }
}
```

## Advanced Configurations

### Redis Sentinel (High Availability)

For automatic failover and high availability:

```json
{
  "sentinels": [
    { "host": "sentinel1.example.com", "port": 26379 },
    { "host": "sentinel2.example.com", "port": 26379 },
    { "host": "sentinel3.example.com", "port": 26379 }
  ],
  "sentinelName": "mymaster",
  "password": "redis-password",
  "sentinelPassword": "sentinel-password",
  "db": 0
}
```

**Environment Variables:**
```bash
export REDIS_SENTINELS='[{"host":"sentinel1","port":26379},{"host":"sentinel2","port":26379}]'
export REDIS_SENTINEL_NAME=mymaster
export REDIS_SENTINEL_PASSWORD=sentinel-password
export REDIS_PASSWORD=redis-password
```

### Redis Cluster

For horizontally scaled Redis deployments:

```json
{
  "cluster": true,
  "clusterNodes": [
    { "host": "node1.cluster.local", "port": 7000 },
    { "host": "node2.cluster.local", "port": 7001 },
    { "host": "node3.cluster.local", "port": 7002 }
  ],
  "password": "cluster-password"
}
```

**Environment Variables:**
```bash
export REDIS_CLUSTER=true
export REDIS_CLUSTER_NODES='[{"host":"node1","port":7000},{"host":"node2","port":7001}]'
```

### Connection Pool Configuration

Optimize performance with connection pooling:

```json
{
  "host": "localhost",
  "port": 6379,
  "maxRetriesPerRequest": 3,
  "enableReadyCheck": true,
  "enableOfflineQueue": true,
  "connectTimeout": 20000,
  "commandTimeout": 20000,
  "keepAlive": 30000,
  "noDelay": true,
  "connectionName": "redis-mcp-server"
}
```

### Key Prefix Configuration

Namespace all keys with a prefix:

```json
{
  "host": "localhost",
  "port": 6379,
  "keyPrefix": "myapp:"
}
```

## Cloud Provider Examples

### AWS ElastiCache

**Standard Mode:**
```json
{
  "host": "my-redis-cluster.abc123.ng.0001.use1.cache.amazonaws.com",
  "port": 6379,
  "password": "auth-token"
}
```

**Cluster Mode:**
```json
{
  "cluster": true,
  "clusterNodes": [
    { 
      "host": "my-redis-cluster.abc123.ng.0001.use1.cache.amazonaws.com", 
      "port": 6379 
    }
  ],
  "password": "auth-token"
}
```

**With TLS:**
```json
{
  "host": "my-redis-cluster.abc123.ng.0001.use1.cache.amazonaws.com",
  "port": 6379,
  "password": "auth-token",
  "tls": {
    "rejectUnauthorized": true
  }
}
```

### Azure Cache for Redis

**Basic Tier:**
```json
{
  "host": "myredis.redis.cache.windows.net",
  "port": 6380,
  "password": "primary-access-key",
  "tls": {
    "rejectUnauthorized": true
  }
}
```

**Premium Tier with Clustering:**
```json
{
  "cluster": true,
  "clusterNodes": [
    { "host": "myredis.redis.cache.windows.net", "port": 6380 }
  ],
  "password": "primary-access-key",
  "tls": {
    "rejectUnauthorized": true
  }
}
```

### Google Cloud Memorystore

**Basic Instance:**
```json
{
  "host": "10.0.0.3",
  "port": 6379,
  "password": "instance-auth-string"
}
```

**High Availability Instance:**
```json
{
  "host": "10.0.0.3",
  "port": 6379,
  "password": "instance-auth-string",
  "enableOfflineQueue": true,
  "maxRetriesPerRequest": 5
}
```

### Heroku Redis

**Using Redis URL:**
```bash
# Heroku automatically provides REDIS_URL
export REDIS_URL=$REDIS_URL
```

**Manual Configuration:**
```json
{
  "host": "ec2-xx-xx-xxx-xx.compute-1.amazonaws.com",
  "port": 5432,
  "password": "password",
  "tls": {
    "rejectUnauthorized": false
  }
}
```

### Redis Cloud (Redis Labs)

```json
{
  "host": "redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com",
  "port": 12345,
  "password": "database-password",
  "tls": {
    "rejectUnauthorized": true
  }
}
```

### DigitalOcean Managed Redis

```json
{
  "host": "db-redis-nyc1-12345-do-user-123456-0.a.db.ondigitalocean.com",
  "port": 25061,
  "password": "password",
  "tls": {
    "rejectUnauthorized": true
  }
}
```

## Connection Options Reference

### Basic Options
- `host` (string): Redis server hostname
- `port` (number): Redis server port
- `password` (string): Authentication password
- `username` (string): Username for Redis 6+ ACL
- `db` (number): Database number (0-15)
- `family` (4|6): IP version preference

### Timeout Options
- `connectTimeout` (ms): Connection timeout
- `commandTimeout` (ms): Command execution timeout
- `keepAlive` (ms): TCP keep-alive interval

### Performance Options
- `enableReadyCheck` (boolean): Check if Redis is ready
- `enableOfflineQueue` (boolean): Queue commands when offline
- `lazyConnect` (boolean): Delay connection until first command
- `maxRetriesPerRequest` (number): Retry failed commands

### TLS Options
- `tls.rejectUnauthorized` (boolean): Verify server certificate
- `tls.ca` (string): CA certificate path or content
- `tls.cert` (string): Client certificate path or content
- `tls.key` (string): Client key path or content

## Security Best Practices

### 1. Use Strong Authentication
```bash
# Generate strong password
openssl rand -base64 32

# Set ACL for specific user
ACL SETUSER app_user on +@read +@write ~app:* &* >strong_password
```

### 2. Enable TLS in Production
Always use TLS for remote connections:
```json
{
  "tls": {
    "rejectUnauthorized": true,
    "minVersion": "TLSv1.2"
  }
}
```

### 3. Limit Network Access
- Use private networks when possible
- Configure Redis bind address
- Use firewall rules

### 4. Use Key Namespaces
```json
{
  "keyPrefix": "myapp:prod:"
}
```

### 5. Rotate Credentials
- Change passwords regularly
- Use different credentials per environment
- Monitor access logs

## Troubleshooting

### Connection Refused
```bash
# Check if Redis is running
redis-cli ping

# Check bind address in redis.conf
grep "^bind" /etc/redis/redis.conf

# Check firewall
sudo ufw status
```

### Authentication Failed
```bash
# Test with redis-cli
redis-cli -h host -p port -a password ping

# Check ACL users (Redis 6+)
redis-cli ACL LIST
```

### TLS Connection Issues
```bash
# Test with openssl
openssl s_client -connect redis.example.com:6380

# Verify certificate
openssl x509 -in cert.pem -text -noout
```

### Timeout Issues
```json
{
  "connectTimeout": 30000,
  "commandTimeout": 30000,
  "maxRetriesPerRequest": 5
}
```

### Cluster Connection Issues
```bash
# Check cluster nodes
redis-cli -c cluster nodes

# Check cluster health
redis-cli -c cluster info
```

## Testing Your Connection

Use the `ping` tool to verify your configuration:

```json
{
  "tool": "ping",
  "arguments": {
    "message": "test"
  }
}
```

Expected response:
```json
{
  "response": "test"
}
```

For detailed server information:
```json
{
  "tool": "info",
  "arguments": {
    "section": "server"
  }
}
```