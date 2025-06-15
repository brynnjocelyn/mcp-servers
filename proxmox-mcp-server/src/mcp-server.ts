#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { loadConfig } from './config-loader.js';
import { ProxmoxClient } from './proxmox-client.js';

// Tool parameter schemas
const GetClusterStatusSchema = z.object({});

const GetNodesSchema = z.object({});

const GetNodeStatusSchema = z.object({
  node: z.string().describe('Node name'),
});

const GetVersionSchema = z.object({});

// VM Management Schemas
const ListVMsSchema = z.object({
  node: z.string().describe('Node name'),
});

const GetVMStatusSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
});

const GetVMConfigSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
});

const StartVMSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  timeout: z.number().optional().describe('Timeout in seconds'),
});

const StopVMSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  timeout: z.number().optional().describe('Timeout in seconds'),
  forceStop: z.boolean().optional().describe('Force stop the VM'),
});

const RebootVMSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  timeout: z.number().optional().describe('Timeout in seconds'),
});

const ShutdownVMSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  timeout: z.number().optional().describe('Timeout in seconds'),
  forceStop: z.boolean().optional().describe('Force stop after timeout'),
});

const CreateVMSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().optional().describe('VM ID (auto-generate if not provided)'),
  name: z.string().optional().describe('VM name'),
  memory: z.number().optional().default(2048).describe('Memory in MB'),
  cores: z.number().optional().default(1).describe('Number of CPU cores'),
  sockets: z.number().optional().default(1).describe('Number of CPU sockets'),
  ostype: z.string().optional().default('l26').describe('OS type'),
  iso: z.string().optional().describe('ISO image path'),
  storage: z.string().optional().describe('Storage for VM disk'),
  diskSize: z.string().optional().default('32G').describe('Disk size (e.g., 32G)'),
});

const CloneVMSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Source VM ID'),
  newid: z.number().describe('New VM ID'),
  name: z.string().optional().describe('New VM name'),
  full: z.boolean().optional().default(true).describe('Full clone (not linked)'),
  storage: z.string().optional().describe('Target storage'),
});

const DeleteVMSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  purge: z.boolean().optional().describe('Remove from backup jobs and HA'),
});

const MigrateVMSchema = z.object({
  node: z.string().describe('Source node'),
  vmid: z.number().describe('VM ID'),
  target: z.string().describe('Target node'),
  online: z.boolean().optional().describe('Online migration'),
});

// Container Management Schemas
const ListContainersSchema = z.object({
  node: z.string().describe('Node name'),
});

const GetContainerStatusSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
});

const GetContainerConfigSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
});

const StartContainerSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
});

const StopContainerSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
});

const CreateContainerSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().optional().describe('Container ID'),
  ostemplate: z.string().describe('OS template'),
  hostname: z.string().optional().describe('Container hostname'),
  memory: z.number().optional().default(512).describe('Memory in MB'),
  storage: z.string().describe('Storage location'),
  password: z.string().optional().describe('Root password'),
  ssh_public_keys: z.string().optional().describe('SSH public keys'),
});

const MigrateContainerSchema = z.object({
  node: z.string().describe('Source node'),
  vmid: z.number().describe('Container ID'),
  target: z.string().describe('Target node'),
  restart: z.boolean().optional().describe('Restart container after migration'),
  timeout: z.number().optional().describe('Timeout in seconds'),
});

const ShutdownContainerSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
  timeout: z.number().optional().describe('Timeout in seconds'),
  forceStop: z.boolean().optional().describe('Force stop after timeout'),
});

const RebootContainerSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
  timeout: z.number().optional().describe('Timeout in seconds'),
});

const CloneContainerSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Source container ID'),
  newid: z.number().describe('New container ID'),
  hostname: z.string().optional().describe('New container hostname'),
  full: z.boolean().optional().default(true).describe('Full clone (not linked)'),
  storage: z.string().optional().describe('Target storage'),
});

const DeleteContainerSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
  purge: z.boolean().optional().describe('Remove from backup jobs and HA'),
  destroyUnreferencedDisks: z.boolean().optional().describe('Destroy unreferenced disks'),
});

const ResizeContainerSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
  disk: z.string().describe('Disk to resize (e.g., rootfs)'),
  size: z.string().describe('New size (e.g., +2G or 32G)'),
});

const SnapshotContainerSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
  snapname: z.string().describe('Snapshot name'),
  description: z.string().optional().describe('Snapshot description'),
});

const DeleteContainerSnapshotSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
  snapname: z.string().describe('Snapshot name'),
});

const RestoreContainerSnapshotSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
  snapname: z.string().describe('Snapshot name'),
});

const ListContainerSnapshotsSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
});

// Storage Management Schemas
const ListStorageSchema = z.object({
  node: z.string().optional().describe('Node name (optional)'),
});

const GetStorageContentSchema = z.object({
  node: z.string().describe('Node name'),
  storage: z.string().describe('Storage ID'),
  content: z.string().optional().describe('Content type filter'),
});

const UploadFileSchema = z.object({
  node: z.string().describe('Node name'),
  storage: z.string().describe('Storage ID'),
  filename: z.string().describe('File name'),
  content: z.string().describe('File content (base64 for binary)'),
  contentType: z.enum(['iso', 'vztmpl', 'backup']).describe('Content type'),
});

// Backup Management Schemas
const CreateBackupSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM/Container ID'),
  storage: z.string().describe('Backup storage'),
  mode: z.enum(['snapshot', 'suspend', 'stop']).optional().default('snapshot'),
  compress: z.enum(['0', 'gzip', 'lzo', 'zstd']).optional().default('zstd'),
  notes: z.string().optional().describe('Backup notes'),
});

const ListBackupsSchema = z.object({
  node: z.string().describe('Node name'),
  storage: z.string().describe('Storage ID'),
  vmid: z.number().optional().describe('Filter by VM ID'),
});

const RestoreBackupSchema = z.object({
  node: z.string().describe('Node name'),
  storage: z.string().describe('Storage ID'),
  volid: z.string().describe('Backup volume ID'),
  vmid: z.number().describe('Target VM ID'),
  force: z.boolean().optional().describe('Force overwrite existing VM'),
});

// Task Management Schemas
const GetTaskStatusSchema = z.object({
  node: z.string().describe('Node name'),
  upid: z.string().describe('Task ID (UPID)'),
});

const ListTasksSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().optional().describe('Filter by VM ID'),
  limit: z.number().optional().describe('Limit results'),
});

// VM Snapshot Schemas
const CreateVMSnapshotSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  snapname: z.string().describe('Snapshot name'),
  description: z.string().optional().describe('Snapshot description'),
  vmstate: z.boolean().optional().describe('Include VM state'),
});

const DeleteVMSnapshotSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  snapname: z.string().describe('Snapshot name'),
});

const RestoreVMSnapshotSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  snapname: z.string().describe('Snapshot name'),
});

const ListVMSnapshotsSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
});

// VM Configuration Update Schemas
const UpdateVMConfigSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  cores: z.number().optional().describe('Number of CPU cores'),
  memory: z.number().optional().describe('Memory in MB'),
  name: z.string().optional().describe('VM name'),
  description: z.string().optional().describe('VM description'),
  onboot: z.boolean().optional().describe('Start on boot'),
  config: z.record(z.any()).optional().describe('Additional config options'),
});

const ResizeVMDiskSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  disk: z.string().describe('Disk identifier (e.g., scsi0)'),
  size: z.string().describe('New size (e.g., +2G or 32G)'),
});

// Network Management Schemas
const ListNetworksSchema = z.object({
  node: z.string().describe('Node name'),
  type: z.enum(['bridge', 'bond', 'vlan', 'alias']).optional().describe('Network type filter'),
});

const GetNetworkConfigSchema = z.object({
  node: z.string().describe('Node name'),
  iface: z.string().describe('Network interface name'),
});

const CreateNetworkBridgeSchema = z.object({
  node: z.string().describe('Node name'),
  iface: z.string().describe('Bridge name'),
  type: z.literal('bridge').default('bridge'),
  autostart: z.boolean().optional().default(true),
  bridge_ports: z.string().optional().describe('Bridge ports'),
  comments: z.string().optional().describe('Comments'),
});

const UpdateNetworkConfigSchema = z.object({
  node: z.string().describe('Node name'),
  iface: z.string().describe('Interface name'),
  autostart: z.boolean().optional().describe('Auto start'),
  bridge_ports: z.string().optional().describe('Bridge ports'),
  comments: z.string().optional().describe('Comments'),
});

const DeleteNetworkConfigSchema = z.object({
  node: z.string().describe('Node name'),
  iface: z.string().describe('Interface name'),
});

// Firewall Management Schemas
const GetFirewallStatusSchema = z.object({
  node: z.string().optional().describe('Node name (cluster-wide if omitted)'),
});

const UpdateFirewallStatusSchema = z.object({
  node: z.string().optional().describe('Node name (cluster-wide if omitted)'),
  enable: z.boolean().describe('Enable or disable firewall'),
});

const ListFirewallRulesSchema = z.object({
  node: z.string().optional().describe('Node name'),
  vmid: z.number().optional().describe('VM ID'),
});

const CreateFirewallRuleSchema = z.object({
  node: z.string().optional().describe('Node name'),
  vmid: z.number().optional().describe('VM ID'),
  action: z.enum(['ACCEPT', 'DROP', 'REJECT']).describe('Rule action'),
  type: z.enum(['in', 'out', 'group']).describe('Rule type'),
  enable: z.boolean().optional().default(true),
  source: z.string().optional().describe('Source address'),
  dest: z.string().optional().describe('Destination address'),
  proto: z.enum(['tcp', 'udp', 'icmp']).optional().describe('Protocol'),
  dport: z.string().optional().describe('Destination port'),
  sport: z.string().optional().describe('Source port'),
  comment: z.string().optional().describe('Comment'),
});

const UpdateFirewallRuleSchema = z.object({
  node: z.string().optional().describe('Node name'),
  vmid: z.number().optional().describe('VM ID'),
  pos: z.number().describe('Rule position'),
  action: z.enum(['ACCEPT', 'DROP', 'REJECT']).optional().describe('Rule action'),
  enable: z.boolean().optional(),
  source: z.string().optional().describe('Source address'),
  dest: z.string().optional().describe('Destination address'),
  comment: z.string().optional().describe('Comment'),
});

const DeleteFirewallRuleSchema = z.object({
  node: z.string().optional().describe('Node name'),
  vmid: z.number().optional().describe('VM ID'),
  pos: z.number().describe('Rule position'),
});

// User Management Schemas
const ListUsersSchema = z.object({
  enabled: z.boolean().optional().describe('Filter by enabled status'),
  full: z.boolean().optional().describe('Include full details'),
});

const CreateUserSchema = z.object({
  userid: z.string().describe('User ID (username@realm)'),
  password: z.string().optional().describe('Password'),
  enable: z.boolean().optional().default(true),
  expire: z.number().optional().describe('Expiration date (UNIX timestamp)'),
  firstname: z.string().optional().describe('First name'),
  lastname: z.string().optional().describe('Last name'),
  email: z.string().optional().describe('Email address'),
  comment: z.string().optional().describe('Comment'),
  groups: z.string().optional().describe('Comma-separated group list'),
});

const UpdateUserSchema = z.object({
  userid: z.string().describe('User ID (username@realm)'),
  enable: z.boolean().optional(),
  expire: z.number().optional().describe('Expiration date (UNIX timestamp)'),
  firstname: z.string().optional().describe('First name'),
  lastname: z.string().optional().describe('Last name'),
  email: z.string().optional().describe('Email address'),
  comment: z.string().optional().describe('Comment'),
  groups: z.string().optional().describe('Comma-separated group list'),
});

const DeleteUserSchema = z.object({
  userid: z.string().describe('User ID (username@realm)'),
});

// Group Management Schemas
const ListGroupsSchema = z.object({});

const CreateGroupSchema = z.object({
  groupid: z.string().describe('Group ID'),
  comment: z.string().optional().describe('Comment'),
});

const UpdateGroupSchema = z.object({
  groupid: z.string().describe('Group ID'),
  comment: z.string().optional().describe('Comment'),
});

const DeleteGroupSchema = z.object({
  groupid: z.string().describe('Group ID'),
});

// Pool Management Schemas
const ListPoolsSchema = z.object({});

const CreatePoolSchema = z.object({
  poolid: z.string().describe('Pool ID'),
  comment: z.string().optional().describe('Comment'),
});

const UpdatePoolSchema = z.object({
  poolid: z.string().describe('Pool ID'),
  comment: z.string().optional().describe('Comment'),
  vms: z.string().optional().describe('Comma-separated VM list'),
  storage: z.string().optional().describe('Comma-separated storage list'),
});

const DeletePoolSchema = z.object({
  poolid: z.string().describe('Pool ID'),
});

// HA Management Schemas
const ListHAResourcesSchema = z.object({
  type: z.enum(['vm', 'ct']).optional().describe('Resource type filter'),
});

const CreateHAResourceSchema = z.object({
  sid: z.string().describe('Resource ID (e.g., vm:100)'),
  group: z.string().optional().describe('HA group'),
  max_relocate: z.number().optional().describe('Max relocate attempts'),
  max_restart: z.number().optional().describe('Max restart attempts'),
  state: z.enum(['started', 'stopped', 'enabled', 'disabled']).optional(),
  comment: z.string().optional().describe('Comment'),
});

const UpdateHAResourceSchema = z.object({
  sid: z.string().describe('Resource ID (e.g., vm:100)'),
  group: z.string().optional().describe('HA group'),
  max_relocate: z.number().optional().describe('Max relocate attempts'),
  max_restart: z.number().optional().describe('Max restart attempts'),
  state: z.enum(['started', 'stopped', 'enabled', 'disabled']).optional(),
  comment: z.string().optional().describe('Comment'),
});

const DeleteHAResourceSchema = z.object({
  sid: z.string().describe('Resource ID (e.g., vm:100)'),
});

// Monitoring Schemas
const GetClusterMetricsSchema = z.object({
  timeframe: z.enum(['hour', 'day', 'week', 'month', 'year']).optional(),
});

const GetNodeMetricsSchema = z.object({
  node: z.string().describe('Node name'),
  timeframe: z.enum(['hour', 'day', 'week', 'month', 'year']).optional(),
});

const GetVMMetricsSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  timeframe: z.enum(['hour', 'day', 'week', 'month', 'year']).optional(),
});

// Template Management Schemas
const CreateVMTemplateSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID to convert to template'),
});

const CreateContainerTemplateSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID to convert to template'),
});

// Console Access Schemas
const GetVMConsoleSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('VM ID'),
  console: z.enum(['vnc', 'spice']).optional().default('vnc'),
});

const GetContainerConsoleSchema = z.object({
  node: z.string().describe('Node name'),
  vmid: z.number().describe('Container ID'),
});

/**
 * Create an MCP server for Proxmox operations
 */
const server = new Server(
  {
    name: 'proxmox-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Proxmox client
let proxmoxClient: ProxmoxClient | null = null;

async function initializeClient() {
  try {
    const config = loadConfig();
    proxmoxClient = new ProxmoxClient(config);
    await proxmoxClient.initialize();
    console.error('Proxmox client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Proxmox client:', error);
    proxmoxClient = null;
  }
}

// Initialize on startup
initializeClient().catch(console.error);

/**
 * Ensure client is initialized
 */
function ensureClient(): ProxmoxClient {
  if (!proxmoxClient) {
    throw new Error('Proxmox client not initialized. Check configuration.');
  }
  return proxmoxClient;
}

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Cluster and Node Management
      {
        name: 'get_cluster_status',
        description: 'Get Proxmox cluster status and health information',
        inputSchema: zodToJsonSchema(GetClusterStatusSchema),
      },
      {
        name: 'list_nodes',
        description: 'List all nodes in the Proxmox cluster',
        inputSchema: zodToJsonSchema(GetNodesSchema),
      },
      {
        name: 'get_node_status',
        description: 'Get detailed status information for a specific node',
        inputSchema: zodToJsonSchema(GetNodeStatusSchema),
      },
      {
        name: 'get_version',
        description: 'Get Proxmox VE version information',
        inputSchema: zodToJsonSchema(GetVersionSchema),
      },
      // VM Management
      {
        name: 'list_vms',
        description: 'List all virtual machines on a node',
        inputSchema: zodToJsonSchema(ListVMsSchema),
      },
      {
        name: 'get_vm_status',
        description: 'Get current status of a virtual machine',
        inputSchema: zodToJsonSchema(GetVMStatusSchema),
      },
      {
        name: 'get_vm_config',
        description: 'Get configuration of a virtual machine',
        inputSchema: zodToJsonSchema(GetVMConfigSchema),
      },
      {
        name: 'start_vm',
        description: 'Start a virtual machine',
        inputSchema: zodToJsonSchema(StartVMSchema),
      },
      {
        name: 'stop_vm',
        description: 'Stop a virtual machine',
        inputSchema: zodToJsonSchema(StopVMSchema),
      },
      {
        name: 'reboot_vm',
        description: 'Reboot a virtual machine',
        inputSchema: zodToJsonSchema(RebootVMSchema),
      },
      {
        name: 'shutdown_vm',
        description: 'Gracefully shutdown a virtual machine',
        inputSchema: zodToJsonSchema(ShutdownVMSchema),
      },
      {
        name: 'create_vm',
        description: 'Create a new virtual machine',
        inputSchema: zodToJsonSchema(CreateVMSchema),
      },
      {
        name: 'clone_vm',
        description: 'Clone an existing virtual machine',
        inputSchema: zodToJsonSchema(CloneVMSchema),
      },
      {
        name: 'delete_vm',
        description: 'Delete a virtual machine',
        inputSchema: zodToJsonSchema(DeleteVMSchema),
      },
      {
        name: 'migrate_vm',
        description: 'Migrate a VM to another node',
        inputSchema: zodToJsonSchema(MigrateVMSchema),
      },
      // Container Management
      {
        name: 'list_containers',
        description: 'List all LXC containers on a node',
        inputSchema: zodToJsonSchema(ListContainersSchema),
      },
      {
        name: 'get_container_status',
        description: 'Get current status of a container',
        inputSchema: zodToJsonSchema(GetContainerStatusSchema),
      },
      {
        name: 'get_container_config',
        description: 'Get configuration of a container',
        inputSchema: zodToJsonSchema(GetContainerConfigSchema),
      },
      {
        name: 'start_container',
        description: 'Start a container',
        inputSchema: zodToJsonSchema(StartContainerSchema),
      },
      {
        name: 'stop_container',
        description: 'Stop a container',
        inputSchema: zodToJsonSchema(StopContainerSchema),
      },
      {
        name: 'create_container',
        description: 'Create a new LXC container',
        inputSchema: zodToJsonSchema(CreateContainerSchema),
      },
      {
        name: 'migrate_container',
        description: 'Migrate a container to another node',
        inputSchema: zodToJsonSchema(MigrateContainerSchema),
      },
      {
        name: 'shutdown_container',
        description: 'Gracefully shutdown a container',
        inputSchema: zodToJsonSchema(ShutdownContainerSchema),
      },
      {
        name: 'reboot_container',
        description: 'Reboot a container',
        inputSchema: zodToJsonSchema(RebootContainerSchema),
      },
      {
        name: 'clone_container',
        description: 'Clone an LXC container',
        inputSchema: zodToJsonSchema(CloneContainerSchema),
      },
      {
        name: 'delete_container',
        description: 'Delete an LXC container',
        inputSchema: zodToJsonSchema(DeleteContainerSchema),
      },
      {
        name: 'resize_container',
        description: 'Resize container disk',
        inputSchema: zodToJsonSchema(ResizeContainerSchema),
      },
      {
        name: 'snapshot_container',
        description: 'Create container snapshot',
        inputSchema: zodToJsonSchema(SnapshotContainerSchema),
      },
      {
        name: 'delete_container_snapshot',
        description: 'Delete container snapshot',
        inputSchema: zodToJsonSchema(DeleteContainerSnapshotSchema),
      },
      {
        name: 'restore_container_snapshot',
        description: 'Restore container from snapshot',
        inputSchema: zodToJsonSchema(RestoreContainerSnapshotSchema),
      },
      {
        name: 'list_container_snapshots',
        description: 'List container snapshots',
        inputSchema: zodToJsonSchema(ListContainerSnapshotsSchema),
      },
      // Storage Management
      {
        name: 'list_storage',
        description: 'List available storage locations',
        inputSchema: zodToJsonSchema(ListStorageSchema),
      },
      {
        name: 'get_storage_content',
        description: 'List content of a storage location',
        inputSchema: zodToJsonSchema(GetStorageContentSchema),
      },
      {
        name: 'upload_file',
        description: 'Upload ISO, template, or backup file to storage',
        inputSchema: zodToJsonSchema(UploadFileSchema),
      },
      // Backup Management
      {
        name: 'create_backup',
        description: 'Create a backup of a VM or container',
        inputSchema: zodToJsonSchema(CreateBackupSchema),
      },
      {
        name: 'list_backups',
        description: 'List available backups',
        inputSchema: zodToJsonSchema(ListBackupsSchema),
      },
      {
        name: 'restore_backup',
        description: 'Restore a VM or container from backup',
        inputSchema: zodToJsonSchema(RestoreBackupSchema),
      },
      // Task Management
      {
        name: 'get_task_status',
        description: 'Get status of a running task',
        inputSchema: zodToJsonSchema(GetTaskStatusSchema),
      },
      {
        name: 'list_tasks',
        description: 'List recent tasks',
        inputSchema: zodToJsonSchema(ListTasksSchema),
      },
      // VM Snapshot Management
      {
        name: 'create_vm_snapshot',
        description: 'Create a snapshot of a virtual machine',
        inputSchema: zodToJsonSchema(CreateVMSnapshotSchema),
      },
      {
        name: 'delete_vm_snapshot',
        description: 'Delete a VM snapshot',
        inputSchema: zodToJsonSchema(DeleteVMSnapshotSchema),
      },
      {
        name: 'restore_vm_snapshot',
        description: 'Restore VM from snapshot',
        inputSchema: zodToJsonSchema(RestoreVMSnapshotSchema),
      },
      {
        name: 'list_vm_snapshots',
        description: 'List VM snapshots',
        inputSchema: zodToJsonSchema(ListVMSnapshotsSchema),
      },
      // VM Configuration Management
      {
        name: 'update_vm_config',
        description: 'Update VM configuration',
        inputSchema: zodToJsonSchema(UpdateVMConfigSchema),
      },
      {
        name: 'resize_vm_disk',
        description: 'Resize a VM disk',
        inputSchema: zodToJsonSchema(ResizeVMDiskSchema),
      },
      // Network Management
      {
        name: 'list_networks',
        description: 'List network interfaces on a node',
        inputSchema: zodToJsonSchema(ListNetworksSchema),
      },
      {
        name: 'get_network_config',
        description: 'Get network interface configuration',
        inputSchema: zodToJsonSchema(GetNetworkConfigSchema),
      },
      {
        name: 'create_network_bridge',
        description: 'Create a network bridge',
        inputSchema: zodToJsonSchema(CreateNetworkBridgeSchema),
      },
      {
        name: 'update_network_config',
        description: 'Update network interface configuration',
        inputSchema: zodToJsonSchema(UpdateNetworkConfigSchema),
      },
      {
        name: 'delete_network_config',
        description: 'Delete network interface configuration',
        inputSchema: zodToJsonSchema(DeleteNetworkConfigSchema),
      },
      // Firewall Management
      {
        name: 'get_firewall_status',
        description: 'Get firewall status',
        inputSchema: zodToJsonSchema(GetFirewallStatusSchema),
      },
      {
        name: 'update_firewall_status',
        description: 'Enable or disable firewall',
        inputSchema: zodToJsonSchema(UpdateFirewallStatusSchema),
      },
      {
        name: 'list_firewall_rules',
        description: 'List firewall rules',
        inputSchema: zodToJsonSchema(ListFirewallRulesSchema),
      },
      {
        name: 'create_firewall_rule',
        description: 'Create a firewall rule',
        inputSchema: zodToJsonSchema(CreateFirewallRuleSchema),
      },
      {
        name: 'update_firewall_rule',
        description: 'Update a firewall rule',
        inputSchema: zodToJsonSchema(UpdateFirewallRuleSchema),
      },
      {
        name: 'delete_firewall_rule',
        description: 'Delete a firewall rule',
        inputSchema: zodToJsonSchema(DeleteFirewallRuleSchema),
      },
      // User Management
      {
        name: 'list_users',
        description: 'List users',
        inputSchema: zodToJsonSchema(ListUsersSchema),
      },
      {
        name: 'create_user',
        description: 'Create a new user',
        inputSchema: zodToJsonSchema(CreateUserSchema),
      },
      {
        name: 'update_user',
        description: 'Update user information',
        inputSchema: zodToJsonSchema(UpdateUserSchema),
      },
      {
        name: 'delete_user',
        description: 'Delete a user',
        inputSchema: zodToJsonSchema(DeleteUserSchema),
      },
      // Group Management
      {
        name: 'list_groups',
        description: 'List groups',
        inputSchema: zodToJsonSchema(ListGroupsSchema),
      },
      {
        name: 'create_group',
        description: 'Create a new group',
        inputSchema: zodToJsonSchema(CreateGroupSchema),
      },
      {
        name: 'update_group',
        description: 'Update group information',
        inputSchema: zodToJsonSchema(UpdateGroupSchema),
      },
      {
        name: 'delete_group',
        description: 'Delete a group',
        inputSchema: zodToJsonSchema(DeleteGroupSchema),
      },
      // Pool Management
      {
        name: 'list_pools',
        description: 'List resource pools',
        inputSchema: zodToJsonSchema(ListPoolsSchema),
      },
      {
        name: 'create_pool',
        description: 'Create a resource pool',
        inputSchema: zodToJsonSchema(CreatePoolSchema),
      },
      {
        name: 'update_pool',
        description: 'Update pool configuration',
        inputSchema: zodToJsonSchema(UpdatePoolSchema),
      },
      {
        name: 'delete_pool',
        description: 'Delete a resource pool',
        inputSchema: zodToJsonSchema(DeletePoolSchema),
      },
      // HA Management
      {
        name: 'list_ha_resources',
        description: 'List HA resources',
        inputSchema: zodToJsonSchema(ListHAResourcesSchema),
      },
      {
        name: 'create_ha_resource',
        description: 'Add a resource to HA',
        inputSchema: zodToJsonSchema(CreateHAResourceSchema),
      },
      {
        name: 'update_ha_resource',
        description: 'Update HA resource configuration',
        inputSchema: zodToJsonSchema(UpdateHAResourceSchema),
      },
      {
        name: 'delete_ha_resource',
        description: 'Remove a resource from HA',
        inputSchema: zodToJsonSchema(DeleteHAResourceSchema),
      },
      // Monitoring
      {
        name: 'get_cluster_metrics',
        description: 'Get cluster performance metrics',
        inputSchema: zodToJsonSchema(GetClusterMetricsSchema),
      },
      {
        name: 'get_node_metrics',
        description: 'Get node performance metrics',
        inputSchema: zodToJsonSchema(GetNodeMetricsSchema),
      },
      {
        name: 'get_vm_metrics',
        description: 'Get VM performance metrics',
        inputSchema: zodToJsonSchema(GetVMMetricsSchema),
      },
      // Template Management
      {
        name: 'create_vm_template',
        description: 'Convert a VM to a template',
        inputSchema: zodToJsonSchema(CreateVMTemplateSchema),
      },
      {
        name: 'create_container_template',
        description: 'Convert a container to a template',
        inputSchema: zodToJsonSchema(CreateContainerTemplateSchema),
      },
      // Console Access
      {
        name: 'get_vm_console',
        description: 'Get VM console access configuration',
        inputSchema: zodToJsonSchema(GetVMConsoleSchema),
      },
      {
        name: 'get_container_console',
        description: 'Get container console access configuration',
        inputSchema: zodToJsonSchema(GetContainerConsoleSchema),
      },
    ],
  };
});

/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const client = ensureClient();

    switch (name) {
      // Cluster and Node Management
      case 'get_cluster_status': {
        const status = await client.getClusterStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'list_nodes': {
        const nodes = await client.getNodes();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(nodes, null, 2),
            },
          ],
        };
      }

      case 'get_node_status': {
        const { node } = GetNodeStatusSchema.parse(args);
        const status = await client.getNodeStatus(node);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'get_version': {
        const version = await client.getVersion();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(version, null, 2),
            },
          ],
        };
      }

      // VM Management
      case 'list_vms': {
        const { node } = ListVMsSchema.parse(args);
        const vms = await client.getVMs(node);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(vms, null, 2),
            },
          ],
        };
      }

      case 'get_vm_status': {
        const { node, vmid } = GetVMStatusSchema.parse(args);
        const status = await client.getVMStatus(node, vmid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'get_vm_config': {
        const { node, vmid } = GetVMConfigSchema.parse(args);
        const config = await client.get(`/nodes/${node}/qemu/${vmid}/config`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      case 'start_vm': {
        const { node, vmid, timeout } = StartVMSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu/${vmid}/status/start`, { timeout });
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} start initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'stop_vm': {
        const { node, vmid, timeout, forceStop } = StopVMSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu/${vmid}/status/stop`, { 
          timeout,
          forceStop
        });
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} stop initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'reboot_vm': {
        const { node, vmid, timeout } = RebootVMSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu/${vmid}/status/reboot`, { timeout });
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} reboot initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'shutdown_vm': {
        const { node, vmid, timeout, forceStop } = ShutdownVMSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu/${vmid}/status/shutdown`, { 
          timeout,
          forceStop
        });
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} shutdown initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'create_vm': {
        const params = CreateVMSchema.parse(args);
        const { node, ...vmConfig } = params;
        const result = await client.post(`/nodes/${node}/qemu`, vmConfig);
        return {
          content: [
            {
              type: 'text',
              text: `VM creation initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'clone_vm': {
        const { node, vmid, ...cloneParams } = CloneVMSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu/${vmid}/clone`, cloneParams);
        return {
          content: [
            {
              type: 'text',
              text: `VM clone initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'delete_vm': {
        const { node, vmid, purge } = DeleteVMSchema.parse(args);
        const result = await client.delete(`/nodes/${node}/qemu/${vmid}${purge ? '?purge=1' : ''}`);
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} deletion initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'migrate_vm': {
        const { node, vmid, ...migrateParams } = MigrateVMSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu/${vmid}/migrate`, migrateParams);
        return {
          content: [
            {
              type: 'text',
              text: `VM migration initiated. Task: ${result}`,
            },
          ],
        };
      }

      // Container Management
      case 'list_containers': {
        const { node } = ListContainersSchema.parse(args);
        const containers = await client.getContainers(node);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(containers, null, 2),
            },
          ],
        };
      }

      case 'get_container_status': {
        const { node, vmid } = GetContainerStatusSchema.parse(args);
        const status = await client.getContainerStatus(node, vmid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'get_container_config': {
        const { node, vmid } = GetContainerConfigSchema.parse(args);
        const config = await client.get(`/nodes/${node}/lxc/${vmid}/config`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      case 'start_container': {
        const { node, vmid } = StartContainerSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc/${vmid}/status/start`);
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} start initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'stop_container': {
        const { node, vmid } = StopContainerSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc/${vmid}/status/stop`);
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} stop initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'create_container': {
        const { node, ...containerConfig } = CreateContainerSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc`, containerConfig);
        return {
          content: [
            {
              type: 'text',
              text: `Container creation initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'migrate_container': {
        const { node, vmid, ...migrateParams } = MigrateContainerSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc/${vmid}/migrate`, migrateParams);
        return {
          content: [
            {
              type: 'text',
              text: `Container migration initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'shutdown_container': {
        const { node, vmid, timeout, forceStop } = ShutdownContainerSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc/${vmid}/status/shutdown`, {
          timeout,
          forceStop
        });
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} shutdown initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'reboot_container': {
        const { node, vmid, timeout } = RebootContainerSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc/${vmid}/status/reboot`, { timeout });
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} reboot initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'clone_container': {
        const { node, vmid, ...cloneParams } = CloneContainerSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc/${vmid}/clone`, cloneParams);
        return {
          content: [
            {
              type: 'text',
              text: `Container clone initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'delete_container': {
        const { node, vmid, purge, destroyUnreferencedDisks } = DeleteContainerSchema.parse(args);
        const params = new URLSearchParams();
        if (purge) params.append('purge', '1');
        if (destroyUnreferencedDisks) params.append('destroy-unreferenced-disks', '1');
        const queryString = params.toString();
        const result = await client.delete(`/nodes/${node}/lxc/${vmid}${queryString ? '?' + queryString : ''}`);
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} deletion initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'resize_container': {
        const { node, vmid, disk, size } = ResizeContainerSchema.parse(args);
        const result = await client.put(`/nodes/${node}/lxc/${vmid}/resize`, {
          disk,
          size
        });
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} resize initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'snapshot_container': {
        const { node, vmid, snapname, description } = SnapshotContainerSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc/${vmid}/snapshot`, {
          snapname,
          description
        });
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} snapshot '${snapname}' created. Task: ${result}`,
            },
          ],
        };
      }

      case 'delete_container_snapshot': {
        const { node, vmid, snapname } = DeleteContainerSnapshotSchema.parse(args);
        const result = await client.delete(`/nodes/${node}/lxc/${vmid}/snapshot/${snapname}`);
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} snapshot '${snapname}' deleted. Task: ${result}`,
            },
          ],
        };
      }

      case 'restore_container_snapshot': {
        const { node, vmid, snapname } = RestoreContainerSnapshotSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc/${vmid}/snapshot/${snapname}/rollback`);
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} restored from snapshot '${snapname}'. Task: ${result}`,
            },
          ],
        };
      }

      case 'list_container_snapshots': {
        const { node, vmid } = ListContainerSnapshotsSchema.parse(args);
        const snapshots = await client.get(`/nodes/${node}/lxc/${vmid}/snapshot`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(snapshots, null, 2),
            },
          ],
        };
      }

      // Storage Management
      case 'list_storage': {
        const { node } = ListStorageSchema.parse(args);
        const storage = await client.getStorage(node);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(storage, null, 2),
            },
          ],
        };
      }

      case 'get_storage_content': {
        const { node, storage, content } = GetStorageContentSchema.parse(args);
        const params = content ? { content } : undefined;
        const contents = await client.get(`/nodes/${node}/storage/${storage}/content`, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(contents, null, 2),
            },
          ],
        };
      }

      case 'upload_file': {
        const { node, storage, filename, content, contentType } = UploadFileSchema.parse(args);
        // Note: File upload requires multipart form data, simplified here
        const result = await client.post(`/nodes/${node}/storage/${storage}/upload`, {
          filename,
          content,
          'content-type': contentType
        });
        return {
          content: [
            {
              type: 'text',
              text: `File upload initiated. Task: ${result}`,
            },
          ],
        };
      }

      // Backup Management
      case 'create_backup': {
        const { node, vmid, ...backupParams } = CreateBackupSchema.parse(args);
        const result = await client.post(`/nodes/${node}/vzdump`, {
          vmid,
          ...backupParams
        });
        return {
          content: [
            {
              type: 'text',
              text: `Backup initiated. Task: ${result}`,
            },
          ],
        };
      }

      case 'list_backups': {
        const { node, storage, vmid } = ListBackupsSchema.parse(args);
        const params = { content: 'backup' };
        if (vmid) (params as any).vmid = vmid;
        const backups = await client.get(`/nodes/${node}/storage/${storage}/content`, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(backups, null, 2),
            },
          ],
        };
      }

      case 'restore_backup': {
        const { node, storage, volid, vmid, force } = RestoreBackupSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu`, {
          vmid,
          archive: `${storage}:${volid}`,
          force
        });
        return {
          content: [
            {
              type: 'text',
              text: `Restore initiated. Task: ${result}`,
            },
          ],
        };
      }

      // Task Management
      case 'get_task_status': {
        const { node, upid } = GetTaskStatusSchema.parse(args);
        const status = await client.get(`/nodes/${node}/tasks/${upid}/status`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'list_tasks': {
        const { node, vmid, limit } = ListTasksSchema.parse(args);
        const params: any = {};
        if (vmid) params.vmid = vmid;
        if (limit) params.limit = limit;
        const tasks = await client.get(`/nodes/${node}/tasks`, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      }

      // VM Snapshot Management
      case 'create_vm_snapshot': {
        const { node, vmid, snapname, description, vmstate } = CreateVMSnapshotSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu/${vmid}/snapshot`, {
          snapname,
          description,
          vmstate
        });
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} snapshot '${snapname}' created. Task: ${result}`,
            },
          ],
        };
      }

      case 'delete_vm_snapshot': {
        const { node, vmid, snapname } = DeleteVMSnapshotSchema.parse(args);
        const result = await client.delete(`/nodes/${node}/qemu/${vmid}/snapshot/${snapname}`);
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} snapshot '${snapname}' deleted. Task: ${result}`,
            },
          ],
        };
      }

      case 'restore_vm_snapshot': {
        const { node, vmid, snapname } = RestoreVMSnapshotSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu/${vmid}/snapshot/${snapname}/rollback`);
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} restored from snapshot '${snapname}'. Task: ${result}`,
            },
          ],
        };
      }

      case 'list_vm_snapshots': {
        const { node, vmid } = ListVMSnapshotsSchema.parse(args);
        const snapshots = await client.get(`/nodes/${node}/qemu/${vmid}/snapshot`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(snapshots, null, 2),
            },
          ],
        };
      }

      // VM Configuration Management
      case 'update_vm_config': {
        const { node, vmid, config, ...updateParams } = UpdateVMConfigSchema.parse(args);
        const params = { ...updateParams, ...config };
        const result = await client.put(`/nodes/${node}/qemu/${vmid}/config`, params);
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} configuration updated successfully`,
            },
          ],
        };
      }

      case 'resize_vm_disk': {
        const { node, vmid, disk, size } = ResizeVMDiskSchema.parse(args);
        const result = await client.put(`/nodes/${node}/qemu/${vmid}/resize`, {
          disk,
          size
        });
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} disk ${disk} resized. Task: ${result}`,
            },
          ],
        };
      }

      // Network Management
      case 'list_networks': {
        const { node, type } = ListNetworksSchema.parse(args);
        const params = type ? { type } : undefined;
        const networks = await client.get(`/nodes/${node}/network`, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(networks, null, 2),
            },
          ],
        };
      }

      case 'get_network_config': {
        const { node, iface } = GetNetworkConfigSchema.parse(args);
        const config = await client.get(`/nodes/${node}/network/${iface}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      case 'create_network_bridge': {
        const { node, ...bridgeConfig } = CreateNetworkBridgeSchema.parse(args);
        const result = await client.post(`/nodes/${node}/network`, bridgeConfig);
        return {
          content: [
            {
              type: 'text',
              text: `Network bridge created successfully`,
            },
          ],
        };
      }

      case 'update_network_config': {
        const { node, iface, ...updateParams } = UpdateNetworkConfigSchema.parse(args);
        const result = await client.put(`/nodes/${node}/network/${iface}`, updateParams);
        return {
          content: [
            {
              type: 'text',
              text: `Network interface ${iface} updated successfully`,
            },
          ],
        };
      }

      case 'delete_network_config': {
        const { node, iface } = DeleteNetworkConfigSchema.parse(args);
        const result = await client.delete(`/nodes/${node}/network/${iface}`);
        return {
          content: [
            {
              type: 'text',
              text: `Network interface ${iface} deleted successfully`,
            },
          ],
        };
      }

      // Firewall Management
      case 'get_firewall_status': {
        const { node } = GetFirewallStatusSchema.parse(args);
        const endpoint = node ? `/nodes/${node}/firewall/options` : '/cluster/firewall/options';
        const status = await client.get(endpoint);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'update_firewall_status': {
        const { node, enable } = UpdateFirewallStatusSchema.parse(args);
        const endpoint = node ? `/nodes/${node}/firewall/options` : '/cluster/firewall/options';
        const result = await client.put(endpoint, { enable });
        return {
          content: [
            {
              type: 'text',
              text: `Firewall ${enable ? 'enabled' : 'disabled'} successfully`,
            },
          ],
        };
      }

      case 'list_firewall_rules': {
        const { node, vmid } = ListFirewallRulesSchema.parse(args);
        let endpoint = '/cluster/firewall/rules';
        if (node && vmid) {
          endpoint = `/nodes/${node}/qemu/${vmid}/firewall/rules`;
        } else if (node) {
          endpoint = `/nodes/${node}/firewall/rules`;
        }
        const rules = await client.get(endpoint);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(rules, null, 2),
            },
          ],
        };
      }

      case 'create_firewall_rule': {
        const { node, vmid, ...ruleParams } = CreateFirewallRuleSchema.parse(args);
        let endpoint = '/cluster/firewall/rules';
        if (node && vmid) {
          endpoint = `/nodes/${node}/qemu/${vmid}/firewall/rules`;
        } else if (node) {
          endpoint = `/nodes/${node}/firewall/rules`;
        }
        const result = await client.post(endpoint, ruleParams);
        return {
          content: [
            {
              type: 'text',
              text: `Firewall rule created successfully`,
            },
          ],
        };
      }

      case 'update_firewall_rule': {
        const { node, vmid, pos, ...updateParams } = UpdateFirewallRuleSchema.parse(args);
        let endpoint = `/cluster/firewall/rules/${pos}`;
        if (node && vmid) {
          endpoint = `/nodes/${node}/qemu/${vmid}/firewall/rules/${pos}`;
        } else if (node) {
          endpoint = `/nodes/${node}/firewall/rules/${pos}`;
        }
        const result = await client.put(endpoint, updateParams);
        return {
          content: [
            {
              type: 'text',
              text: `Firewall rule updated successfully`,
            },
          ],
        };
      }

      case 'delete_firewall_rule': {
        const { node, vmid, pos } = DeleteFirewallRuleSchema.parse(args);
        let endpoint = `/cluster/firewall/rules/${pos}`;
        if (node && vmid) {
          endpoint = `/nodes/${node}/qemu/${vmid}/firewall/rules/${pos}`;
        } else if (node) {
          endpoint = `/nodes/${node}/firewall/rules/${pos}`;
        }
        const result = await client.delete(endpoint);
        return {
          content: [
            {
              type: 'text',
              text: `Firewall rule deleted successfully`,
            },
          ],
        };
      }

      // User Management
      case 'list_users': {
        const params = ListUsersSchema.parse(args);
        const users = await client.get('/access/users', params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(users, null, 2),
            },
          ],
        };
      }

      case 'create_user': {
        const userParams = CreateUserSchema.parse(args);
        const result = await client.post('/access/users', userParams);
        return {
          content: [
            {
              type: 'text',
              text: `User ${userParams.userid} created successfully`,
            },
          ],
        };
      }

      case 'update_user': {
        const { userid, ...updateParams } = UpdateUserSchema.parse(args);
        const result = await client.put(`/access/users/${userid}`, updateParams);
        return {
          content: [
            {
              type: 'text',
              text: `User ${userid} updated successfully`,
            },
          ],
        };
      }

      case 'delete_user': {
        const { userid } = DeleteUserSchema.parse(args);
        const result = await client.delete(`/access/users/${userid}`);
        return {
          content: [
            {
              type: 'text',
              text: `User ${userid} deleted successfully`,
            },
          ],
        };
      }

      // Group Management
      case 'list_groups': {
        const groups = await client.get('/access/groups');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(groups, null, 2),
            },
          ],
        };
      }

      case 'create_group': {
        const groupParams = CreateGroupSchema.parse(args);
        const result = await client.post('/access/groups', groupParams);
        return {
          content: [
            {
              type: 'text',
              text: `Group ${groupParams.groupid} created successfully`,
            },
          ],
        };
      }

      case 'update_group': {
        const { groupid, ...updateParams } = UpdateGroupSchema.parse(args);
        const result = await client.put(`/access/groups/${groupid}`, updateParams);
        return {
          content: [
            {
              type: 'text',
              text: `Group ${groupid} updated successfully`,
            },
          ],
        };
      }

      case 'delete_group': {
        const { groupid } = DeleteGroupSchema.parse(args);
        const result = await client.delete(`/access/groups/${groupid}`);
        return {
          content: [
            {
              type: 'text',
              text: `Group ${groupid} deleted successfully`,
            },
          ],
        };
      }

      // Pool Management
      case 'list_pools': {
        const pools = await client.get('/pools');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pools, null, 2),
            },
          ],
        };
      }

      case 'create_pool': {
        const poolParams = CreatePoolSchema.parse(args);
        const result = await client.post('/pools', poolParams);
        return {
          content: [
            {
              type: 'text',
              text: `Pool ${poolParams.poolid} created successfully`,
            },
          ],
        };
      }

      case 'update_pool': {
        const { poolid, ...updateParams } = UpdatePoolSchema.parse(args);
        const result = await client.put(`/pools/${poolid}`, updateParams);
        return {
          content: [
            {
              type: 'text',
              text: `Pool ${poolid} updated successfully`,
            },
          ],
        };
      }

      case 'delete_pool': {
        const { poolid } = DeletePoolSchema.parse(args);
        const result = await client.delete(`/pools/${poolid}`);
        return {
          content: [
            {
              type: 'text',
              text: `Pool ${poolid} deleted successfully`,
            },
          ],
        };
      }

      // HA Management
      case 'list_ha_resources': {
        const { type } = ListHAResourcesSchema.parse(args);
        const params = type ? { type } : undefined;
        const resources = await client.get('/cluster/ha/resources', params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(resources, null, 2),
            },
          ],
        };
      }

      case 'create_ha_resource': {
        const resourceParams = CreateHAResourceSchema.parse(args);
        const result = await client.post('/cluster/ha/resources', resourceParams);
        return {
          content: [
            {
              type: 'text',
              text: `HA resource ${resourceParams.sid} created successfully`,
            },
          ],
        };
      }

      case 'update_ha_resource': {
        const { sid, ...updateParams } = UpdateHAResourceSchema.parse(args);
        const result = await client.put(`/cluster/ha/resources/${sid}`, updateParams);
        return {
          content: [
            {
              type: 'text',
              text: `HA resource ${sid} updated successfully`,
            },
          ],
        };
      }

      case 'delete_ha_resource': {
        const { sid } = DeleteHAResourceSchema.parse(args);
        const result = await client.delete(`/cluster/ha/resources/${sid}`);
        return {
          content: [
            {
              type: 'text',
              text: `HA resource ${sid} removed successfully`,
            },
          ],
        };
      }

      // Monitoring
      case 'get_cluster_metrics': {
        const { timeframe } = GetClusterMetricsSchema.parse(args);
        const params = timeframe ? { timeframe } : undefined;
        const metrics = await client.get('/cluster/metrics', params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metrics, null, 2),
            },
          ],
        };
      }

      case 'get_node_metrics': {
        const { node, timeframe } = GetNodeMetricsSchema.parse(args);
        const params = timeframe ? { timeframe } : undefined;
        const metrics = await client.get(`/nodes/${node}/rrddata`, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metrics, null, 2),
            },
          ],
        };
      }

      case 'get_vm_metrics': {
        const { node, vmid, timeframe } = GetVMMetricsSchema.parse(args);
        const params = timeframe ? { timeframe } : undefined;
        const metrics = await client.get(`/nodes/${node}/qemu/${vmid}/rrddata`, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metrics, null, 2),
            },
          ],
        };
      }

      // Template Management
      case 'create_vm_template': {
        const { node, vmid } = CreateVMTemplateSchema.parse(args);
        const result = await client.post(`/nodes/${node}/qemu/${vmid}/template`);
        return {
          content: [
            {
              type: 'text',
              text: `VM ${vmid} converted to template successfully`,
            },
          ],
        };
      }

      case 'create_container_template': {
        const { node, vmid } = CreateContainerTemplateSchema.parse(args);
        const result = await client.post(`/nodes/${node}/lxc/${vmid}/template`);
        return {
          content: [
            {
              type: 'text',
              text: `Container ${vmid} converted to template successfully`,
            },
          ],
        };
      }

      // Console Access
      case 'get_vm_console': {
        const { node, vmid, console } = GetVMConsoleSchema.parse(args);
        const endpoint = console === 'spice' ? 
          `/nodes/${node}/qemu/${vmid}/spiceproxy` : 
          `/nodes/${node}/qemu/${vmid}/vncproxy`;
        const config = await client.post(endpoint);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      case 'get_container_console': {
        const { node, vmid } = GetContainerConsoleSchema.parse(args);
        const config = await client.post(`/nodes/${node}/lxc/${vmid}/vncproxy`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error executing ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Proxmox MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});