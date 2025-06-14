#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { loadConfig } from './config-loader.js';
import { AnsibleRunner } from './ansible-runner.js';
import { AnsibleDatabase } from './database.js';
import * as yaml from 'js-yaml';
import { writeFileSync } from 'fs';
// Playbook Execution Schemas
const RunPlaybookSchema = z.object({
    playbook: z.string().describe('Path to the playbook file'),
    inventory: z.string().optional().describe('Inventory file or host pattern'),
    limit: z.string().optional().describe('Limit execution to specific hosts'),
    tags: z.string().optional().describe('Only run plays and tasks tagged with these values'),
    skipTags: z.string().optional().describe('Skip plays and tasks tagged with these values'),
    extraVars: z.record(z.any()).optional().describe('Additional variables as key=value'),
    become: z.boolean().optional().describe('Run operations with become'),
    checkMode: z.boolean().optional().describe('Run in check mode (dry run)'),
    verbose: z.number().optional().describe('Verbosity level (0-4)'),
});
const RunCommandSchema = z.object({
    pattern: z.string().describe('Host pattern (e.g., "all", "webservers", "host1")'),
    module: z.string().describe('Ansible module to execute (e.g., "ping", "shell", "apt")'),
    args: z.string().optional().describe('Module arguments'),
    inventory: z.string().optional().describe('Inventory file'),
    become: z.boolean().optional().describe('Run operations with become'),
    verbose: z.number().optional().describe('Verbosity level (0-4)'),
});
// Inventory Management Schemas
const GetInventorySchema = z.object({
    inventory: z.string().optional().describe('Inventory file path'),
    host: z.string().optional().describe('Get variables for specific host'),
    graph: z.boolean().optional().describe('Show inventory as graph'),
    vars: z.boolean().optional().describe('Include variables in graph output'),
});
const AddHostSchema = z.object({
    hostname: z.string().describe('Hostname'),
    group: z.string().describe('Group name'),
    ansibleHost: z.string().optional().describe('IP address or FQDN'),
    ansiblePort: z.number().optional().describe('SSH port'),
    ansibleUser: z.string().optional().describe('SSH user'),
    variables: z.record(z.any()).optional().describe('Additional host variables'),
    isContainer: z.boolean().optional().describe('Is this a container?'),
    proxmoxNode: z.string().optional().describe('Proxmox node name'),
    proxmoxVmid: z.number().optional().describe('Proxmox VM/CT ID'),
});
const UpdateHostSchema = z.object({
    hostname: z.string().describe('Hostname to update'),
    enabled: z.boolean().optional().describe('Enable/disable host'),
    variables: z.record(z.any()).optional().describe('Update host variables'),
    group: z.string().optional().describe('Move to different group'),
});
const GetHostsSchema = z.object({
    group: z.string().optional().describe('Filter by group'),
    enabled: z.boolean().optional().default(true).describe('Show enabled/disabled hosts'),
    containers: z.boolean().optional().describe('Show only containers'),
});
// Playbook Management Schemas
const ScanPlaybooksSchema = z.object({
    directory: z.string().optional().describe('Directory to scan for playbooks'),
});
const RegisterPlaybookSchema = z.object({
    name: z.string().describe('Playbook name'),
    path: z.string().describe('Path to playbook file'),
    description: z.string().optional().describe('Playbook description'),
    category: z.string().optional().describe('Category for organization'),
    tags: z.array(z.string()).optional().describe('Playbook tags'),
    requiresVault: z.boolean().optional().describe('Does this playbook require vault?'),
});
const GetPlaybooksSchema = z.object({
    category: z.string().optional().describe('Filter by category'),
});
// Execution History Schemas
const GetRunsSchema = z.object({
    limit: z.number().optional().default(10).describe('Number of runs to retrieve'),
    status: z.enum(['running', 'success', 'failed', 'cancelled']).optional().describe('Filter by status'),
    playbook: z.string().optional().describe('Filter by playbook name'),
});
const GetRunDetailsSchema = z.object({
    runId: z.number().describe('Run ID'),
});
// Vault Schemas
const VaultEncryptSchema = z.object({
    content: z.string().describe('Content to encrypt'),
    vaultPasswordFile: z.string().optional().describe('Path to vault password file'),
});
const VaultDecryptSchema = z.object({
    content: z.string().describe('Encrypted content'),
    vaultPasswordFile: z.string().optional().describe('Path to vault password file'),
});
// Syntax Check Schema
const CheckSyntaxSchema = z.object({
    playbook: z.string().describe('Path to playbook to check'),
    inventory: z.string().optional().describe('Inventory file'),
});
// Galaxy Schema
const InstallRequirementsSchema = z.object({
    requirementsFile: z.string().describe('Path to requirements file'),
    type: z.enum(['role', 'collection']).optional().default('role').describe('Type of requirements'),
});
// Generate Inventory Schema
const GenerateInventorySchema = z.object({
    format: z.enum(['json', 'yaml', 'ini']).optional().default('json').describe('Output format'),
    outputFile: z.string().optional().describe('Save to file instead of returning'),
});
// Proxmox Import Schema
const ImportProxmoxInventorySchema = z.object({
    proxmoxHosts: z.array(z.object({
        hostname: z.string(),
        ip: z.string(),
        type: z.enum(['lxc', 'qemu']),
        node: z.string(),
        vmid: z.number(),
        status: z.string().optional(),
        ostype: z.string().optional(),
    })).describe('Array of Proxmox VMs/containers to import'),
    defaultGroup: z.string().optional().default('proxmox').describe('Default group for imported hosts'),
    groupByNode: z.boolean().optional().describe('Create groups by Proxmox node'),
    groupByType: z.boolean().optional().describe('Create groups by type (containers/vms)'),
});
/**
 * Create an MCP server for Ansible operations
 */
const server = new Server({
    name: 'ansible-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize components
let runner;
let db;
async function initializeServer() {
    try {
        const config = loadConfig();
        db = new AnsibleDatabase(config.dbPath || './ansible-mcp.db');
        await db.initialize();
        runner = new AnsibleRunner(config, db);
        console.error('Ansible MCP server initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize Ansible MCP server:', error);
        throw error;
    }
}
// Initialize on startup
initializeServer().catch(console.error);
/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // Playbook Execution
            {
                name: 'run_playbook',
                description: 'Run an Ansible playbook with specified options',
                inputSchema: zodToJsonSchema(RunPlaybookSchema),
            },
            {
                name: 'run_command',
                description: 'Run an ad-hoc Ansible command on hosts',
                inputSchema: zodToJsonSchema(RunCommandSchema),
            },
            {
                name: 'check_syntax',
                description: 'Check playbook syntax without executing',
                inputSchema: zodToJsonSchema(CheckSyntaxSchema),
            },
            // Inventory Management
            {
                name: 'get_inventory',
                description: 'Get current Ansible inventory information',
                inputSchema: zodToJsonSchema(GetInventorySchema),
            },
            {
                name: 'add_host',
                description: 'Add a host to the inventory database',
                inputSchema: zodToJsonSchema(AddHostSchema),
            },
            {
                name: 'update_host',
                description: 'Update host information in inventory',
                inputSchema: zodToJsonSchema(UpdateHostSchema),
            },
            {
                name: 'get_hosts',
                description: 'Get hosts from inventory database',
                inputSchema: zodToJsonSchema(GetHostsSchema),
            },
            {
                name: 'generate_inventory',
                description: 'Generate inventory file from database',
                inputSchema: zodToJsonSchema(GenerateInventorySchema),
            },
            // Playbook Management
            {
                name: 'scan_playbooks',
                description: 'Scan directory for Ansible playbooks',
                inputSchema: zodToJsonSchema(ScanPlaybooksSchema),
            },
            {
                name: 'register_playbook',
                description: 'Register a playbook in the database',
                inputSchema: zodToJsonSchema(RegisterPlaybookSchema),
            },
            {
                name: 'get_playbooks',
                description: 'Get registered playbooks from database',
                inputSchema: zodToJsonSchema(GetPlaybooksSchema),
            },
            // Execution History
            {
                name: 'get_runs',
                description: 'Get playbook execution history',
                inputSchema: zodToJsonSchema(GetRunsSchema),
            },
            {
                name: 'get_run_details',
                description: 'Get detailed information about a specific run',
                inputSchema: zodToJsonSchema(GetRunDetailsSchema),
            },
            // Vault Operations
            {
                name: 'vault_encrypt',
                description: 'Encrypt content using Ansible Vault',
                inputSchema: zodToJsonSchema(VaultEncryptSchema),
            },
            {
                name: 'vault_decrypt',
                description: 'Decrypt Ansible Vault encrypted content',
                inputSchema: zodToJsonSchema(VaultDecryptSchema),
            },
            // Galaxy Operations
            {
                name: 'install_requirements',
                description: 'Install Ansible Galaxy requirements',
                inputSchema: zodToJsonSchema(InstallRequirementsSchema),
            },
            // Proxmox Integration
            {
                name: 'import_proxmox_inventory',
                description: 'Import Proxmox VMs and containers into inventory',
                inputSchema: zodToJsonSchema(ImportProxmoxInventorySchema),
            },
        ],
    };
});
/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!runner || !db) {
        throw new Error('Server not initialized. Please check configuration.');
    }
    try {
        switch (name) {
            // Playbook Execution
            case 'run_playbook': {
                const params = RunPlaybookSchema.parse(args);
                const result = await runner.runPlaybook(params.playbook, {
                    inventory: params.inventory,
                    limit: params.limit,
                    tags: params.tags,
                    skipTags: params.skipTags,
                    extraVars: params.extraVars,
                    become: params.become,
                    checkMode: params.checkMode,
                    verbose: params.verbose,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Playbook execution ${result.success ? 'succeeded' : 'failed'}
Exit code: ${result.exitCode}
Duration: ${result.duration}ms
Run ID: ${result.runId}

Output:
${result.stdout}
${result.stderr ? '\nErrors:\n' + result.stderr : ''}`,
                        },
                    ],
                };
            }
            case 'run_command': {
                const params = RunCommandSchema.parse(args);
                const result = await runner.runCommand(params.pattern, params.module, params.args, {
                    inventory: params.inventory,
                    become: params.become,
                    verbose: params.verbose,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Command execution ${result.success ? 'succeeded' : 'failed'}
Exit code: ${result.exitCode}
Duration: ${result.duration}ms

Output:
${result.stdout}
${result.stderr ? '\nErrors:\n' + result.stderr : ''}`,
                        },
                    ],
                };
            }
            case 'check_syntax': {
                const params = CheckSyntaxSchema.parse(args);
                const result = await runner.checkSyntax(params.playbook, params.inventory);
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.success
                                ? `Syntax check passed for ${params.playbook}`
                                : `Syntax errors found:\n${result.stderr}`,
                        },
                    ],
                };
            }
            // Inventory Management
            case 'get_inventory': {
                const params = GetInventorySchema.parse(args);
                const inventory = await runner.getInventory(params);
                return {
                    content: [
                        {
                            type: 'text',
                            text: typeof inventory === 'string'
                                ? inventory
                                : JSON.stringify(inventory, null, 2),
                        },
                    ],
                };
            }
            case 'add_host': {
                const params = AddHostSchema.parse(args);
                await db.upsertHost({
                    hostname: params.hostname,
                    groupName: params.group,
                    ansibleHost: params.ansibleHost,
                    ansiblePort: params.ansiblePort,
                    ansibleUser: params.ansibleUser,
                    variables: params.variables ? JSON.stringify(params.variables) : undefined,
                    enabled: true,
                    isContainer: params.isContainer,
                    proxmoxNode: params.proxmoxNode,
                    proxmoxVmid: params.proxmoxVmid,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Host ${params.hostname} added to group ${params.group}`,
                        },
                    ],
                };
            }
            case 'update_host': {
                const params = UpdateHostSchema.parse(args);
                const host = await db.getHost(params.hostname);
                if (!host) {
                    throw new Error(`Host ${params.hostname} not found`);
                }
                await db.upsertHost({
                    ...host,
                    enabled: params.enabled !== undefined ? params.enabled : host.enabled,
                    variables: params.variables ? JSON.stringify(params.variables) : host.variables,
                    groupName: params.group || host.groupName,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Host ${params.hostname} updated`,
                        },
                    ],
                };
            }
            case 'get_hosts': {
                const params = GetHostsSchema.parse(args);
                let hosts;
                if (params.containers) {
                    hosts = await db.getContainers();
                }
                else if (params.group) {
                    hosts = await db.getHostsByGroup(params.group);
                }
                else {
                    hosts = await db.getAllHosts(params.enabled);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(hosts, null, 2),
                        },
                    ],
                };
            }
            case 'generate_inventory': {
                const params = GenerateInventorySchema.parse(args);
                const inventory = await runner.generateInventory();
                let output;
                if (params.format === 'yaml') {
                    output = yaml.dump(inventory);
                }
                else if (params.format === 'ini') {
                    // Convert to INI format
                    output = '';
                    for (const [group, data] of Object.entries(inventory)) {
                        if (group === '_meta')
                            continue;
                        output += `[${group}]\n`;
                        if (data && typeof data === 'object' && 'hosts' in data) {
                            for (const host of data.hosts) {
                                const vars = inventory._meta.hostvars[host];
                                const varStr = Object.entries(vars || {})
                                    .map(([k, v]) => `${k}=${v}`)
                                    .join(' ');
                                output += `${host} ${varStr}\n`;
                            }
                        }
                        output += '\n';
                    }
                }
                else {
                    output = JSON.stringify(inventory, null, 2);
                }
                if (params.outputFile) {
                    writeFileSync(params.outputFile, output);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Inventory saved to ${params.outputFile}`,
                            },
                        ],
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: output,
                        },
                    ],
                };
            }
            // Playbook Management
            case 'scan_playbooks': {
                const params = ScanPlaybooksSchema.parse(args);
                const playbooks = await runner.scanForPlaybooks(params.directory);
                // Register found playbooks
                for (const playbook of playbooks) {
                    await db.upsertPlaybook({
                        name: playbook.name,
                        path: playbook.path,
                        description: playbook.description,
                        category: playbook.category,
                        tags: playbook.tags?.join(','),
                        lastModified: new Date().toISOString(),
                    });
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${playbooks.length} playbooks:\n${JSON.stringify(playbooks, null, 2)}`,
                        },
                    ],
                };
            }
            case 'register_playbook': {
                const params = RegisterPlaybookSchema.parse(args);
                await db.upsertPlaybook({
                    name: params.name,
                    path: params.path,
                    description: params.description,
                    category: params.category,
                    tags: params.tags?.join(','),
                    requiresVault: params.requiresVault,
                    lastModified: new Date().toISOString(),
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Playbook ${params.name} registered`,
                        },
                    ],
                };
            }
            case 'get_playbooks': {
                const params = GetPlaybooksSchema.parse(args);
                const playbooks = params.category
                    ? await db.getPlaybooksByCategory(params.category)
                    : await db.getAllPlaybooks();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(playbooks, null, 2),
                        },
                    ],
                };
            }
            // Execution History
            case 'get_runs': {
                const params = GetRunsSchema.parse(args);
                const runs = params.status
                    ? await db.getRunsByStatus(params.status)
                    : await db.getRecentRuns(params.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(runs, null, 2),
                        },
                    ],
                };
            }
            case 'get_run_details': {
                const params = GetRunDetailsSchema.parse(args);
                const run = await db.getRun(params.runId);
                if (!run) {
                    throw new Error(`Run ${params.runId} not found`);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(run, null, 2),
                        },
                    ],
                };
            }
            // Vault Operations
            case 'vault_encrypt': {
                const params = VaultEncryptSchema.parse(args);
                const encrypted = await runner.vaultEncrypt(params.content, params.vaultPasswordFile);
                return {
                    content: [
                        {
                            type: 'text',
                            text: encrypted,
                        },
                    ],
                };
            }
            case 'vault_decrypt': {
                const params = VaultDecryptSchema.parse(args);
                const decrypted = await runner.vaultDecrypt(params.content, params.vaultPasswordFile);
                return {
                    content: [
                        {
                            type: 'text',
                            text: decrypted,
                        },
                    ],
                };
            }
            // Galaxy Operations
            case 'install_requirements': {
                const params = InstallRequirementsSchema.parse(args);
                const result = await runner.installGalaxyRequirements(params.requirementsFile, params.type);
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.success
                                ? `Requirements installed successfully:\n${result.stdout}`
                                : `Failed to install requirements:\n${result.stderr}`,
                        },
                    ],
                };
            }
            // Proxmox Integration
            case 'import_proxmox_inventory': {
                const params = ImportProxmoxInventorySchema.parse(args);
                let imported = 0;
                for (const host of params.proxmoxHosts) {
                    let group = params.defaultGroup;
                    if (params.groupByNode) {
                        group = `node_${host.node}`;
                    }
                    else if (params.groupByType) {
                        group = host.type === 'lxc' ? 'containers' : 'vms';
                    }
                    await db.upsertHost({
                        hostname: host.hostname,
                        groupName: group,
                        ansibleHost: host.ip,
                        enabled: host.status === 'running',
                        osType: host.ostype,
                        isContainer: host.type === 'lxc',
                        proxmoxNode: host.node,
                        proxmoxVmid: host.vmid,
                        lastSeen: new Date().toISOString(),
                    });
                    imported++;
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Imported ${imported} hosts from Proxmox`,
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
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Ansible MCP server started');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map