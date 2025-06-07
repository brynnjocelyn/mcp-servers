# Proxmox MCP Server Tools Reference

This document provides detailed information about all available tools in the Proxmox MCP Server.

## Table of Contents

- [Cluster and Node Management](#cluster-and-node-management)
- [Virtual Machine Management](#virtual-machine-management)
- [Container Management](#container-management)
- [Storage Management](#storage-management)
- [Backup Management](#backup-management)
- [Task Management](#task-management)

## Cluster and Node Management

### get_cluster_status
Get Proxmox cluster status and health information.

**Parameters:** None

**Returns:** Cluster status including nodes, quorum, and health

**Example:**
```json
{
  "tool": "get_cluster_status",
  "arguments": {}
}
```

**Response Example:**
```json
{
  "nodes": [
    {
      "name": "pve1",
      "type": "node",
      "status": "online",
      "ip": "192.168.1.101"
    }
  ],
  "quorum": true,
  "version": 7
}
```

### list_nodes
List all nodes in the Proxmox cluster.

**Parameters:** None

**Returns:** Array of cluster nodes with basic information

**Example:**
```json
{
  "tool": "list_nodes",
  "arguments": {}
}
```

### get_node_status
Get detailed status information for a specific node.

**Parameters:**
- `node` (string, required): Node name

**Returns:** Node status including CPU, memory, storage usage

**Example:**
```json
{
  "tool": "get_node_status",
  "arguments": {
    "node": "pve1"
  }
}
```

### get_version
Get Proxmox VE version information.

**Parameters:** None

**Returns:** Version details of Proxmox installation

**Example:**
```json
{
  "tool": "get_version",
  "arguments": {}
}
```

## Virtual Machine Management

### list_vms
List all virtual machines on a node.

**Parameters:**
- `node` (string, required): Node name

**Returns:** Array of VMs with status and configuration

**Example:**
```json
{
  "tool": "list_vms",
  "arguments": {
    "node": "pve1"
  }
}
```

**Response Example:**
```json
[
  {
    "vmid": 100,
    "name": "web-server",
    "status": "running",
    "mem": 2147483648,
    "maxmem": 4294967296,
    "cpus": 2
  }
]
```

### get_vm_status
Get current status of a virtual machine.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): VM ID

**Returns:** Detailed VM status including resource usage

**Example:**
```json
{
  "tool": "get_vm_status",
  "arguments": {
    "node": "pve1",
    "vmid": 100
  }
}
```

### get_vm_config
Get configuration of a virtual machine.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): VM ID

**Returns:** Complete VM configuration

**Example:**
```json
{
  "tool": "get_vm_config",
  "arguments": {
    "node": "pve1",
    "vmid": 100
  }
}
```

### start_vm
Start a virtual machine.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): VM ID
- `timeout` (number, optional): Timeout in seconds

**Returns:** Task ID for tracking operation

**Example:**
```json
{
  "tool": "start_vm",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "timeout": 30
  }
}
```

### stop_vm
Stop a virtual machine.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): VM ID
- `timeout` (number, optional): Timeout in seconds
- `forceStop` (boolean, optional): Force stop the VM

**Returns:** Task ID for tracking operation

**Example:**
```json
{
  "tool": "stop_vm",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "forceStop": false
  }
}
```

### reboot_vm
Reboot a virtual machine.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): VM ID
- `timeout` (number, optional): Timeout in seconds

**Example:**
```json
{
  "tool": "reboot_vm",
  "arguments": {
    "node": "pve1",
    "vmid": 100
  }
}
```

### shutdown_vm
Gracefully shutdown a virtual machine.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): VM ID
- `timeout` (number, optional): Timeout in seconds
- `forceStop` (boolean, optional): Force stop after timeout

**Example:**
```json
{
  "tool": "shutdown_vm",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "timeout": 60
  }
}
```

### create_vm
Create a new virtual machine.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, optional): VM ID (auto-generate if not provided)
- `name` (string, optional): VM name
- `memory` (number, optional): Memory in MB (default: 2048)
- `cores` (number, optional): Number of CPU cores (default: 1)
- `sockets` (number, optional): Number of CPU sockets (default: 1)
- `ostype` (string, optional): OS type (default: 'l26' for Linux 2.6+)
- `iso` (string, optional): ISO image path
- `storage` (string, optional): Storage for VM disk
- `diskSize` (string, optional): Disk size (default: '32G')

**OS Types:**
- `l26`: Linux 2.6 - 5.X Kernel
- `win10`: Windows 10/2016/2019
- `win11`: Windows 11/2022
- `other`: Other OS

**Example:**
```json
{
  "tool": "create_vm",
  "arguments": {
    "node": "pve1",
    "name": "ubuntu-test",
    "memory": 4096,
    "cores": 2,
    "ostype": "l26",
    "iso": "local:iso/ubuntu-22.04.iso",
    "storage": "local-lvm",
    "diskSize": "50G"
  }
}
```

### clone_vm
Clone an existing virtual machine.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): Source VM ID
- `newid` (number, required): New VM ID
- `name` (string, optional): New VM name
- `full` (boolean, optional): Full clone vs linked clone (default: true)
- `storage` (string, optional): Target storage

**Example:**
```json
{
  "tool": "clone_vm",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "newid": 101,
    "name": "web-server-clone",
    "full": true,
    "storage": "local-lvm"
  }
}
```

### delete_vm
Delete a virtual machine.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): VM ID
- `purge` (boolean, optional): Remove from backup jobs and HA

**Example:**
```json
{
  "tool": "delete_vm",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "purge": true
  }
}
```

### migrate_vm
Migrate a VM to another node.

**Parameters:**
- `node` (string, required): Source node
- `vmid` (number, required): VM ID
- `target` (string, required): Target node
- `online` (boolean, optional): Online migration (VM stays running)

**Example:**
```json
{
  "tool": "migrate_vm",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "target": "pve2",
    "online": true
  }
}
```

## Container Management

### list_containers
List all LXC containers on a node.

**Parameters:**
- `node` (string, required): Node name

**Returns:** Array of containers with status

**Example:**
```json
{
  "tool": "list_containers",
  "arguments": {
    "node": "pve1"
  }
}
```

### get_container_status
Get current status of a container.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): Container ID

**Example:**
```json
{
  "tool": "get_container_status",
  "arguments": {
    "node": "pve1",
    "vmid": 200
  }
}
```

### get_container_config
Get configuration of a container.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): Container ID

**Example:**
```json
{
  "tool": "get_container_config",
  "arguments": {
    "node": "pve1",
    "vmid": 200
  }
}
```

### start_container
Start a container.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): Container ID

**Example:**
```json
{
  "tool": "start_container",
  "arguments": {
    "node": "pve1",
    "vmid": 200
  }
}
```

### stop_container
Stop a container.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): Container ID

**Example:**
```json
{
  "tool": "stop_container",
  "arguments": {
    "node": "pve1",
    "vmid": 200
  }
}
```

### create_container
Create a new LXC container.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, optional): Container ID
- `ostemplate` (string, required): OS template path
- `hostname` (string, optional): Container hostname
- `memory` (number, optional): Memory in MB (default: 512)
- `storage` (string, required): Storage location
- `password` (string, optional): Root password
- `ssh_public_keys` (string, optional): SSH public keys

**Example:**
```json
{
  "tool": "create_container",
  "arguments": {
    "node": "pve1",
    "ostemplate": "local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst",
    "hostname": "web-container",
    "memory": 2048,
    "storage": "local-lvm",
    "password": "secure-password",
    "ssh_public_keys": "ssh-rsa AAAAB3NzaC1..."
  }
}
```

## Storage Management

### list_storage
List available storage locations.

**Parameters:**
- `node` (string, optional): Node name (omit for cluster-wide)

**Returns:** Array of storage configurations

**Example:**
```json
{
  "tool": "list_storage",
  "arguments": {
    "node": "pve1"
  }
}
```

### get_storage_content
List content of a storage location.

**Parameters:**
- `node` (string, required): Node name
- `storage` (string, required): Storage ID
- `content` (string, optional): Content type filter (images, rootdir, vztmpl, backup, iso)

**Example:**
```json
{
  "tool": "get_storage_content",
  "arguments": {
    "node": "pve1",
    "storage": "local",
    "content": "iso"
  }
}
```

### upload_file
Upload ISO, template, or backup file to storage.

**Parameters:**
- `node` (string, required): Node name
- `storage` (string, required): Storage ID
- `filename` (string, required): File name
- `content` (string, required): File content (base64 for binary)
- `contentType` (string, required): Content type
  - `iso`: ISO images
  - `vztmpl`: Container templates
  - `backup`: Backup files

**Example:**
```json
{
  "tool": "upload_file",
  "arguments": {
    "node": "pve1",
    "storage": "local",
    "filename": "custom.iso",
    "content": "base64-encoded-content",
    "contentType": "iso"
  }
}
```

## Backup Management

### create_backup
Create a backup of a VM or container.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, required): VM/Container ID
- `storage` (string, required): Backup storage
- `mode` (string, optional): Backup mode
  - `snapshot`: Backup with minimal downtime (default)
  - `suspend`: Suspend VM during backup
  - `stop`: Stop VM during backup
- `compress` (string, optional): Compression type
  - `0`: No compression
  - `gzip`: Gzip compression
  - `lzo`: LZO compression
  - `zstd`: Zstandard compression (default)
- `notes` (string, optional): Backup notes

**Example:**
```json
{
  "tool": "create_backup",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "storage": "backup-nas",
    "mode": "snapshot",
    "compress": "zstd",
    "notes": "Weekly backup before updates"
  }
}
```

### list_backups
List available backups.

**Parameters:**
- `node` (string, required): Node name
- `storage` (string, required): Storage ID
- `vmid` (number, optional): Filter by VM ID

**Example:**
```json
{
  "tool": "list_backups",
  "arguments": {
    "node": "pve1",
    "storage": "backup-nas",
    "vmid": 100
  }
}
```

### restore_backup
Restore a VM or container from backup.

**Parameters:**
- `node` (string, required): Node name
- `storage` (string, required): Storage ID
- `volid` (string, required): Backup volume ID
- `vmid` (number, required): Target VM ID
- `force` (boolean, optional): Force overwrite existing VM

**Example:**
```json
{
  "tool": "restore_backup",
  "arguments": {
    "node": "pve1",
    "storage": "backup-nas",
    "volid": "backup/vzdump-qemu-100-2024_01_01-12_00_00.vma.zst",
    "vmid": 100,
    "force": true
  }
}
```

## Task Management

### get_task_status
Get status of a running task.

**Parameters:**
- `node` (string, required): Node name
- `upid` (string, required): Task ID (UPID)

**Returns:** Task status, progress, and logs

**Example:**
```json
{
  "tool": "get_task_status",
  "arguments": {
    "node": "pve1",
    "upid": "UPID:pve1:00002B4A:000F42E2:65A5C6F7:qmstart:100:root@pam:"
  }
}
```

### list_tasks
List recent tasks.

**Parameters:**
- `node` (string, required): Node name
- `vmid` (number, optional): Filter by VM ID
- `limit` (number, optional): Limit results (default: 50)

**Returns:** Array of recent tasks with status

**Example:**
```json
{
  "tool": "list_tasks",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "limit": 10
  }
}
```

## Common Workflows

### Deploy VM from ISO

1. Upload ISO (if needed):
```json
{
  "tool": "upload_file",
  "arguments": {
    "node": "pve1",
    "storage": "local",
    "filename": "ubuntu-22.04.iso",
    "content": "base64-content",
    "contentType": "iso"
  }
}
```

2. Create VM:
```json
{
  "tool": "create_vm",
  "arguments": {
    "node": "pve1",
    "name": "ubuntu-server",
    "memory": 4096,
    "cores": 2,
    "iso": "local:iso/ubuntu-22.04.iso",
    "storage": "local-lvm",
    "diskSize": "100G"
  }
}
```

3. Start VM:
```json
{
  "tool": "start_vm",
  "arguments": {
    "node": "pve1",
    "vmid": 100
  }
}
```

### Backup and Migrate VM

1. Create backup:
```json
{
  "tool": "create_backup",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "storage": "backup-storage",
    "mode": "snapshot"
  }
}
```

2. Migrate to another node:
```json
{
  "tool": "migrate_vm",
  "arguments": {
    "node": "pve1",
    "vmid": 100,
    "target": "pve2",
    "online": true
  }
}
```

### Container Template Deployment

1. Create container from template:
```json
{
  "tool": "create_container",
  "arguments": {
    "node": "pve1",
    "ostemplate": "local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst",
    "hostname": "app-container",
    "memory": 1024,
    "storage": "local-lvm"
  }
}
```

2. Start container:
```json
{
  "tool": "start_container",
  "arguments": {
    "node": "pve1",
    "vmid": 200
  }
}
```

## Error Handling

All tools return error messages when operations fail. Common errors include:

- **Authentication errors**: Check API token or credentials
- **Permission denied**: Verify user has required privileges
- **Resource not found**: Check node name and VM/container IDs
- **Storage errors**: Ensure storage is available and has space
- **Network errors**: Verify connectivity to Proxmox host

Last Updated On: 2025-06-06