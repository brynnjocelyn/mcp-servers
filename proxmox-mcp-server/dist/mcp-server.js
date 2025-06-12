#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const zod_1 = require("zod");
const zod_to_json_schema_1 = require("zod-to-json-schema");
const config_loader_js_1 = require("./config-loader.js");
const proxmox_client_js_1 = require("./proxmox-client.js");
// Tool parameter schemas
const GetClusterStatusSchema = zod_1.z.object({});
const GetNodesSchema = zod_1.z.object({});
const GetNodeStatusSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
});
const GetVersionSchema = zod_1.z.object({});
// VM Management Schemas
const ListVMsSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
});
const GetVMStatusSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
});
const GetVMConfigSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
});
const StartVMSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    timeout: zod_1.z.number().optional().describe('Timeout in seconds'),
});
const StopVMSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    timeout: zod_1.z.number().optional().describe('Timeout in seconds'),
    forceStop: zod_1.z.boolean().optional().describe('Force stop the VM'),
});
const RebootVMSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    timeout: zod_1.z.number().optional().describe('Timeout in seconds'),
});
const ShutdownVMSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    timeout: zod_1.z.number().optional().describe('Timeout in seconds'),
    forceStop: zod_1.z.boolean().optional().describe('Force stop after timeout'),
});
const CreateVMSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().optional().describe('VM ID (auto-generate if not provided)'),
    name: zod_1.z.string().optional().describe('VM name'),
    memory: zod_1.z.number().optional().default(2048).describe('Memory in MB'),
    cores: zod_1.z.number().optional().default(1).describe('Number of CPU cores'),
    sockets: zod_1.z.number().optional().default(1).describe('Number of CPU sockets'),
    ostype: zod_1.z.string().optional().default('l26').describe('OS type'),
    iso: zod_1.z.string().optional().describe('ISO image path'),
    storage: zod_1.z.string().optional().describe('Storage for VM disk'),
    diskSize: zod_1.z.string().optional().default('32G').describe('Disk size (e.g., 32G)'),
});
const CloneVMSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Source VM ID'),
    newid: zod_1.z.number().describe('New VM ID'),
    name: zod_1.z.string().optional().describe('New VM name'),
    full: zod_1.z.boolean().optional().default(true).describe('Full clone (not linked)'),
    storage: zod_1.z.string().optional().describe('Target storage'),
});
const DeleteVMSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    purge: zod_1.z.boolean().optional().describe('Remove from backup jobs and HA'),
});
const MigrateVMSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Source node'),
    vmid: zod_1.z.number().describe('VM ID'),
    target: zod_1.z.string().describe('Target node'),
    online: zod_1.z.boolean().optional().describe('Online migration'),
});
// Container Management Schemas
const ListContainersSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
});
const GetContainerStatusSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
});
const GetContainerConfigSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
});
const StartContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
});
const StopContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
});
const CreateContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().optional().describe('Container ID'),
    ostemplate: zod_1.z.string().describe('OS template'),
    hostname: zod_1.z.string().optional().describe('Container hostname'),
    memory: zod_1.z.number().optional().default(512).describe('Memory in MB'),
    storage: zod_1.z.string().describe('Storage location'),
    password: zod_1.z.string().optional().describe('Root password'),
    ssh_public_keys: zod_1.z.string().optional().describe('SSH public keys'),
});
const MigrateContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Source node'),
    vmid: zod_1.z.number().describe('Container ID'),
    target: zod_1.z.string().describe('Target node'),
    restart: zod_1.z.boolean().optional().describe('Restart container after migration'),
    timeout: zod_1.z.number().optional().describe('Timeout in seconds'),
});
const ShutdownContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
    timeout: zod_1.z.number().optional().describe('Timeout in seconds'),
    forceStop: zod_1.z.boolean().optional().describe('Force stop after timeout'),
});
const RebootContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
    timeout: zod_1.z.number().optional().describe('Timeout in seconds'),
});
const CloneContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Source container ID'),
    newid: zod_1.z.number().describe('New container ID'),
    hostname: zod_1.z.string().optional().describe('New container hostname'),
    full: zod_1.z.boolean().optional().default(true).describe('Full clone (not linked)'),
    storage: zod_1.z.string().optional().describe('Target storage'),
});
const DeleteContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
    purge: zod_1.z.boolean().optional().describe('Remove from backup jobs and HA'),
    destroyUnreferencedDisks: zod_1.z.boolean().optional().describe('Destroy unreferenced disks'),
});
const ResizeContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
    disk: zod_1.z.string().describe('Disk to resize (e.g., rootfs)'),
    size: zod_1.z.string().describe('New size (e.g., +2G or 32G)'),
});
const SnapshotContainerSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
    snapname: zod_1.z.string().describe('Snapshot name'),
    description: zod_1.z.string().optional().describe('Snapshot description'),
});
const DeleteContainerSnapshotSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
    snapname: zod_1.z.string().describe('Snapshot name'),
});
const RestoreContainerSnapshotSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
    snapname: zod_1.z.string().describe('Snapshot name'),
});
const ListContainerSnapshotsSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
});
// Storage Management Schemas
const ListStorageSchema = zod_1.z.object({
    node: zod_1.z.string().optional().describe('Node name (optional)'),
});
const GetStorageContentSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    storage: zod_1.z.string().describe('Storage ID'),
    content: zod_1.z.string().optional().describe('Content type filter'),
});
const UploadFileSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    storage: zod_1.z.string().describe('Storage ID'),
    filename: zod_1.z.string().describe('File name'),
    content: zod_1.z.string().describe('File content (base64 for binary)'),
    contentType: zod_1.z.enum(['iso', 'vztmpl', 'backup']).describe('Content type'),
});
// Backup Management Schemas
const CreateBackupSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM/Container ID'),
    storage: zod_1.z.string().describe('Backup storage'),
    mode: zod_1.z.enum(['snapshot', 'suspend', 'stop']).optional().default('snapshot'),
    compress: zod_1.z.enum(['0', 'gzip', 'lzo', 'zstd']).optional().default('zstd'),
    notes: zod_1.z.string().optional().describe('Backup notes'),
});
const ListBackupsSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    storage: zod_1.z.string().describe('Storage ID'),
    vmid: zod_1.z.number().optional().describe('Filter by VM ID'),
});
const RestoreBackupSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    storage: zod_1.z.string().describe('Storage ID'),
    volid: zod_1.z.string().describe('Backup volume ID'),
    vmid: zod_1.z.number().describe('Target VM ID'),
    force: zod_1.z.boolean().optional().describe('Force overwrite existing VM'),
});
// Task Management Schemas
const GetTaskStatusSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    upid: zod_1.z.string().describe('Task ID (UPID)'),
});
const ListTasksSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().optional().describe('Filter by VM ID'),
    limit: zod_1.z.number().optional().describe('Limit results'),
});
// VM Snapshot Schemas
const CreateVMSnapshotSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    snapname: zod_1.z.string().describe('Snapshot name'),
    description: zod_1.z.string().optional().describe('Snapshot description'),
    vmstate: zod_1.z.boolean().optional().describe('Include VM state'),
});
const DeleteVMSnapshotSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    snapname: zod_1.z.string().describe('Snapshot name'),
});
const RestoreVMSnapshotSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    snapname: zod_1.z.string().describe('Snapshot name'),
});
const ListVMSnapshotsSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
});
// VM Configuration Update Schemas
const UpdateVMConfigSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    cores: zod_1.z.number().optional().describe('Number of CPU cores'),
    memory: zod_1.z.number().optional().describe('Memory in MB'),
    name: zod_1.z.string().optional().describe('VM name'),
    description: zod_1.z.string().optional().describe('VM description'),
    onboot: zod_1.z.boolean().optional().describe('Start on boot'),
    config: zod_1.z.record(zod_1.z.any()).optional().describe('Additional config options'),
});
const ResizeVMDiskSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    disk: zod_1.z.string().describe('Disk identifier (e.g., scsi0)'),
    size: zod_1.z.string().describe('New size (e.g., +2G or 32G)'),
});
// Network Management Schemas
const ListNetworksSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    type: zod_1.z.enum(['bridge', 'bond', 'vlan', 'alias']).optional().describe('Network type filter'),
});
const GetNetworkConfigSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    iface: zod_1.z.string().describe('Network interface name'),
});
const CreateNetworkBridgeSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    iface: zod_1.z.string().describe('Bridge name'),
    type: zod_1.z.literal('bridge').default('bridge'),
    autostart: zod_1.z.boolean().optional().default(true),
    bridge_ports: zod_1.z.string().optional().describe('Bridge ports'),
    comments: zod_1.z.string().optional().describe('Comments'),
});
const UpdateNetworkConfigSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    iface: zod_1.z.string().describe('Interface name'),
    autostart: zod_1.z.boolean().optional().describe('Auto start'),
    bridge_ports: zod_1.z.string().optional().describe('Bridge ports'),
    comments: zod_1.z.string().optional().describe('Comments'),
});
const DeleteNetworkConfigSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    iface: zod_1.z.string().describe('Interface name'),
});
// Firewall Management Schemas
const GetFirewallStatusSchema = zod_1.z.object({
    node: zod_1.z.string().optional().describe('Node name (cluster-wide if omitted)'),
});
const UpdateFirewallStatusSchema = zod_1.z.object({
    node: zod_1.z.string().optional().describe('Node name (cluster-wide if omitted)'),
    enable: zod_1.z.boolean().describe('Enable or disable firewall'),
});
const ListFirewallRulesSchema = zod_1.z.object({
    node: zod_1.z.string().optional().describe('Node name'),
    vmid: zod_1.z.number().optional().describe('VM ID'),
});
const CreateFirewallRuleSchema = zod_1.z.object({
    node: zod_1.z.string().optional().describe('Node name'),
    vmid: zod_1.z.number().optional().describe('VM ID'),
    action: zod_1.z.enum(['ACCEPT', 'DROP', 'REJECT']).describe('Rule action'),
    type: zod_1.z.enum(['in', 'out', 'group']).describe('Rule type'),
    enable: zod_1.z.boolean().optional().default(true),
    source: zod_1.z.string().optional().describe('Source address'),
    dest: zod_1.z.string().optional().describe('Destination address'),
    proto: zod_1.z.enum(['tcp', 'udp', 'icmp']).optional().describe('Protocol'),
    dport: zod_1.z.string().optional().describe('Destination port'),
    sport: zod_1.z.string().optional().describe('Source port'),
    comment: zod_1.z.string().optional().describe('Comment'),
});
const UpdateFirewallRuleSchema = zod_1.z.object({
    node: zod_1.z.string().optional().describe('Node name'),
    vmid: zod_1.z.number().optional().describe('VM ID'),
    pos: zod_1.z.number().describe('Rule position'),
    action: zod_1.z.enum(['ACCEPT', 'DROP', 'REJECT']).optional().describe('Rule action'),
    enable: zod_1.z.boolean().optional(),
    source: zod_1.z.string().optional().describe('Source address'),
    dest: zod_1.z.string().optional().describe('Destination address'),
    comment: zod_1.z.string().optional().describe('Comment'),
});
const DeleteFirewallRuleSchema = zod_1.z.object({
    node: zod_1.z.string().optional().describe('Node name'),
    vmid: zod_1.z.number().optional().describe('VM ID'),
    pos: zod_1.z.number().describe('Rule position'),
});
// User Management Schemas
const ListUsersSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().optional().describe('Filter by enabled status'),
    full: zod_1.z.boolean().optional().describe('Include full details'),
});
const CreateUserSchema = zod_1.z.object({
    userid: zod_1.z.string().describe('User ID (username@realm)'),
    password: zod_1.z.string().optional().describe('Password'),
    enable: zod_1.z.boolean().optional().default(true),
    expire: zod_1.z.number().optional().describe('Expiration date (UNIX timestamp)'),
    firstname: zod_1.z.string().optional().describe('First name'),
    lastname: zod_1.z.string().optional().describe('Last name'),
    email: zod_1.z.string().optional().describe('Email address'),
    comment: zod_1.z.string().optional().describe('Comment'),
    groups: zod_1.z.string().optional().describe('Comma-separated group list'),
});
const UpdateUserSchema = zod_1.z.object({
    userid: zod_1.z.string().describe('User ID (username@realm)'),
    enable: zod_1.z.boolean().optional(),
    expire: zod_1.z.number().optional().describe('Expiration date (UNIX timestamp)'),
    firstname: zod_1.z.string().optional().describe('First name'),
    lastname: zod_1.z.string().optional().describe('Last name'),
    email: zod_1.z.string().optional().describe('Email address'),
    comment: zod_1.z.string().optional().describe('Comment'),
    groups: zod_1.z.string().optional().describe('Comma-separated group list'),
});
const DeleteUserSchema = zod_1.z.object({
    userid: zod_1.z.string().describe('User ID (username@realm)'),
});
// Group Management Schemas
const ListGroupsSchema = zod_1.z.object({});
const CreateGroupSchema = zod_1.z.object({
    groupid: zod_1.z.string().describe('Group ID'),
    comment: zod_1.z.string().optional().describe('Comment'),
});
const UpdateGroupSchema = zod_1.z.object({
    groupid: zod_1.z.string().describe('Group ID'),
    comment: zod_1.z.string().optional().describe('Comment'),
});
const DeleteGroupSchema = zod_1.z.object({
    groupid: zod_1.z.string().describe('Group ID'),
});
// Pool Management Schemas
const ListPoolsSchema = zod_1.z.object({});
const CreatePoolSchema = zod_1.z.object({
    poolid: zod_1.z.string().describe('Pool ID'),
    comment: zod_1.z.string().optional().describe('Comment'),
});
const UpdatePoolSchema = zod_1.z.object({
    poolid: zod_1.z.string().describe('Pool ID'),
    comment: zod_1.z.string().optional().describe('Comment'),
    vms: zod_1.z.string().optional().describe('Comma-separated VM list'),
    storage: zod_1.z.string().optional().describe('Comma-separated storage list'),
});
const DeletePoolSchema = zod_1.z.object({
    poolid: zod_1.z.string().describe('Pool ID'),
});
// HA Management Schemas
const ListHAResourcesSchema = zod_1.z.object({
    type: zod_1.z.enum(['vm', 'ct']).optional().describe('Resource type filter'),
});
const CreateHAResourceSchema = zod_1.z.object({
    sid: zod_1.z.string().describe('Resource ID (e.g., vm:100)'),
    group: zod_1.z.string().optional().describe('HA group'),
    max_relocate: zod_1.z.number().optional().describe('Max relocate attempts'),
    max_restart: zod_1.z.number().optional().describe('Max restart attempts'),
    state: zod_1.z.enum(['started', 'stopped', 'enabled', 'disabled']).optional(),
    comment: zod_1.z.string().optional().describe('Comment'),
});
const UpdateHAResourceSchema = zod_1.z.object({
    sid: zod_1.z.string().describe('Resource ID (e.g., vm:100)'),
    group: zod_1.z.string().optional().describe('HA group'),
    max_relocate: zod_1.z.number().optional().describe('Max relocate attempts'),
    max_restart: zod_1.z.number().optional().describe('Max restart attempts'),
    state: zod_1.z.enum(['started', 'stopped', 'enabled', 'disabled']).optional(),
    comment: zod_1.z.string().optional().describe('Comment'),
});
const DeleteHAResourceSchema = zod_1.z.object({
    sid: zod_1.z.string().describe('Resource ID (e.g., vm:100)'),
});
// Monitoring Schemas
const GetClusterMetricsSchema = zod_1.z.object({
    timeframe: zod_1.z.enum(['hour', 'day', 'week', 'month', 'year']).optional(),
});
const GetNodeMetricsSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    timeframe: zod_1.z.enum(['hour', 'day', 'week', 'month', 'year']).optional(),
});
const GetVMMetricsSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    timeframe: zod_1.z.enum(['hour', 'day', 'week', 'month', 'year']).optional(),
});
// Template Management Schemas
const CreateVMTemplateSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID to convert to template'),
});
const CreateContainerTemplateSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID to convert to template'),
});
// Console Access Schemas
const GetVMConsoleSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('VM ID'),
    console: zod_1.z.enum(['vnc', 'spice']).optional().default('vnc'),
});
const GetContainerConsoleSchema = zod_1.z.object({
    node: zod_1.z.string().describe('Node name'),
    vmid: zod_1.z.number().describe('Container ID'),
});
/**
 * Create an MCP server for Proxmox operations
 */
const server = new index_js_1.Server({
    name: 'proxmox-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize Proxmox client
let proxmoxClient = null;
async function initializeClient() {
    try {
        const config = (0, config_loader_js_1.loadConfig)();
        proxmoxClient = new proxmox_client_js_1.ProxmoxClient(config);
        await proxmoxClient.initialize();
        console.error('Proxmox client initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize Proxmox client:', error);
        proxmoxClient = null;
    }
}
// Initialize on startup
initializeClient().catch(console.error);
/**
 * Ensure client is initialized
 */
function ensureClient() {
    if (!proxmoxClient) {
        throw new Error('Proxmox client not initialized. Check configuration.');
    }
    return proxmoxClient;
}
/**
 * Handler for listing available tools
 */
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            // Cluster and Node Management
            {
                name: 'get_cluster_status',
                description: 'Get Proxmox cluster status and health information',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetClusterStatusSchema),
            },
            {
                name: 'list_nodes',
                description: 'List all nodes in the Proxmox cluster',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetNodesSchema),
            },
            {
                name: 'get_node_status',
                description: 'Get detailed status information for a specific node',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetNodeStatusSchema),
            },
            {
                name: 'get_version',
                description: 'Get Proxmox VE version information',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetVersionSchema),
            },
            // VM Management
            {
                name: 'list_vms',
                description: 'List all virtual machines on a node',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListVMsSchema),
            },
            {
                name: 'get_vm_status',
                description: 'Get current status of a virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetVMStatusSchema),
            },
            {
                name: 'get_vm_config',
                description: 'Get configuration of a virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetVMConfigSchema),
            },
            {
                name: 'start_vm',
                description: 'Start a virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(StartVMSchema),
            },
            {
                name: 'stop_vm',
                description: 'Stop a virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(StopVMSchema),
            },
            {
                name: 'reboot_vm',
                description: 'Reboot a virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(RebootVMSchema),
            },
            {
                name: 'shutdown_vm',
                description: 'Gracefully shutdown a virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ShutdownVMSchema),
            },
            {
                name: 'create_vm',
                description: 'Create a new virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateVMSchema),
            },
            {
                name: 'clone_vm',
                description: 'Clone an existing virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CloneVMSchema),
            },
            {
                name: 'delete_vm',
                description: 'Delete a virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteVMSchema),
            },
            {
                name: 'migrate_vm',
                description: 'Migrate a VM to another node',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(MigrateVMSchema),
            },
            // Container Management
            {
                name: 'list_containers',
                description: 'List all LXC containers on a node',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListContainersSchema),
            },
            {
                name: 'get_container_status',
                description: 'Get current status of a container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetContainerStatusSchema),
            },
            {
                name: 'get_container_config',
                description: 'Get configuration of a container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetContainerConfigSchema),
            },
            {
                name: 'start_container',
                description: 'Start a container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(StartContainerSchema),
            },
            {
                name: 'stop_container',
                description: 'Stop a container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(StopContainerSchema),
            },
            {
                name: 'create_container',
                description: 'Create a new LXC container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateContainerSchema),
            },
            {
                name: 'migrate_container',
                description: 'Migrate a container to another node',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(MigrateContainerSchema),
            },
            {
                name: 'shutdown_container',
                description: 'Gracefully shutdown a container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ShutdownContainerSchema),
            },
            {
                name: 'reboot_container',
                description: 'Reboot a container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(RebootContainerSchema),
            },
            {
                name: 'clone_container',
                description: 'Clone an LXC container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CloneContainerSchema),
            },
            {
                name: 'delete_container',
                description: 'Delete an LXC container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteContainerSchema),
            },
            {
                name: 'resize_container',
                description: 'Resize container disk',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ResizeContainerSchema),
            },
            {
                name: 'snapshot_container',
                description: 'Create container snapshot',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(SnapshotContainerSchema),
            },
            {
                name: 'delete_container_snapshot',
                description: 'Delete container snapshot',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteContainerSnapshotSchema),
            },
            {
                name: 'restore_container_snapshot',
                description: 'Restore container from snapshot',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(RestoreContainerSnapshotSchema),
            },
            {
                name: 'list_container_snapshots',
                description: 'List container snapshots',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListContainerSnapshotsSchema),
            },
            // Storage Management
            {
                name: 'list_storage',
                description: 'List available storage locations',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListStorageSchema),
            },
            {
                name: 'get_storage_content',
                description: 'List content of a storage location',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetStorageContentSchema),
            },
            {
                name: 'upload_file',
                description: 'Upload ISO, template, or backup file to storage',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UploadFileSchema),
            },
            // Backup Management
            {
                name: 'create_backup',
                description: 'Create a backup of a VM or container',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateBackupSchema),
            },
            {
                name: 'list_backups',
                description: 'List available backups',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListBackupsSchema),
            },
            {
                name: 'restore_backup',
                description: 'Restore a VM or container from backup',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(RestoreBackupSchema),
            },
            // Task Management
            {
                name: 'get_task_status',
                description: 'Get status of a running task',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetTaskStatusSchema),
            },
            {
                name: 'list_tasks',
                description: 'List recent tasks',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListTasksSchema),
            },
            // VM Snapshot Management
            {
                name: 'create_vm_snapshot',
                description: 'Create a snapshot of a virtual machine',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateVMSnapshotSchema),
            },
            {
                name: 'delete_vm_snapshot',
                description: 'Delete a VM snapshot',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteVMSnapshotSchema),
            },
            {
                name: 'restore_vm_snapshot',
                description: 'Restore VM from snapshot',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(RestoreVMSnapshotSchema),
            },
            {
                name: 'list_vm_snapshots',
                description: 'List VM snapshots',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListVMSnapshotsSchema),
            },
            // VM Configuration Management
            {
                name: 'update_vm_config',
                description: 'Update VM configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateVMConfigSchema),
            },
            {
                name: 'resize_vm_disk',
                description: 'Resize a VM disk',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ResizeVMDiskSchema),
            },
            // Network Management
            {
                name: 'list_networks',
                description: 'List network interfaces on a node',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListNetworksSchema),
            },
            {
                name: 'get_network_config',
                description: 'Get network interface configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetNetworkConfigSchema),
            },
            {
                name: 'create_network_bridge',
                description: 'Create a network bridge',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateNetworkBridgeSchema),
            },
            {
                name: 'update_network_config',
                description: 'Update network interface configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateNetworkConfigSchema),
            },
            {
                name: 'delete_network_config',
                description: 'Delete network interface configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteNetworkConfigSchema),
            },
            // Firewall Management
            {
                name: 'get_firewall_status',
                description: 'Get firewall status',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetFirewallStatusSchema),
            },
            {
                name: 'update_firewall_status',
                description: 'Enable or disable firewall',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateFirewallStatusSchema),
            },
            {
                name: 'list_firewall_rules',
                description: 'List firewall rules',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListFirewallRulesSchema),
            },
            {
                name: 'create_firewall_rule',
                description: 'Create a firewall rule',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateFirewallRuleSchema),
            },
            {
                name: 'update_firewall_rule',
                description: 'Update a firewall rule',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateFirewallRuleSchema),
            },
            {
                name: 'delete_firewall_rule',
                description: 'Delete a firewall rule',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteFirewallRuleSchema),
            },
            // User Management
            {
                name: 'list_users',
                description: 'List users',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListUsersSchema),
            },
            {
                name: 'create_user',
                description: 'Create a new user',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateUserSchema),
            },
            {
                name: 'update_user',
                description: 'Update user information',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateUserSchema),
            },
            {
                name: 'delete_user',
                description: 'Delete a user',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteUserSchema),
            },
            // Group Management
            {
                name: 'list_groups',
                description: 'List groups',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListGroupsSchema),
            },
            {
                name: 'create_group',
                description: 'Create a new group',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateGroupSchema),
            },
            {
                name: 'update_group',
                description: 'Update group information',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateGroupSchema),
            },
            {
                name: 'delete_group',
                description: 'Delete a group',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteGroupSchema),
            },
            // Pool Management
            {
                name: 'list_pools',
                description: 'List resource pools',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListPoolsSchema),
            },
            {
                name: 'create_pool',
                description: 'Create a resource pool',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreatePoolSchema),
            },
            {
                name: 'update_pool',
                description: 'Update pool configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdatePoolSchema),
            },
            {
                name: 'delete_pool',
                description: 'Delete a resource pool',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeletePoolSchema),
            },
            // HA Management
            {
                name: 'list_ha_resources',
                description: 'List HA resources',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListHAResourcesSchema),
            },
            {
                name: 'create_ha_resource',
                description: 'Add a resource to HA',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateHAResourceSchema),
            },
            {
                name: 'update_ha_resource',
                description: 'Update HA resource configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateHAResourceSchema),
            },
            {
                name: 'delete_ha_resource',
                description: 'Remove a resource from HA',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteHAResourceSchema),
            },
            // Monitoring
            {
                name: 'get_cluster_metrics',
                description: 'Get cluster performance metrics',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetClusterMetricsSchema),
            },
            {
                name: 'get_node_metrics',
                description: 'Get node performance metrics',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetNodeMetricsSchema),
            },
            {
                name: 'get_vm_metrics',
                description: 'Get VM performance metrics',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetVMMetricsSchema),
            },
            // Template Management
            {
                name: 'create_vm_template',
                description: 'Convert a VM to a template',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateVMTemplateSchema),
            },
            {
                name: 'create_container_template',
                description: 'Convert a container to a template',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateContainerTemplateSchema),
            },
            // Console Access
            {
                name: 'get_vm_console',
                description: 'Get VM console access configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetVMConsoleSchema),
            },
            {
                name: 'get_container_console',
                description: 'Get container console access configuration',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetContainerConsoleSchema),
            },
        ],
    };
});
/**
 * Handler for tool execution
 */
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
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
                if (purge)
                    params.append('purge', '1');
                if (destroyUnreferencedDisks)
                    params.append('destroy-unreferenced-disks', '1');
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
                if (vmid)
                    params.vmid = vmid;
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
                const params = {};
                if (vmid)
                    params.vmid = vmid;
                if (limit)
                    params.limit = limit;
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
                }
                else if (node) {
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
                }
                else if (node) {
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
                }
                else if (node) {
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
                }
                else if (node) {
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
    }
    catch (error) {
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
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Proxmox MCP server started');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map