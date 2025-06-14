# Proxmox MCP Server

A Model Context Protocol (MCP) server that provides comprehensive tools for managing Proxmox Virtual Environment (VE) infrastructure. This server enables LLMs to interact with Proxmox clusters, virtual machines, containers, storage, and more through a standardized interface.

## Overview

This MCP server exposes Proxmox VE's functionality as tools that can be used by any MCP-compatible client (like Claude Desktop). It provides a complete interface for infrastructure management including virtual machines (KVM), containers (LXC), storage, backups, and cluster operations.

## Features

### Virtual Machine Management
- List, create, clone, and delete VMs
- Start, stop, reboot, and shutdown operations
- Live migration between nodes
- Configuration management
- Status monitoring

### Container Management
- Create and manage LXC containers
- Start, stop, and configure containers
- Template-based deployment
- Resource allocation

### Storage Operations
- List available storage locations
- Browse storage contents
- Upload ISO images and templates
- Manage VM disks and volumes

### Backup and Restore
- Create VM and container backups
- Multiple compression options
- Scheduled backup support
- Full restore capabilities

### Cluster Management
- Monitor cluster health and status
- Node management and statistics
- Resource allocation overview
- Task management and monitoring

## Installation

```bash
npm install
npm run build
```

## Multiple Instance Support

The Proxmox MCP server supports running multiple instances with different configurations by using the `MCP_SERVER_NAME` environment variable. This enables you to manage multiple Proxmox clusters or use different configurations for different virtualization environments.

### Instance-Specific Configuration

When `MCP_SERVER_NAME` is set, the server will look for a configuration file named `.{MCP_SERVER_NAME}-proxmox-mcp.json` instead of the default `.proxmox-mcp.json`.

**Example: Multiple Proxmox Clusters**
```bash
# Production Proxmox cluster
export MCP_SERVER_NAME=prod
# Uses: .prod-proxmox-mcp.json

# Development Proxmox cluster
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
- **Environment isolation**: Separate configurations for different virtualization environments
- **Client management**: Different Proxmox setups for different clients or projects
- **Geographic distribution**: Different Proxmox clusters in different data centers
- **Claude Code**: Perfect for managing multiple virtualization infrastructures

### Example: Multiple Proxmox Clusters

**.prod-proxmox-mcp.json** (Production):
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

**.dev-proxmox-mcp.json** (Development):
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

**.test-proxmox-mcp.json** (Testing):
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

### Claude Code Usage

With Claude Code, you can easily switch between Proxmox clusters:

```bash
# Work with production cluster
MCP_SERVER_NAME=prod claude-code "List all VMs and their status"

# Work with development cluster
MCP_SERVER_NAME=dev claude-code "Create test VM from template"

# Work with testing cluster
MCP_SERVER_NAME=test claude-code "Run backup operations on all containers"

# Default cluster
claude-code "Check cluster health and node status"
```

### Claude Desktop Integration

For Claude Desktop, configure multiple Proxmox servers:

```json
{
  "mcpServers": {
    "proxmox-prod": {
      "command": "/path/to/proxmox-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "prod"
      }
    },
    "proxmox-dev": {
      "command": "/path/to/proxmox-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "dev"
      }
    },
    "proxmox-test": {
      "command": "/path/to/proxmox-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "test"
      }
    },
    "proxmox": {
      "command": "/path/to/proxmox-mcp-server/dist/mcp-server.js",
      "args": []
    }
  }
}
```

## Configuration

The Proxmox MCP server can be configured in multiple ways (in order of precedence):

### Configuration File (.proxmox-mcp.json)

Create a `.proxmox-mcp.json` file in your project directory:

```json
{
  "host": "proxmox.example.com",
  "port": 8006,
  "username": "root",
  "password": "your-password",
  "realm": "pam",
  "verifySsl": true,
  "timeout": 30000
}
```

### API Token Authentication (Recommended)

For better security, use API tokens instead of passwords:

```json
{
  "host": "proxmox.example.com",
  "port": 8006,
  "username": "api-user",
  "realm": "pve",
  "tokenId": "mcp-token",
  "tokenSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "verifySsl": true
}
```

### Environment Variables

```bash
# Connection settings
export PROXMOX_HOST=proxmox.example.com
export PROXMOX_PORT=8006

# Password authentication
export PROXMOX_USERNAME=root
export PROXMOX_PASSWORD=your-password
export PROXMOX_REALM=pam

# OR Token authentication (recommended)
export PROXMOX_USERNAME=api-user
export PROXMOX_REALM=pve
export PROXMOX_TOKEN_ID=mcp-token
export PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional settings
export PROXMOX_VERIFY_SSL=true
export PROXMOX_TIMEOUT=30000
```

## Creating API Tokens in Proxmox

1. Log into Proxmox web interface
2. Navigate to Datacenter → Permissions → API Tokens
3. Click "Add" and create a new token
4. **Important**: Uncheck "Privilege Separation" for full access
5. Copy the token secret (shown only once)

## Usage with Claude Desktop

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "proxmox": {
      "command": "/path/to/proxmox-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "PROXMOX_HOST": "proxmox.example.com",
        "PROXMOX_USERNAME": "api-user",
        "PROXMOX_REALM": "pve",
        "PROXMOX_TOKEN_ID": "mcp-token",
        "PROXMOX_TOKEN_SECRET": "your-token-secret"
      }
    }
  }
}
```

## Available Tools

### Cluster and Node Management

#### get_cluster_status
Get cluster status and health information.

#### list_nodes
List all nodes in the Proxmox cluster.

#### get_node_status
Get detailed status information for a specific node.
- `node`: Node name

#### get_version
Get Proxmox VE version information.

### Virtual Machine Management

#### list_vms
List all virtual machines on a node.
- `node`: Node name

#### get_vm_status
Get current status of a virtual machine.
- `node`: Node name
- `vmid`: VM ID

#### get_vm_config
Get configuration of a virtual machine.
- `node`: Node name
- `vmid`: VM ID

#### start_vm
Start a virtual machine.
- `node`: Node name
- `vmid`: VM ID
- `timeout` (optional): Timeout in seconds

#### stop_vm
Stop a virtual machine.
- `node`: Node name
- `vmid`: VM ID
- `timeout` (optional): Timeout in seconds
- `forceStop` (optional): Force stop the VM

#### reboot_vm
Reboot a virtual machine.
- `node`: Node name
- `vmid`: VM ID
- `timeout` (optional): Timeout in seconds

#### shutdown_vm
Gracefully shutdown a virtual machine.
- `node`: Node name
- `vmid`: VM ID
- `timeout` (optional): Timeout in seconds
- `forceStop` (optional): Force stop after timeout

#### create_vm
Create a new virtual machine.
- `node`: Node name
- `vmid` (optional): VM ID (auto-generate if not provided)
- `name` (optional): VM name
- `memory` (optional): Memory in MB (default: 2048)
- `cores` (optional): Number of CPU cores (default: 1)
- `sockets` (optional): Number of CPU sockets (default: 1)
- `ostype` (optional): OS type (default: 'l26')
- `iso` (optional): ISO image path
- `storage` (optional): Storage for VM disk
- `diskSize` (optional): Disk size (default: '32G')

#### clone_vm
Clone an existing virtual machine.
- `node`: Node name
- `vmid`: Source VM ID
- `newid`: New VM ID
- `name` (optional): New VM name
- `full` (optional): Full clone (default: true)
- `storage` (optional): Target storage

#### delete_vm
Delete a virtual machine.
- `node`: Node name
- `vmid`: VM ID
- `purge` (optional): Remove from backup jobs and HA

#### migrate_vm
Migrate a VM to another node.
- `node`: Source node
- `vmid`: VM ID
- `target`: Target node
- `online` (optional): Online migration

### Container Management

#### list_containers
List all LXC containers on a node.
- `node`: Node name

#### get_container_status
Get current status of a container.
- `node`: Node name
- `vmid`: Container ID

#### get_container_config
Get configuration of a container.
- `node`: Node name
- `vmid`: Container ID

#### start_container
Start a container.
- `node`: Node name
- `vmid`: Container ID

#### stop_container
Stop a container.
- `node`: Node name
- `vmid`: Container ID

#### create_container
Create a new LXC container.
- `node`: Node name
- `vmid` (optional): Container ID
- `ostemplate`: OS template
- `hostname` (optional): Container hostname
- `memory` (optional): Memory in MB (default: 512)
- `storage`: Storage location
- `password` (optional): Root password
- `ssh_public_keys` (optional): SSH public keys

### Storage Management

#### list_storage
List available storage locations.
- `node` (optional): Node name

#### get_storage_content
List content of a storage location.
- `node`: Node name
- `storage`: Storage ID
- `content` (optional): Content type filter

#### upload_file
Upload ISO, template, or backup file to storage.
- `node`: Node name
- `storage`: Storage ID
- `filename`: File name
- `content`: File content (base64 for binary)
- `contentType`: Content type (iso, vztmpl, backup)

### Backup Management

#### create_backup
Create a backup of a VM or container.
- `node`: Node name
- `vmid`: VM/Container ID
- `storage`: Backup storage
- `mode` (optional): Backup mode (snapshot, suspend, stop)
- `compress` (optional): Compression type (0, gzip, lzo, zstd)
- `notes` (optional): Backup notes

#### list_backups
List available backups.
- `node`: Node name
- `storage`: Storage ID
- `vmid` (optional): Filter by VM ID

#### restore_backup
Restore a VM or container from backup.
- `node`: Node name
- `storage`: Storage ID
- `volid`: Backup volume ID
- `vmid`: Target VM ID
- `force` (optional): Force overwrite existing VM

### Task Management

#### get_task_status
Get status of a running task.
- `node`: Node name
- `upid`: Task ID (UPID)

#### list_tasks
List recent tasks.
- `node`: Node name
- `vmid` (optional): Filter by VM ID
- `limit` (optional): Limit results

## Example Workflows

### Create and Start a VM

```json
// Create VM
{
  "tool": "create_vm",
  "arguments": {
    "node": "pve",
    "name": "test-vm",
    "memory": 4096,
    "cores": 2,
    "storage": "local-lvm",
    "iso": "local:iso/ubuntu-22.04.iso"
  }
}

// Start VM
{
  "tool": "start_vm",
  "arguments": {
    "node": "pve",
    "vmid": 100
  }
}
```

### Create Container from Template

```json
{
  "tool": "create_container",
  "arguments": {
    "node": "pve",
    "ostemplate": "local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst",
    "hostname": "test-container",
    "memory": 1024,
    "storage": "local-lvm",
    "password": "secure-password"
  }
}
```

### Backup and Restore

```json
// Create backup
{
  "tool": "create_backup",
  "arguments": {
    "node": "pve",
    "vmid": 100,
    "storage": "backup-storage",
    "mode": "snapshot",
    "compress": "zstd"
  }
}

// Restore backup
{
  "tool": "restore_backup",
  "arguments": {
    "node": "pve",
    "storage": "backup-storage",
    "volid": "backup/vzdump-qemu-100-2024_01_01-12_00_00.vma.zst",
    "vmid": 101
  }
}
```

## Best Practices

1. **Use API Tokens**: More secure than password authentication
2. **Limit Permissions**: Create tokens with only necessary permissions
3. **SSL Verification**: Keep SSL verification enabled in production
4. **Resource Planning**: Plan CPU, memory, and storage allocation
5. **Regular Backups**: Schedule automated backups for critical VMs
6. **Monitor Tasks**: Use task management tools to track long operations

## Security Considerations

1. **API Token Security**: Store tokens securely, never in version control
2. **Network Security**: Use VPN or secure networks for remote access
3. **Permission Management**: Follow principle of least privilege
4. **SSL Certificates**: Use valid certificates in production
5. **Audit Logging**: Monitor API access through Proxmox logs

## Troubleshooting

### Connection Issues
- Verify Proxmox host is accessible
- Check firewall allows port 8006
- Ensure SSL certificate is valid (or disable verification for testing)

### Authentication Failures
- Verify username includes realm (e.g., root@pam)
- Check API token has correct permissions
- Ensure token is not expired

### Permission Errors
- Verify user/token has necessary privileges
- Check resource permissions in Proxmox
- Review audit logs for detailed errors

## Development

### Running in Development
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Making the Server Executable
```bash
chmod +x dist/mcp-server.js
```

## License

ISC

Last Updated On: June 14, 2025