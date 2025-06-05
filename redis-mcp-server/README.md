# Redis MCP Server

A comprehensive Model Context Protocol (MCP) server that provides tools for managing Redis databases. This server enables LLMs to interact with Redis through a standardized protocol, supporting all major Redis data types and operations.

## Overview

This MCP server exposes Redis functionality as tools that can be used by any MCP-compatible client (like Claude Desktop, Cursor, or other LLM applications). It provides comprehensive access to Redis features with 70+ tools covering all data types: strings, lists, hashes, sets, sorted sets, streams, geo, HyperLogLog, and more.

## Quick Start

1. Install dependencies: `npm install`
2. Build the server: `npm run build`
3. Configure your Redis connection (see [Authentication Guide](./AUTHENTICATION.md))
4. Add to your MCP client configuration

## Documentation

- **[Authentication Guide](./AUTHENTICATION.md)** - Comprehensive guide to all connection methods
- **[Tools Reference](./TOOLS.md)** - Detailed documentation for all 70+ available tools
- **[Configuration Examples](./CONFIG_EXAMPLES.md)** - Complete configuration examples and troubleshooting

## Features

### Data Type Support
- **Strings** - Basic key-value operations with expiration
- **Lists** - Ordered collections with push/pop operations
- **Hashes** - Field-value pairs within a single key
- **Sets** - Unordered unique value collections
- **Sorted Sets** - Score-based ordered collections
- **Streams** - Append-only log data structure
- **Geo** - Geospatial data with radius queries
- **HyperLogLog** - Probabilistic cardinality estimation
- **Bitmaps** - Bit-level operations
- **Pub/Sub** - Message publishing and subscription

### Advanced Features
- **Transactions** - Atomic command execution
- **Lua Scripting** - Server-side script execution
- **Pipelining** - Batch command optimization
- **Key Management** - Pattern matching, TTL, type checking
- **Server Management** - Configuration, stats, monitoring

## Installation

```bash
npm install
npm run build
```

## Authentication & Configuration

The Redis MCP server supports multiple connection methods and configurations:

### Quick Configuration

**Option 1: Environment Variables**
```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=mypassword
export REDIS_DB=0
```

**Option 2: Configuration File** (`.redis-mcp.json`)
```json
{
  "host": "localhost",
  "port": 6379,
  "password": "mypassword",
  "db": 0
}
```

See the [Authentication Guide](./AUTHENTICATION.md#configuration-file-examples) for many more configuration examples including:
- Redis with ACL (Redis 6+)
- TLS/SSL connections
- Redis Sentinel for high availability
- Redis Cluster configuration
- Cloud provider specific configs
- Production-ready configurations

**Option 3: Redis URL**
```bash
export REDIS_URL="redis://user:password@localhost:6379/0"
# or for TLS
export REDIS_TLS_URL="rediss://user:password@localhost:6379/0"
```

### Advanced Configurations

**TLS/SSL Connection**
```json
{
  "host": "redis.example.com",
  "port": 6380,
  "tls": {
    "rejectUnauthorized": true,
    "ca": "/path/to/ca.crt",
    "cert": "/path/to/client.crt",
    "key": "/path/to/client.key"
  }
}
```

**Redis Sentinel (High Availability)**
```json
{
  "sentinels": [
    { "host": "sentinel1", "port": 26379 },
    { "host": "sentinel2", "port": 26379 }
  ],
  "sentinelName": "mymaster",
  "password": "redis-password",
  "sentinelPassword": "sentinel-password"
}
```

**Redis Cluster**
```json
{
  "cluster": true,
  "clusterNodes": [
    { "host": "node1", "port": 7000 },
    { "host": "node2", "port": 7001 },
    { "host": "node3", "port": 7002 }
  ]
}
```

For detailed authentication options including cloud-specific configurations (AWS ElastiCache, Azure Cache, Google Memorystore), see the **[Authentication Guide](./AUTHENTICATION.md)**.

For more configuration examples and troubleshooting tips, see the **[Configuration Examples](./CONFIG_EXAMPLES.md)**.

## Usage with Claude Desktop

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "redis": {
      "command": "node",
      "args": ["/path/to/redis-mcp-server/dist/mcp-server.js"],
      "env": {
        "REDIS_HOST": "localhost",
        "REDIS_PORT": "6379",
        "REDIS_PASSWORD": "mypassword"
      }
    }
  }
}
```

## Available Tools

The server provides 70+ tools organized by Redis data types and functionality:

### Key Operations
- `keys` - Find keys matching a pattern
- `exists` - Check if keys exist
- `del` - Delete keys
- `expire` - Set key expiration
- `ttl` - Get time to live
- `type` - Get key type
- `rename` - Rename keys

### String Operations
- `get`, `set` - Basic get/set with expiration options
- `mget`, `mset` - Multiple key operations
- `incr`, `decr` - Atomic increment/decrement
- `append` - Append to string value
- `getrange`, `setrange` - Substring operations

### List Operations
- `lpush`, `rpush` - Push to left/right
- `lpop`, `rpop` - Pop from left/right
- `lrange` - Get range of elements
- `llen` - Get list length
- `lindex`, `lset` - Get/set by index
- `lrem` - Remove elements

### Hash Operations
- `hget`, `hset` - Get/set hash fields
- `hmget`, `hgetall` - Get multiple/all fields
- `hdel` - Delete fields
- `hkeys`, `hvals` - Get all keys/values
- `hexists` - Check field existence
- `hincrby` - Increment field value

### Set Operations
- `sadd`, `srem` - Add/remove members
- `smembers` - Get all members
- `sismember` - Check membership
- `scard` - Get cardinality
- `sunion`, `sinter`, `sdiff` - Set operations
- `spop`, `srandmember` - Random member operations

### Sorted Set Operations
- `zadd`, `zrem` - Add/remove with scores
- `zrange`, `zrevrange` - Get by rank
- `zrangebyscore` - Get by score range
- `zscore`, `zrank` - Get score/rank
- `zcard` - Get cardinality
- `zincrby` - Increment score

### Advanced Operations
- `multi_exec` - Transaction execution
- `eval` - Lua script execution
- `publish` - Pub/Sub publishing
- `geoadd`, `georadius` - Geospatial operations
- `xadd`, `xread` - Stream operations
- `pfadd`, `pfcount` - HyperLogLog operations
- `scan` - Incremental key iteration

For detailed documentation of each tool including parameters and examples, see the **[Tools Reference](./TOOLS.md)**.

## Tool Examples

### Basic String Operations
```json
{
  "tool": "set",
  "arguments": {
    "key": "user:123",
    "value": { "name": "John", "email": "john@example.com" },
    "ex": 3600
  }
}
```

### List Operations
```json
{
  "tool": "lpush",
  "arguments": {
    "key": "queue:tasks",
    "values": ["task1", "task2", "task3"]
  }
}
```

### Hash Operations
```json
{
  "tool": "hset",
  "arguments": {
    "key": "user:123",
    "fields": {
      "name": "John Doe",
      "email": "john@example.com",
      "last_login": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Sorted Set with Scores
```json
{
  "tool": "zadd",
  "arguments": {
    "key": "leaderboard",
    "members": [
      { "score": 100, "member": "player1" },
      { "score": 95, "member": "player2" },
      { "score": 90, "member": "player3" }
    ]
  }
}
```

### Transaction Example
```json
{
  "tool": "multi_exec",
  "arguments": {
    "commands": [
      { "command": "incr", "args": ["counter"] },
      { "command": "lpush", "args": ["events", "increment"] },
      { "command": "expire", "args": ["counter", 3600] }
    ]
  }
}
```

### Geospatial Query
```json
{
  "tool": "georadius",
  "arguments": {
    "key": "locations",
    "longitude": -122.4194,
    "latitude": 37.7749,
    "radius": 10,
    "unit": "km",
    "withCoord": true,
    "withDist": true,
    "count": 5
  }
}
```

## Performance Optimization

### Connection Pooling
Configure connection pool settings:
```json
{
  "maxRetriesPerRequest": 3,
  "enableReadyCheck": true,
  "enableOfflineQueue": true,
  "connectTimeout": 20000,
  "commandTimeout": 20000
}
```

### Best Practices
- Use pipelining for bulk operations
- Implement proper key naming conventions
- Set appropriate TTLs to manage memory
- Use SCAN instead of KEYS for production
- Monitor slow queries with SLOWLOG

## Security Best Practices

### 1. Authentication
- Always use strong passwords
- Enable ACL (Access Control Lists) in Redis 6+
- Use different users for different applications

### 2. Network Security
- Use TLS/SSL for encrypted connections
- Implement firewall rules
- Use VPN or SSH tunnels for remote access

### 3. Key Management
- Use key prefixes to organize data
- Implement key expiration policies
- Regular cleanup of unused keys

### 4. Access Control
```bash
# Create a limited user
ACL SETUSER app_user on +get +set +del ~app:* &* >password
```

## Error Handling

All tools include comprehensive error handling:
- Connection errors with retry logic
- Command syntax validation
- Type checking for parameters
- Graceful handling of missing keys
- Transaction rollback on errors

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Testing Connection
Use the `ping` tool to test your connection:
```json
{
  "tool": "ping",
  "arguments": {}
}
```

## Monitoring

### Server Information
```json
{
  "tool": "info",
  "arguments": {
    "section": "server"
  }
}
```

### Database Size
```json
{
  "tool": "dbsize",
  "arguments": {}
}
```

### Configuration
```json
{
  "tool": "config_get",
  "arguments": {
    "parameter": "*max*"
  }
}
```

## License

ISC