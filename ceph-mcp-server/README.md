# Ceph MCP Server

An MCP (Model Context Protocol) server for interacting with Ceph distributed storage clusters. This server provides tools for managing pools, objects, OSDs, monitors, RBD images, CephFS, and RADOS Gateway (S3) operations.

## Features

- **Cluster Management**: Monitor health, status, and configuration
- **Pool Operations**: Create, list, delete pools and get statistics
- **Object Storage**: List and delete objects in pools
- **OSD Management**: View OSD tree, statistics, and topology
- **Monitor Operations**: Check monitor status and list monitors
- **Placement Groups**: View PG statistics and listings
- **RBD (Block Storage)**: Manage RADOS Block Device images
- **CephFS**: Monitor metadata servers and filesystems
- **RADOS Gateway**: Manage S3 users and buckets

## Installation

```bash
cd ceph-mcp-server
npm install
npm run build
```

## Multiple Instance Support

The Ceph MCP server supports running multiple instances with different configurations by using the `MCP_SERVER_NAME` environment variable. This enables you to manage multiple Ceph clusters or use different configurations for different storage environments.

### Instance-Specific Configuration

When `MCP_SERVER_NAME` is set, the server will look for a configuration file named `.{MCP_SERVER_NAME}-ceph-mcp.json` instead of the default `.ceph-mcp.json`.

**Example: Multiple Ceph Clusters**
```bash
# Production Ceph cluster
export MCP_SERVER_NAME=prod
# Uses: .prod-ceph-mcp.json

# Development Ceph cluster
export MCP_SERVER_NAME=dev
# Uses: .dev-ceph-mcp.json

# Testing cluster
export MCP_SERVER_NAME=test
# Uses: .test-ceph-mcp.json
```

### Configuration File Resolution

The server resolves configuration in this order:
1. **Instance-specific config**: `.{MCP_SERVER_NAME}-ceph-mcp.json` (if MCP_SERVER_NAME is set)
2. **Default config file**: `.ceph-mcp.json` in current directory
3. **Global config file**: `~/.ceph-mcp.json`
4. **Environment variables**
5. **Default values**

### Benefits of Multiple Instances

- **Multi-cluster**: Manage production, development, and testing Ceph clusters
- **Environment isolation**: Separate configurations for different storage environments
- **Tenant isolation**: Different storage configurations for different teams or clients
- **Geographic distribution**: Different Ceph clusters in different data centers
- **Claude Code**: Perfect for managing multiple distributed storage environments

### Example: Multiple Ceph Clusters

**.prod-ceph-mcp.json** (Production):
```json
{
  "cluster_name": "prod-ceph",
  "monitor_hosts": ["prod-mon1.example.com", "prod-mon2.example.com", "prod-mon3.example.com"],
  "username": "client.prod",
  "keyring_path": "/etc/ceph/prod.client.keyring",
  "api_url": "https://prod-ceph-api.example.com",
  "timeout": 30000,
  "enable_s3": true,
  "enable_rbd": true,
  "enable_cephfs": true
}
```

**.dev-ceph-mcp.json** (Development):
```json
{
  "cluster_name": "dev-ceph",
  "monitor_hosts": ["dev-mon1.example.com"],
  "username": "client.dev",
  "keyring_path": "/etc/ceph/dev.client.keyring",
  "timeout": 60000,
  "enable_s3": false,
  "enable_rbd": true,
  "enable_cephfs": false
}
```

**.test-ceph-mcp.json** (Testing):
```json
{
  "cluster_name": "test-ceph",
  "monitor_hosts": ["localhost:6789"],
  "username": "client.admin",
  "keyring_path": "/etc/ceph/test.client.admin.keyring",
  "timeout": 120000
}
```

### Claude Code Usage

With Claude Code, you can easily switch between Ceph clusters:

```bash
# Work with production cluster
MCP_SERVER_NAME=prod claude-code "Check Ceph cluster health and status"

# Work with development cluster
MCP_SERVER_NAME=dev claude-code "Create test pool and upload objects"

# Work with testing cluster
MCP_SERVER_NAME=test claude-code "Run performance tests on RBD volumes"

# Default cluster
claude-code "List all storage pools and their utilization"
```

### Claude Desktop Integration

For Claude Desktop, configure multiple Ceph servers:

```json
{
  "mcpServers": {
    "ceph-prod": {
      "command": "node",
      "args": ["/path/to/ceph-mcp-server/dist/mcp-server.js"],
      "env": {
        "MCP_SERVER_NAME": "prod"
      }
    },
    "ceph-dev": {
      "command": "node",
      "args": ["/path/to/ceph-mcp-server/dist/mcp-server.js"],
      "env": {
        "MCP_SERVER_NAME": "dev"
      }
    },
    "ceph-test": {
      "command": "node",
      "args": ["/path/to/ceph-mcp-server/dist/mcp-server.js"],
      "env": {
        "MCP_SERVER_NAME": "test"
      }
    },
    "ceph": {
      "command": "node",
      "args": ["/path/to/ceph-mcp-server/dist/mcp-server.js"]
    }
  }
}
```

## Configuration

The server can be configured through multiple methods (in order of precedence):

### Environment Variables

- `CEPH_CLUSTER_NAME`: Ceph cluster name (default: "ceph")
- `CEPH_MONITOR_HOSTS`: Comma-separated list of monitor hosts
- `CEPH_USERNAME`: Ceph username for authentication
- `CEPH_KEYRING_PATH`: Path to Ceph keyring file
- `CEPH_API_URL`: URL for Ceph REST API (if available)
- `CEPH_API_USERNAME`: REST API username
- `CEPH_API_PASSWORD`: REST API password
- `CEPH_API_KEY`: REST API key/token
- `CEPH_POOL_NAME`: Default pool name
- `CEPH_TIMEOUT`: Operation timeout in milliseconds (default: 30000)

### Configuration File Format

Create `.ceph-mcp.json` in your project directory or home directory:

```json
{
  "cluster_name": "ceph",
  "monitor_hosts": ["mon1.example.com", "mon2.example.com"],
  "username": "client.admin",
  "keyring_path": "/etc/ceph/ceph.client.admin.keyring",
  "api_url": "https://ceph-api.example.com",
  "api_username": "admin",
  "api_password": "secret",
  "pool_name": "mypool",
  "timeout": 30000,
  "enable_s3": true,
  "enable_rbd": true,
  "enable_cephfs": true
}
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ceph": {
      "command": "node",
      "args": ["/path/to/ceph-mcp-server/dist/mcp-server.js"],
      "env": {
        "CEPH_MONITOR_HOSTS": "mon1.example.com,mon2.example.com",
        "CEPH_USERNAME": "client.admin",
        "CEPH_KEYRING_PATH": "/etc/ceph/ceph.client.admin.keyring"
      }
    }
  }
}
```

## Requirements

- Node.js 18 or higher
- Ceph CLI tools installed (`ceph`, `rados`, `rbd`, `radosgw-admin`)
- Proper Ceph credentials and network access to the cluster
- For REST API mode: Access to Ceph Manager REST API

## Security Considerations

- Store sensitive credentials in environment variables or secure config files
- Use appropriate Ceph user permissions (principle of least privilege)
- The `delete_pool` operation requires confirmation flags for safety
- Consider using read-only users for monitoring operations

## Tool Categories

### Cluster Operations
- `get_cluster_status`: Overall cluster status
- `get_cluster_health`: Health status and alerts
- `get_config`: View configuration parameters
- `set_config`: Modify configuration parameters

### Pool Management
- `list_pools`: List all pools with details
- `create_pool`: Create new storage pool
- `delete_pool`: Remove pool (destructive)
- `get_pool_stats`: Pool usage statistics

### Object Operations
- `list_objects`: List objects in a pool
- `delete_object`: Remove specific object

### OSD Operations
- `list_osds`: List all OSDs
- `get_osd_tree`: View cluster topology
- `get_osd_stats`: OSD usage statistics

### RBD (Block Device) Operations
- `list_rbd_images`: List block device images
- `create_rbd_image`: Create new RBD image
- `delete_rbd_image`: Remove RBD image
- `get_rbd_image_info`: Image details

### RADOS Gateway (S3) Operations
- `list_rgw_users`: List S3 users
- `create_rgw_user`: Create S3 user
- `get_rgw_user_info`: User details
- `delete_rgw_user`: Remove S3 user
- `list_rgw_buckets`: List all buckets
- `get_rgw_bucket_stats`: Bucket statistics

## Limitations

- Object upload/download operations require librados integration (not implemented in CLI mode)
- Some operations require appropriate Ceph admin privileges
- REST API mode requires Ceph Manager with RESTful module enabled

## License

MIT

Last Updated On: June 14, 2025