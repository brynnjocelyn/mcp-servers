# Redis MCP Server Configuration Examples

This document provides configuration examples for the Redis MCP Server.

## Configuration Methods

The Redis MCP Server can be configured in three ways (in order of precedence):

1. **Local configuration file** (`.redis-mcp.json`)
2. **Environment variables** (including Redis URLs)
3. **Default values**

## Configuration File Examples

### Basic Configuration (.redis-mcp.json)

Create a `.redis-mcp.json` file in your project directory:

```json
{
  "host": "localhost",
  "port": 6379,
  "password": "your_password",
  "db": 0
}
```

### Production Configuration with Authentication

```json
{
  "host": "redis.example.com",
  "port": 6379,
  "username": "myapp",
  "password": "secure_password",
  "db": 0,
  "connectionName": "myapp-mcp",
  "commandTimeout": 30000,
  "enableReadyCheck": true,
  "maxRetriesPerRequest": 3
}
```

### TLS/SSL Configuration

```json
{
  "host": "secure-redis.example.com",
  "port": 6380,
  "password": "secure_password",
  "tls": {
    "rejectUnauthorized": true,
    "ca": "/path/to/ca-cert.pem",
    "cert": "/path/to/client-cert.pem",
    "key": "/path/to/client-key.pem"
  }
}
```

### Redis Sentinel Configuration

```json
{
  "sentinels": [
    { "host": "sentinel1.example.com", "port": 26379 },
    { "host": "sentinel2.example.com", "port": 26379 },
    { "host": "sentinel3.example.com", "port": 26379 }
  ],
  "sentinelName": "mymaster",
  "sentinelPassword": "sentinel_password",
  "password": "redis_password",
  "db": 0
}
```

### Redis Cluster Configuration

```json
{
  "cluster": true,
  "clusterNodes": [
    { "host": "node1.example.com", "port": 6379 },
    { "host": "node2.example.com", "port": 6379 },
    { "host": "node3.example.com", "port": 6379 }
  ],
  "password": "cluster_password",
  "enableReadyCheck": true
}
```

### Development Configuration

```json
{
  "host": "localhost",
  "port": 6379,
  "db": 1,
  "keyPrefix": "dev:",
  "lazyConnect": false,
  "enableOfflineQueue": true
}
```

### Cloud Redis Configuration (e.g., Redis Cloud, AWS ElastiCache)

```json
{
  "host": "redis-12345.c123.us-east-1-2.ec2.cloud.redislabs.com",
  "port": 16379,
  "password": "cloud_password",
  "tls": {
    "rejectUnauthorized": true
  },
  "connectTimeout": 20000,
  "commandTimeout": 20000,
  "maxRetriesPerRequest": 3
}
```

## Environment Variables

### Using Individual Environment Variables

```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=your_password
export REDIS_USERNAME=your_username
export REDIS_DB=0
```

### Using Redis URL

```bash
# Standard Redis URL
export REDIS_URL=redis://username:password@localhost:6379/0

# Redis URL with TLS
export REDIS_TLS_URL=rediss://username:password@secure-redis.example.com:6380/0
```

## Claude Desktop Configuration

### Using Configuration File

```json
{
  "mcpServers": {
    "redis": {
      "command": "/path/to/redis-mcp-server/dist/mcp-server.js",
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
    "redis": {
      "command": "/path/to/redis-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "REDIS_HOST": "localhost",
        "REDIS_PORT": "6379",
        "REDIS_PASSWORD": "your_password"
      }
    }
  }
}
```

### Using Redis URL

```json
{
  "mcpServers": {
    "redis": {
      "command": "/path/to/redis-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "REDIS_URL": "redis://username:password@localhost:6379/0"
      }
    }
  }
}
```

## Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | string | `localhost` | Redis server hostname |
| `port` | number | `6379` | Redis server port |
| `password` | string | undefined | Redis password |
| `username` | string | undefined | Redis username (Redis 6.0+) |
| `db` | number | `0` | Database index to use |
| `family` | 4 or 6 | `4` | IP version to use |
| `connectTimeout` | number | `20000` | Connection timeout in milliseconds |
| `commandTimeout` | number | `20000` | Command timeout in milliseconds |
| `keepAlive` | number | `30000` | TCP KeepAlive in milliseconds |
| `noDelay` | boolean | `true` | Enable/disable Nagle's algorithm |
| `connectionName` | string | `redis-mcp-server` | Connection name for CLIENT LIST |
| `keyPrefix` | string | undefined | Prefix for all keys |
| `lazyConnect` | boolean | `false` | Delay connection until first command |
| `enableReadyCheck` | boolean | `true` | Check if Redis is ready after connecting |
| `enableOfflineQueue` | boolean | `true` | Queue commands when disconnected |
| `maxRetriesPerRequest` | number | `3` | Max retries for each command |

## TLS Configuration Options

When `tls` is an object, you can specify:

| Option | Type | Description |
|--------|------|-------------|
| `rejectUnauthorized` | boolean | Whether to verify the server certificate |
| `ca` | string | Path to CA certificate file |
| `cert` | string | Path to client certificate file |
| `key` | string | Path to client key file |
| `checkServerIdentity` | boolean | Whether to check server identity |

## Sentinel Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `sentinels` | array | Array of sentinel nodes |
| `sentinelName` | string | Name of the master to connect to |
| `sentinelPassword` | string | Password for sentinel authentication |

## Cluster Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `cluster` | boolean | Enable cluster mode |
| `clusterNodes` | array | Array of cluster nodes |

## Troubleshooting

### Connection Refused
- Ensure Redis is running
- Check if the host and port are correct
- Verify firewall rules allow the connection

### Authentication Failed
- Verify password is correct
- Check if Redis requires authentication (requirepass)
- For Redis 6.0+, check if username is needed

### Connection Timeout
- Increase `connectTimeout` and `commandTimeout`
- Check network connectivity
- Verify Redis server is accessible

### TLS/SSL Issues
- Ensure TLS is enabled on Redis server
- Verify certificate paths are correct
- Try `"rejectUnauthorized": false` for self-signed certificates

### Sentinel Connection Issues
- Verify all sentinel nodes are accessible
- Check sentinel configuration matches
- Ensure master name is correct

### Cluster Connection Issues
- Verify cluster mode is enabled
- Check if all cluster nodes are accessible
- Ensure cluster is properly configured

Last Updated On: 6/5/2025