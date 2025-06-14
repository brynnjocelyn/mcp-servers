# Ceph MCP Server Configuration Examples

This document provides configuration examples for various Ceph deployment scenarios.

## Multiple Instance Support

The Ceph MCP server supports running multiple instances with different configurations by using the `MCP_SERVER_NAME` environment variable. This enables you to manage multiple Ceph clusters or use different configurations for different storage environments.

### Instance-Specific Configuration

When `MCP_SERVER_NAME` is set, the server will look for a configuration file named `.{MCP_SERVER_NAME}-ceph-mcp.json` instead of the default `.ceph-mcp.json`.

**Example: Multiple Ceph Clusters**
```bash
# Production cluster
export MCP_SERVER_NAME=prod
# Uses: .prod-ceph-mcp.json

# Development cluster
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
- **Environment isolation**: Separate configurations for different storage requirements
- **Tenant management**: Different storage configurations for different teams or clients
- **Geographic distribution**: Different Ceph clusters in different locations
- **Claude Code**: Perfect for managing multiple distributed storage environments

## Instance-Specific Configuration Examples

**.prod-ceph-mcp.json** (Production Cluster):
```json
{
  "cluster_name": "prod-ceph",
  "monitor_hosts": [
    "prod-mon1.example.com:6789",
    "prod-mon2.example.com:6789",
    "prod-mon3.example.com:6789"
  ],
  "username": "client.prod",
  "keyring_path": "/etc/ceph/prod.client.keyring",
  "api_url": "https://prod-ceph-mgr.example.com:8003",
  "api_username": "admin",
  "timeout": 30000,
  "enable_s3": true,
  "enable_rbd": true,
  "enable_cephfs": true
}
```

**.dev-ceph-mcp.json** (Development Cluster):
```json
{
  "cluster_name": "dev-ceph",
  "monitor_hosts": ["dev-ceph.local:6789"],
  "username": "client.dev",
  "keyring_path": "/etc/ceph/dev.client.keyring",
  "timeout": 60000,
  "enable_s3": false,
  "enable_rbd": true,
  "enable_cephfs": false
}
```

**.test-ceph-mcp.json** (Testing/Lab Cluster):
```json
{
  "cluster_name": "test-ceph",
  "monitor_hosts": ["localhost:6789"],
  "username": "client.admin",
  "keyring_path": "/etc/ceph/test.client.admin.keyring",
  "timeout": 120000,
  "pool_name": "testpool"
}
```

## Basic Configuration

### Minimal Configuration (Local Development)
```json
{
  "cluster_name": "ceph",
  "pool_name": "testpool"
}
```

This assumes:
- Ceph tools are installed locally
- Default configuration at `/etc/ceph/ceph.conf`
- Default keyring at `/etc/ceph/ceph.client.admin.keyring`

### Standard Production Configuration
```json
{
  "cluster_name": "production",
  "monitor_hosts": [
    "10.0.1.10:6789",
    "10.0.1.11:6789",
    "10.0.1.12:6789"
  ],
  "username": "client.admin",
  "keyring_path": "/etc/ceph/production.client.admin.keyring",
  "pool_name": "app-data",
  "timeout": 60000
}
```

## Authentication Examples

### Using Custom Keyring
```json
{
  "cluster_name": "ceph",
  "username": "client.app",
  "keyring_path": "/home/app/.ceph/app.keyring",
  "pool_name": "app-pool"
}
```

### Environment Variable Configuration
```bash
export CEPH_CLUSTER_NAME=production
export CEPH_MONITOR_HOSTS="mon1.example.com,mon2.example.com,mon3.example.com"
export CEPH_USERNAME=client.admin
export CEPH_KEYRING_PATH=/etc/ceph/ceph.client.admin.keyring
export CEPH_POOL_NAME=default-pool
```

## REST API Configuration

### Using Ceph Manager REST API
```json
{
  "api_url": "https://ceph-mgr.example.com:8443",
  "api_username": "admin",
  "api_password": "secretpassword",
  "timeout": 30000
}
```

### Using API Key Authentication
```json
{
  "api_url": "https://ceph-api.example.com",
  "api_key": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "timeout": 45000
}
```

## Feature-Specific Configurations

### RBD-Focused Configuration
```json
{
  "cluster_name": "ceph",
  "pool_name": "rbd",
  "enable_rbd": true,
  "enable_s3": false,
  "enable_cephfs": false
}
```

### S3/RGW-Focused Configuration
```json
{
  "cluster_name": "ceph",
  "enable_s3": true,
  "enable_rbd": false,
  "enable_cephfs": false,
  "api_url": "https://rgw.example.com:8080"
}
```

### CephFS-Focused Configuration
```json
{
  "cluster_name": "ceph",
  "enable_cephfs": true,
  "enable_rbd": false,
  "enable_s3": false
}
```

## Claude Desktop Integration Examples

### Development Environment
```json
{
  "mcpServers": {
    "ceph-dev": {
      "command": "node",
      "args": ["/home/user/ceph-mcp-server/dist/mcp-server.js"],
      "env": {
        "CEPH_CLUSTER_NAME": "dev-cluster",
        "CEPH_POOL_NAME": "dev-pool"
      }
    }
  }
}
```

### Production Environment
```json
{
  "mcpServers": {
    "ceph-prod": {
      "command": "node",
      "args": ["/opt/ceph-mcp-server/dist/mcp-server.js"],
      "env": {
        "CEPH_CLUSTER_NAME": "production",
        "CEPH_MONITOR_HOSTS": "10.0.1.10,10.0.1.11,10.0.1.12",
        "CEPH_USERNAME": "client.mcp",
        "CEPH_KEYRING_PATH": "/etc/ceph/ceph.client.mcp.keyring",
        "CEPH_TIMEOUT": "60000"
      }
    }
  }
}
```

### Multiple Clusters
```json
{
  "mcpServers": {
    "ceph-primary": {
      "command": "node",
      "args": ["/opt/ceph-mcp-server/dist/mcp-server.js"],
      "env": {
        "CEPH_CLUSTER_NAME": "primary",
        "CEPH_MONITOR_HOSTS": "primary-mon1,primary-mon2,primary-mon3"
      }
    },
    "ceph-backup": {
      "command": "node",
      "args": ["/opt/ceph-mcp-server/dist/mcp-server.js"],
      "env": {
        "CEPH_CLUSTER_NAME": "backup",
        "CEPH_MONITOR_HOSTS": "backup-mon1,backup-mon2,backup-mon3"
      }
    }
  }
}
```

## Security Best Practices

### Read-Only User Configuration
Create a Ceph user with limited permissions:
```bash
ceph auth get-or-create client.readonly mon 'allow r' osd 'allow r' mds 'allow r' mgr 'allow r'
```

Then configure:
```json
{
  "username": "client.readonly",
  "keyring_path": "/etc/ceph/ceph.client.readonly.keyring"
}
```

### Pool-Specific Access
Create a user with access to specific pools only:
```bash
ceph auth get-or-create client.app mon 'allow r' osd 'allow rwx pool=app-data'
```

Configuration:
```json
{
  "username": "client.app",
  "keyring_path": "/etc/ceph/ceph.client.app.keyring",
  "pool_name": "app-data"
}
```

## Troubleshooting Configurations

### Debug Configuration
```json
{
  "cluster_name": "ceph",
  "monitor_hosts": ["localhost:6789"],
  "timeout": 120000,
  "username": "client.admin",
  "keyring_path": "/etc/ceph/ceph.client.admin.keyring"
}
```

### Network Timeout Issues
```json
{
  "cluster_name": "ceph",
  "timeout": 300000,
  "monitor_hosts": [
    "10.0.1.10:6789",
    "10.0.1.11:6789",
    "10.0.1.12:6789"
  ]
}
```

## File Locations

Common configuration file locations:
- Current directory: `./.ceph-mcp.json`
- Home directory: `~/.ceph-mcp.json`
- System-wide: `/etc/ceph-mcp/config.json` (if implemented)

Common keyring locations:
- `/etc/ceph/ceph.client.admin.keyring` (default admin)
- `/etc/ceph/ceph.keyring` (old default)
- `/var/lib/ceph/bootstrap-osd/ceph.keyring` (OSD bootstrap)
- `~/.ceph/keyring` (user-specific)

## Claude Code Usage Examples

### Multiple Ceph Clusters with Claude Code

```bash
# Production cluster operations
MCP_SERVER_NAME=prod claude-code "Check cluster health and pool utilization"

# Development cluster testing
MCP_SERVER_NAME=dev claude-code "Create test pool and benchmark performance"

# Testing cluster experiments
MCP_SERVER_NAME=test claude-code "Test RBD image creation and mounting"

# Default cluster
claude-code "List all OSDs and their status"
```

### Environment-Specific Storage Operations

```bash
# Production: Monitoring and maintenance
MCP_SERVER_NAME=prod claude-code "Generate storage utilization report"

# Development: Testing new features
MCP_SERVER_NAME=dev claude-code "Test new CRUSH rule configuration"

# Testing: Performance validation
MCP_SERVER_NAME=test claude-code "Run rados bench performance tests"
```

Last Updated On: June 14, 2025