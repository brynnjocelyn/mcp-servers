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