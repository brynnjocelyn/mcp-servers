# Proxmox MCP Server Configuration Examples

This document provides various configuration examples for different Proxmox VE setups and use cases.

## Multiple Instance Support

The Proxmox MCP server supports running multiple instances with different configurations by using the `MCP_SERVER_NAME` environment variable. This enables you to manage multiple Proxmox clusters or use different configurations for different virtualization environments.

### Instance-Specific Configuration

When `MCP_SERVER_NAME` is set, the server will look for a configuration file named `.{MCP_SERVER_NAME}-proxmox-mcp.json` instead of the default `.proxmox-mcp.json`.

**Example: Multiple Proxmox Clusters**
```bash
# Production cluster
export MCP_SERVER_NAME=prod
# Uses: .prod-proxmox-mcp.json

# Development cluster
export MCP_SERVER_NAME=dev
# Uses: .dev-proxmox-mcp.json

# Testing cluster
export MCP_SERVER_NAME=test
# Uses: .test-proxmox-mcp.json
```

### Configuration File Resolution

The server resolves configuration in this order:
1. **Instance-specific config**: `.{MCP_SERVER_NAME}-proxmox-mcp.json` (if MCP_SERVER_NAME is set)
2. **Default config file**: `.proxmox-mcp.json`
3. **Environment variables**
4. **Default values**

### Benefits of Multiple Instances

- **Multi-cluster**: Manage production, development, and testing Proxmox clusters
- **Environment isolation**: Separate configurations for different infrastructure purposes
- **Client separation**: Different Proxmox environments for different clients or teams
- **Geographic distribution**: Multiple data centers with different Proxmox clusters
- **Claude Code**: Perfect for managing multiple virtualization infrastructures

## Instance-Specific Configuration Examples

**.prod-proxmox-mcp.json** (Production Cluster):
```json
{
  "host": "prod-proxmox.example.com",
  "port": 8006,
  "username": "automation",
  "realm": "pve",
  "tokenId": "prod-mcp-token",
  "tokenSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "verifySsl": true,
  "timeout": 30000
}
```

**.dev-proxmox-mcp.json** (Development Cluster):
```json
{
  "host": "dev-proxmox.local",
  "port": 8006,
  "username": "root",
  "password": "dev-password",
  "realm": "pam",
  "verifySsl": false,
  "timeout": 60000
}
```

**.test-proxmox-mcp.json** (Testing Lab):
```json
{
  "host": "test-proxmox.lab",
  "port": 8006,
  "username": "test-user",
  "realm": "pve",
  "tokenId": "test-token",
  "tokenSecret": "test-secret-here",
  "verifySsl": false,
  "timeout": 120000
}
```

## Configuration Methods

The Proxmox MCP Server can be configured in multiple ways (in order of precedence):

## Basic Configuration Examples

### Single Node with Password Authentication

**.proxmox-mcp.json:**
```json
{
  "host": "192.168.1.100",
  "port": 8006,
  "username": "root",
  "password": "your-root-password",
  "realm": "pam",
  "verifySsl": false
}
```

### Cluster Setup with API Token

**.proxmox-mcp.json:**
```json
{
  "host": "pve-cluster.example.com",
  "port": 8006,
  "username": "automation",
  "realm": "pve",
  "tokenId": "mcp-automation",
  "tokenSecret": "12345678-abcd-efgh-ijkl-123456789012",
  "verifySsl": true,
  "timeout": 60000
}
```

### Development Environment

**.proxmox-mcp.json:**
```json
{
  "host": "localhost",
  "port": 8006,
  "username": "test@pve",
  "password": "test123",
  "realm": "pve",
  "verifySsl": false,
  "timeout": 30000
}
```

## Environment Variable Configuration

### Basic Setup
```bash
export PROXMOX_HOST=192.168.1.100
export PROXMOX_USERNAME=root
export PROXMOX_PASSWORD=your-password
export PROXMOX_REALM=pam
```

### Production Setup with Token
```bash
export PROXMOX_HOST=pve.company.com
export PROXMOX_PORT=8006
export PROXMOX_USERNAME=api-user
export PROXMOX_REALM=pve
export PROXMOX_TOKEN_ID=prod-token
export PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export PROXMOX_VERIFY_SSL=true
export PROXMOX_TIMEOUT=60000
```

## Claude Desktop Configuration Examples

### Single Proxmox Server

```json
{
  "mcpServers": {
    "proxmox": {
      "command": "/path/to/proxmox-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "PROXMOX_HOST": "192.168.1.100",
        "PROXMOX_USERNAME": "root",
        "PROXMOX_PASSWORD": "password",
        "PROXMOX_REALM": "pam"
      }
    }
  }
}
```

### Multiple Proxmox Environments

```json
{
  "mcpServers": {
    "proxmox-prod": {
      "command": "/path/to/proxmox-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "PROXMOX_HOST": "pve-prod.company.com",
        "PROXMOX_USERNAME": "automation",
        "PROXMOX_REALM": "pve",
        "PROXMOX_TOKEN_ID": "prod-token",
        "PROXMOX_TOKEN_SECRET": "prod-secret"
      }
    },
    "proxmox-dev": {
      "command": "/path/to/proxmox-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "PROXMOX_HOST": "pve-dev.company.local",
        "PROXMOX_USERNAME": "developer",
        "PROXMOX_PASSWORD": "dev-password",
        "PROXMOX_REALM": "pam",
        "PROXMOX_VERIFY_SSL": "false"
      }
    },
    "proxmox-homelab": {
      "command": "/path/to/proxmox-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "PROXMOX_HOST": "192.168.1.100",
        "PROXMOX_USERNAME": "admin",
        "PROXMOX_REALM": "pve",
        "PROXMOX_TOKEN_ID": "home-token",
        "PROXMOX_TOKEN_SECRET": "home-secret"
      }
    }
  }
}
```

## Creating API Tokens in Proxmox

### Via Web Interface

1. Log into Proxmox web interface
2. Navigate to **Datacenter → Permissions → API Tokens**
3. Click **Add** to create a new token
4. Configure:
   - **User**: Select the user (e.g., `automation@pve`)
   - **Token ID**: Enter a descriptive ID (e.g., `mcp-automation`)
   - **Privilege Separation**: Uncheck for full user permissions
   - **Expire**: Set expiration if desired
5. Click **Add** and copy the token secret (shown only once!)

### Via Command Line

```bash
# Create user first (if needed)
pveum user add automation@pve -comment "MCP Automation User"
pveum passwd automation@pve

# Create API token
pveum user token add automation@pve mcp-automation -privsep 0

# Assign permissions (example for full VM management)
pveum aclmod / -user automation@pve -role PVEVMAdmin
```

## Permission Examples

### Read-Only Access

Create a user with read-only permissions:
```bash
# Create user
pveum user add reader@pve -comment "Read-only MCP User"

# Create custom role
pveum role add MCPReader -privs "VM.Audit,Datastore.Audit,Sys.Audit,SDN.Audit"

# Assign role
pveum aclmod / -user reader@pve -role MCPReader

# Create token
pveum user token add reader@pve read-token -privsep 0
```

Configuration:
```json
{
  "host": "proxmox.example.com",
  "username": "reader",
  "realm": "pve",
  "tokenId": "read-token",
  "tokenSecret": "your-token-secret"
}
```

### VM Administrator

Create a user that can manage VMs but not the host:
```bash
# Create user
pveum user add vmadmin@pve -comment "VM Administrator"

# Assign built-in role
pveum aclmod /vms -user vmadmin@pve -role PVEVMAdmin

# Create token
pveum user token add vmadmin@pve vm-token -privsep 0
```

### Storage Administrator

Create a user for storage management:
```bash
# Create user
pveum user add storage@pve -comment "Storage Administrator"

# Assign permissions
pveum aclmod /storage -user storage@pve -role PVEDatastoreAdmin

# Create token
pveum user token add storage@pve storage-token -privsep 0
```

## Advanced Configurations

### High Availability Cluster

**.proxmox-mcp.json:**
```json
{
  "host": "pve-vip.company.com",
  "port": 8006,
  "username": "hacluster",
  "realm": "pve",
  "tokenId": "ha-manager",
  "tokenSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "verifySsl": true,
  "timeout": 120000
}
```

### Behind Reverse Proxy

**.proxmox-mcp.json:**
```json
{
  "host": "proxmox.company.com",
  "port": 443,
  "username": "api",
  "realm": "pve",
  "tokenId": "proxy-token",
  "tokenSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "verifySsl": true
}
```

### With Custom CA Certificate

When using self-signed certificates:

**.proxmox-mcp.json:**
```json
{
  "host": "pve.internal",
  "port": 8006,
  "username": "admin",
  "realm": "pve",
  "tokenId": "internal-token",
  "tokenSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "verifySsl": false
}
```

## Configuration for Different Use Cases

### Backup Automation

For automated backup operations:
```json
{
  "host": "backup-pve.company.com",
  "username": "backup-operator",
  "realm": "pve",
  "tokenId": "backup-automation",
  "tokenSecret": "backup-secret",
  "timeout": 300000
}
```

Required permissions:
```bash
pveum aclmod / -user backup-operator@pve -role PVEVMUser
pveum aclmod /storage/backup-storage -user backup-operator@pve -role PVEDatastoreUser
```

### Migration Operations

For VM migration between nodes:
```json
{
  "host": "pve-cluster.company.com",
  "username": "migration",
  "realm": "pve",
  "tokenId": "migrate-token",
  "tokenSecret": "migration-secret",
  "timeout": 600000
}
```

### Template Management

For managing VM/container templates:
```json
{
  "host": "templates.pve.local",
  "username": "template-mgr",
  "realm": "pve",
  "tokenId": "template-token",
  "tokenSecret": "template-secret"
}
```

## Troubleshooting Configuration

### Test Connection

Test with minimal configuration:
```json
{
  "host": "192.168.1.100",
  "username": "root",
  "password": "password",
  "realm": "pam",
  "verifySsl": false
}
```

### Debug SSL Issues

Disable SSL verification for testing:
```bash
export PROXMOX_VERIFY_SSL=false
```

### Timeout Issues

Increase timeout for slow operations:
```json
{
  "timeout": 300000
}
```

## Security Best Practices

1. **Always use API tokens** in production instead of passwords
2. **Enable SSL verification** except for local development
3. **Use privilege separation** when full admin access isn't needed
4. **Set token expiration** for temporary access
5. **Store secrets securely** using environment variables or secure vaults
6. **Limit permissions** to minimum required for the use case
7. **Use separate tokens** for different environments

## Claude Code Usage Examples

### Multiple Proxmox Clusters with Claude Code

```bash
# Production cluster management
MCP_SERVER_NAME=prod claude-code "Check cluster status and VM health"

# Development environment
MCP_SERVER_NAME=dev claude-code "Create test VM from Ubuntu template"

# Testing cluster operations
MCP_SERVER_NAME=test claude-code "Run backup operations on all containers"

# Default cluster
claude-code "List all storage locations and their usage"
```

### Environment-Specific Virtualization Operations

```bash
# Production: Monitoring and maintenance
MCP_SERVER_NAME=prod claude-code "Generate infrastructure status report"

# Development: VM provisioning
MCP_SERVER_NAME=dev claude-code "Deploy development environment VMs"

# Testing: Performance validation
MCP_SERVER_NAME=test claude-code "Test VM migration between nodes"
```

Last Updated On: June 14, 2025