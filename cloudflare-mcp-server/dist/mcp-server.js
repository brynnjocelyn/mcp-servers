#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const zod_1 = require("zod");
const zod_to_json_schema_1 = require("zod-to-json-schema");
const config_loader_js_1 = require("./config-loader.js");
const cloudflare_client_js_1 = require("./cloudflare-client.js");
// Zone Management Schemas
const ListZonesSchema = zod_1.z.object({
    name: zod_1.z.string().optional().describe('Filter by domain name'),
    status: zod_1.z.string().optional().describe('Filter by zone status'),
    accountId: zod_1.z.string().optional().describe('Filter by account ID'),
    page: zod_1.z.number().optional().describe('Page number'),
    perPage: zod_1.z.number().optional().describe('Results per page (max 50)'),
});
const GetZoneSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
});
const CreateZoneSchema = zod_1.z.object({
    name: zod_1.z.string().describe('Domain name'),
    accountId: zod_1.z.string().optional().describe('Account ID'),
    jumpStart: zod_1.z.boolean().optional().describe('Enable Cloudflare default settings'),
    type: zod_1.z.enum(['full', 'partial']).optional().default('full').describe('Zone type'),
});
const DeleteZoneSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID to delete'),
});
const PurgeAllCacheSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
});
const PurgeCacheByUrlsSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    files: zod_1.z.array(zod_1.z.string()).describe('Array of URLs to purge'),
});
// DNS Record Management Schemas
const ListDnsRecordsSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    type: zod_1.z.string().optional().describe('DNS record type (A, AAAA, CNAME, etc)'),
    name: zod_1.z.string().optional().describe('Record name'),
    content: zod_1.z.string().optional().describe('Record content'),
    page: zod_1.z.number().optional().describe('Page number'),
    perPage: zod_1.z.number().optional().describe('Results per page'),
});
const GetDnsRecordSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    recordId: zod_1.z.string().describe('DNS record ID'),
});
const CreateDnsRecordSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    type: zod_1.z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV', 'CAA']).describe('DNS record type'),
    name: zod_1.z.string().describe('DNS record name (e.g., example.com or subdomain)'),
    content: zod_1.z.string().describe('DNS record content (e.g., IP address)'),
    ttl: zod_1.z.number().optional().default(1).describe('Time to live (1 = automatic)'),
    priority: zod_1.z.number().optional().describe('Priority (for MX and SRV records)'),
    proxied: zod_1.z.boolean().optional().describe('Whether to proxy through Cloudflare'),
    comment: zod_1.z.string().optional().describe('Comment for the record'),
    tags: zod_1.z.array(zod_1.z.string()).optional().describe('Tags for the record'),
});
const UpdateDnsRecordSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    recordId: zod_1.z.string().describe('DNS record ID'),
    type: zod_1.z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV', 'CAA']).optional(),
    name: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    ttl: zod_1.z.number().optional(),
    priority: zod_1.z.number().optional(),
    proxied: zod_1.z.boolean().optional(),
    comment: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
const DeleteDnsRecordSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    recordId: zod_1.z.string().describe('DNS record ID'),
});
// Firewall Rules Schemas
const ListFirewallRulesSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    page: zod_1.z.number().optional(),
    perPage: zod_1.z.number().optional(),
});
const CreateFirewallRuleSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    filter: zod_1.z.object({
        expression: zod_1.z.string().describe('Filter expression'),
        description: zod_1.z.string().optional(),
    }),
    action: zod_1.z.enum(['block', 'challenge', 'js_challenge', 'managed_challenge', 'allow', 'log', 'bypass']),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.number().optional(),
    paused: zod_1.z.boolean().optional(),
});
const UpdateFirewallRuleSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    ruleId: zod_1.z.string().describe('Firewall rule ID'),
    action: zod_1.z.enum(['block', 'challenge', 'js_challenge', 'managed_challenge', 'allow', 'log', 'bypass']).optional(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.number().optional(),
    paused: zod_1.z.boolean().optional(),
});
const DeleteFirewallRuleSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    ruleId: zod_1.z.string().describe('Firewall rule ID'),
});
// SSL/TLS Schemas
const GetSslSettingsSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
});
const UpdateSslSettingsSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    value: zod_1.z.enum(['off', 'flexible', 'full', 'strict']).describe('SSL mode'),
});
const ListCertificatesSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
});
const OrderCertificateSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    hosts: zod_1.z.array(zod_1.z.string()).describe('Hostnames to cover'),
    type: zod_1.z.enum(['dedicated-custom', 'mtls']).optional(),
    validityDays: zod_1.z.number().optional().describe('Certificate validity in days'),
});
// Page Rules Schemas
const ListPageRulesSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    status: zod_1.z.enum(['active', 'disabled']).optional(),
    order: zod_1.z.enum(['status', 'priority']).optional(),
});
const CreatePageRuleSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    targets: zod_1.z.array(zod_1.z.object({
        target: zod_1.z.literal('url'),
        constraint: zod_1.z.object({
            operator: zod_1.z.enum(['matches']),
            value: zod_1.z.string().describe('URL pattern (e.g., *example.com/*)'),
        }),
    })),
    actions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().describe('Action ID (e.g., forwarding_url, always_use_https)'),
        value: zod_1.z.any().optional().describe('Action value'),
    })),
    priority: zod_1.z.number().optional(),
    status: zod_1.z.enum(['active', 'disabled']).optional(),
});
// Workers Schemas
const ListWorkersSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
});
const GetWorkerSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    scriptName: zod_1.z.string().describe('Worker script name'),
});
const CreateWorkerSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    scriptName: zod_1.z.string().describe('Worker script name'),
    script: zod_1.z.string().describe('JavaScript code for the worker'),
    bindings: zod_1.z.array(zod_1.z.any()).optional().describe('Worker bindings'),
});
const DeleteWorkerSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    scriptName: zod_1.z.string().describe('Worker script name'),
});
// KV Namespace Schemas
const ListKvNamespacesSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    page: zod_1.z.number().optional(),
    perPage: zod_1.z.number().optional(),
});
const CreateKvNamespaceSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    title: zod_1.z.string().describe('Namespace title'),
});
const DeleteKvNamespaceSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    namespaceId: zod_1.z.string().describe('Namespace ID'),
});
const ListKvKeysSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    namespaceId: zod_1.z.string().describe('Namespace ID'),
    prefix: zod_1.z.string().optional().describe('Key prefix filter'),
    limit: zod_1.z.number().optional().describe('Maximum keys to return'),
    cursor: zod_1.z.string().optional().describe('Pagination cursor'),
});
const GetKvValueSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    namespaceId: zod_1.z.string().describe('Namespace ID'),
    key: zod_1.z.string().describe('Key name'),
});
const PutKvValueSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    namespaceId: zod_1.z.string().describe('Namespace ID'),
    key: zod_1.z.string().describe('Key name'),
    value: zod_1.z.string().describe('Value to store'),
    metadata: zod_1.z.record(zod_1.z.any()).optional().describe('Key metadata'),
    expirationTtl: zod_1.z.number().optional().describe('TTL in seconds'),
});
const DeleteKvValueSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    namespaceId: zod_1.z.string().describe('Namespace ID'),
    key: zod_1.z.string().describe('Key name'),
});
// R2 Storage Schemas
const ListR2BucketsSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
});
const CreateR2BucketSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    name: zod_1.z.string().describe('Bucket name'),
    locationHint: zod_1.z.string().optional().describe('Location hint'),
});
const DeleteR2BucketSchema = zod_1.z.object({
    accountId: zod_1.z.string().optional().describe('Account ID'),
    bucketName: zod_1.z.string().describe('Bucket name'),
});
// Zone Settings Schemas
const GetZoneSettingsSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
});
const UpdateZoneSettingSchema = zod_1.z.object({
    zoneId: zod_1.z.string().describe('Zone ID'),
    setting: zod_1.z.string().describe('Setting name (e.g., always_use_https, min_tls_version)'),
    value: zod_1.z.any().describe('Setting value'),
});
/**
 * Create an MCP server for Cloudflare operations
 */
const server = new index_js_1.Server({
    name: 'cloudflare-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize Cloudflare client
let cloudflareClient = null;
async function initializeClient() {
    try {
        const config = (0, config_loader_js_1.loadConfig)();
        cloudflareClient = new cloudflare_client_js_1.CloudflareClient(config);
        // Verify authentication
        const isValid = await cloudflareClient.verifyToken();
        if (isValid) {
            console.error('Cloudflare client initialized successfully');
        }
        else {
            console.error('Warning: Cloudflare token verification failed');
        }
    }
    catch (error) {
        console.error('Failed to initialize Cloudflare client:', error);
        cloudflareClient = null;
    }
}
// Initialize on startup
initializeClient().catch(console.error);
/**
 * Ensure client is initialized
 */
function ensureClient() {
    if (!cloudflareClient) {
        throw new Error('Cloudflare client not initialized. Check configuration.');
    }
    return cloudflareClient;
}
/**
 * Handler for listing available tools
 */
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            // Zone Management
            {
                name: 'list_zones',
                description: 'List all zones in your Cloudflare account',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListZonesSchema),
            },
            {
                name: 'get_zone',
                description: 'Get details of a specific zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetZoneSchema),
            },
            {
                name: 'create_zone',
                description: 'Create a new zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateZoneSchema),
            },
            {
                name: 'delete_zone',
                description: 'Delete a zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteZoneSchema),
            },
            {
                name: 'purge_all_cache',
                description: 'Purge all cached content for a zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(PurgeAllCacheSchema),
            },
            {
                name: 'purge_cache_by_urls',
                description: 'Purge specific URLs from cache',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(PurgeCacheByUrlsSchema),
            },
            // DNS Management
            {
                name: 'list_dns_records',
                description: 'List DNS records for a zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListDnsRecordsSchema),
            },
            {
                name: 'get_dns_record',
                description: 'Get details of a specific DNS record',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetDnsRecordSchema),
            },
            {
                name: 'create_dns_record',
                description: 'Create a new DNS record',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateDnsRecordSchema),
            },
            {
                name: 'update_dns_record',
                description: 'Update an existing DNS record',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateDnsRecordSchema),
            },
            {
                name: 'delete_dns_record',
                description: 'Delete a DNS record',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteDnsRecordSchema),
            },
            // Firewall Rules
            {
                name: 'list_firewall_rules',
                description: 'List firewall rules for a zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListFirewallRulesSchema),
            },
            {
                name: 'create_firewall_rule',
                description: 'Create a new firewall rule',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateFirewallRuleSchema),
            },
            {
                name: 'update_firewall_rule',
                description: 'Update an existing firewall rule',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateFirewallRuleSchema),
            },
            {
                name: 'delete_firewall_rule',
                description: 'Delete a firewall rule',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteFirewallRuleSchema),
            },
            // SSL/TLS
            {
                name: 'get_ssl_settings',
                description: 'Get SSL/TLS settings for a zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetSslSettingsSchema),
            },
            {
                name: 'update_ssl_settings',
                description: 'Update SSL/TLS mode for a zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateSslSettingsSchema),
            },
            {
                name: 'list_certificates',
                description: 'List SSL certificates for a zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListCertificatesSchema),
            },
            {
                name: 'order_certificate',
                description: 'Order a new SSL certificate',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(OrderCertificateSchema),
            },
            // Page Rules
            {
                name: 'list_page_rules',
                description: 'List page rules for a zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListPageRulesSchema),
            },
            {
                name: 'create_page_rule',
                description: 'Create a new page rule',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreatePageRuleSchema),
            },
            // Workers
            {
                name: 'list_workers',
                description: 'List all Worker scripts',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListWorkersSchema),
            },
            {
                name: 'get_worker',
                description: 'Get Worker script content',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetWorkerSchema),
            },
            {
                name: 'create_worker',
                description: 'Create or update a Worker script',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateWorkerSchema),
            },
            {
                name: 'delete_worker',
                description: 'Delete a Worker script',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteWorkerSchema),
            },
            // KV Storage
            {
                name: 'list_kv_namespaces',
                description: 'List Workers KV namespaces',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListKvNamespacesSchema),
            },
            {
                name: 'create_kv_namespace',
                description: 'Create a new KV namespace',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateKvNamespaceSchema),
            },
            {
                name: 'delete_kv_namespace',
                description: 'Delete a KV namespace',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteKvNamespaceSchema),
            },
            {
                name: 'list_kv_keys',
                description: 'List keys in a KV namespace',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListKvKeysSchema),
            },
            {
                name: 'get_kv_value',
                description: 'Get value for a key in KV namespace',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetKvValueSchema),
            },
            {
                name: 'put_kv_value',
                description: 'Store a key-value pair in KV namespace',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(PutKvValueSchema),
            },
            {
                name: 'delete_kv_value',
                description: 'Delete a key from KV namespace',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteKvValueSchema),
            },
            // R2 Storage
            {
                name: 'list_r2_buckets',
                description: 'List R2 storage buckets',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(ListR2BucketsSchema),
            },
            {
                name: 'create_r2_bucket',
                description: 'Create a new R2 bucket',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(CreateR2BucketSchema),
            },
            {
                name: 'delete_r2_bucket',
                description: 'Delete an R2 bucket',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(DeleteR2BucketSchema),
            },
            // Zone Settings
            {
                name: 'get_zone_settings',
                description: 'Get all settings for a zone',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(GetZoneSettingsSchema),
            },
            {
                name: 'update_zone_setting',
                description: 'Update a specific zone setting',
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(UpdateZoneSettingSchema),
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
            // Zone Management
            case 'list_zones': {
                const params = ListZonesSchema.parse(args);
                const response = await client.get('/zones', {
                    name: params.name,
                    status: params.status,
                    'account.id': params.accountId,
                    page: params.page,
                    per_page: params.perPage,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'get_zone': {
                const { zoneId } = GetZoneSchema.parse(args);
                const response = await client.get(`/zones/${zoneId}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'create_zone': {
                const params = CreateZoneSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                const response = await client.post('/zones', {
                    name: params.name,
                    account: { id: accountId },
                    jump_start: params.jumpStart,
                    type: params.type,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Zone created successfully: ${JSON.stringify(response.result, null, 2)}`,
                        },
                    ],
                };
            }
            case 'delete_zone': {
                const { zoneId } = DeleteZoneSchema.parse(args);
                await client.delete(`/zones/${zoneId}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Zone ${zoneId} deleted successfully`,
                        },
                    ],
                };
            }
            case 'purge_all_cache': {
                const { zoneId } = PurgeAllCacheSchema.parse(args);
                const response = await client.post(`/zones/${zoneId}/purge_cache`, {
                    purge_everything: true,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Cache purged successfully',
                        },
                    ],
                };
            }
            case 'purge_cache_by_urls': {
                const { zoneId, files } = PurgeCacheByUrlsSchema.parse(args);
                const response = await client.post(`/zones/${zoneId}/purge_cache`, {
                    files,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Cache purged for ${files.length} URLs`,
                        },
                    ],
                };
            }
            // DNS Management
            case 'list_dns_records': {
                const params = ListDnsRecordsSchema.parse(args);
                const response = await client.get(`/zones/${params.zoneId}/dns_records`, {
                    type: params.type,
                    name: params.name,
                    content: params.content,
                    page: params.page,
                    per_page: params.perPage,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'get_dns_record': {
                const { zoneId, recordId } = GetDnsRecordSchema.parse(args);
                const response = await client.get(`/zones/${zoneId}/dns_records/${recordId}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'create_dns_record': {
                const params = CreateDnsRecordSchema.parse(args);
                const { zoneId, ...recordData } = params;
                const response = await client.post(`/zones/${zoneId}/dns_records`, recordData);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `DNS record created: ${JSON.stringify(response.result, null, 2)}`,
                        },
                    ],
                };
            }
            case 'update_dns_record': {
                const params = UpdateDnsRecordSchema.parse(args);
                const { zoneId, recordId, ...updateData } = params;
                const response = await client.patch(`/zones/${zoneId}/dns_records/${recordId}`, updateData);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `DNS record updated: ${JSON.stringify(response.result, null, 2)}`,
                        },
                    ],
                };
            }
            case 'delete_dns_record': {
                const { zoneId, recordId } = DeleteDnsRecordSchema.parse(args);
                await client.delete(`/zones/${zoneId}/dns_records/${recordId}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'DNS record deleted successfully',
                        },
                    ],
                };
            }
            // Firewall Rules
            case 'list_firewall_rules': {
                const params = ListFirewallRulesSchema.parse(args);
                const response = await client.get(`/zones/${params.zoneId}/firewall/rules`, {
                    page: params.page,
                    per_page: params.perPage,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'create_firewall_rule': {
                const params = CreateFirewallRuleSchema.parse(args);
                const { zoneId, filter, ...ruleData } = params;
                // First create the filter
                const filterResponse = await client.post(`/zones/${zoneId}/filters`, filter);
                const filterId = filterResponse.result.id;
                // Then create the rule
                const response = await client.post(`/zones/${zoneId}/firewall/rules`, {
                    ...ruleData,
                    filter: { id: filterId },
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Firewall rule created: ${JSON.stringify(response.result, null, 2)}`,
                        },
                    ],
                };
            }
            case 'update_firewall_rule': {
                const params = UpdateFirewallRuleSchema.parse(args);
                const { zoneId, ruleId, ...updateData } = params;
                const response = await client.patch(`/zones/${zoneId}/firewall/rules/${ruleId}`, updateData);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Firewall rule updated: ${JSON.stringify(response.result, null, 2)}`,
                        },
                    ],
                };
            }
            case 'delete_firewall_rule': {
                const { zoneId, ruleId } = DeleteFirewallRuleSchema.parse(args);
                await client.delete(`/zones/${zoneId}/firewall/rules/${ruleId}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Firewall rule deleted successfully',
                        },
                    ],
                };
            }
            // SSL/TLS
            case 'get_ssl_settings': {
                const { zoneId } = GetSslSettingsSchema.parse(args);
                const response = await client.get(`/zones/${zoneId}/settings/ssl`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'update_ssl_settings': {
                const { zoneId, value } = UpdateSslSettingsSchema.parse(args);
                const response = await client.patch(`/zones/${zoneId}/settings/ssl`, { value });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `SSL mode updated to: ${value}`,
                        },
                    ],
                };
            }
            case 'list_certificates': {
                const { zoneId } = ListCertificatesSchema.parse(args);
                const response = await client.get(`/zones/${zoneId}/ssl/certificate_packs`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'order_certificate': {
                const params = OrderCertificateSchema.parse(args);
                const { zoneId, ...certData } = params;
                const response = await client.post(`/zones/${zoneId}/ssl/certificate_packs/order`, {
                    hosts: certData.hosts,
                    type: certData.type || 'dedicated-custom',
                    validity_days: certData.validityDays || 365,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Certificate ordered: ${JSON.stringify(response.result, null, 2)}`,
                        },
                    ],
                };
            }
            // Page Rules
            case 'list_page_rules': {
                const params = ListPageRulesSchema.parse(args);
                const response = await client.get(`/zones/${params.zoneId}/pagerules`, {
                    status: params.status,
                    order: params.order,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'create_page_rule': {
                const params = CreatePageRuleSchema.parse(args);
                const { zoneId, ...ruleData } = params;
                const response = await client.post(`/zones/${zoneId}/pagerules`, ruleData);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Page rule created: ${JSON.stringify(response.result, null, 2)}`,
                        },
                    ],
                };
            }
            // Workers
            case 'list_workers': {
                const params = ListWorkersSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                const response = await client.get(`/accounts/${accountId}/workers/scripts`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'get_worker': {
                const params = GetWorkerSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                const response = await client.get(`/accounts/${accountId}/workers/scripts/${params.scriptName}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: response.result,
                        },
                    ],
                };
            }
            case 'create_worker': {
                const params = CreateWorkerSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                // For now, use a simple text upload
                // In production, you'd need to handle multipart form data properly
                const response = await client.put(`/accounts/${accountId}/workers/scripts/${params.scriptName}`, params.script);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Worker script created/updated: ${params.scriptName}`,
                        },
                    ],
                };
            }
            case 'delete_worker': {
                const params = DeleteWorkerSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                await client.delete(`/accounts/${accountId}/workers/scripts/${params.scriptName}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Worker script deleted: ${params.scriptName}`,
                        },
                    ],
                };
            }
            // KV Storage
            case 'list_kv_namespaces': {
                const params = ListKvNamespacesSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                const response = await client.get(`/accounts/${accountId}/storage/kv/namespaces`, {
                    page: params.page,
                    per_page: params.perPage,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'create_kv_namespace': {
                const params = CreateKvNamespaceSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                const response = await client.post(`/accounts/${accountId}/storage/kv/namespaces`, {
                    title: params.title,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `KV namespace created: ${JSON.stringify(response.result, null, 2)}`,
                        },
                    ],
                };
            }
            case 'delete_kv_namespace': {
                const params = DeleteKvNamespaceSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                await client.delete(`/accounts/${accountId}/storage/kv/namespaces/${params.namespaceId}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'KV namespace deleted successfully',
                        },
                    ],
                };
            }
            case 'list_kv_keys': {
                const params = ListKvKeysSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                const response = await client.get(`/accounts/${accountId}/storage/kv/namespaces/${params.namespaceId}/keys`, {
                    prefix: params.prefix,
                    limit: params.limit,
                    cursor: params.cursor,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'get_kv_value': {
                const params = GetKvValueSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                const response = await client.get(`/accounts/${accountId}/storage/kv/namespaces/${params.namespaceId}/values/${params.key}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: response.result,
                        },
                    ],
                };
            }
            case 'put_kv_value': {
                const params = PutKvValueSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                // Build query params for metadata and TTL
                const queryParams = new URLSearchParams();
                if (params.metadata) {
                    queryParams.append('metadata', JSON.stringify(params.metadata));
                }
                if (params.expirationTtl) {
                    queryParams.append('expiration_ttl', params.expirationTtl.toString());
                }
                const url = `/accounts/${accountId}/storage/kv/namespaces/${params.namespaceId}/values/${params.key}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
                const response = await client.put(url, params.value);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Value stored for key: ${params.key}`,
                        },
                    ],
                };
            }
            case 'delete_kv_value': {
                const params = DeleteKvValueSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                await client.delete(`/accounts/${accountId}/storage/kv/namespaces/${params.namespaceId}/values/${params.key}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Key deleted: ${params.key}`,
                        },
                    ],
                };
            }
            // R2 Storage
            case 'list_r2_buckets': {
                const params = ListR2BucketsSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                const response = await client.get(`/accounts/${accountId}/r2/buckets`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'create_r2_bucket': {
                const params = CreateR2BucketSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                const response = await client.post(`/accounts/${accountId}/r2/buckets`, {
                    name: params.name,
                    locationHint: params.locationHint,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `R2 bucket created: ${params.name}`,
                        },
                    ],
                };
            }
            case 'delete_r2_bucket': {
                const params = DeleteR2BucketSchema.parse(args);
                const accountId = params.accountId || await client.getAccountId();
                await client.delete(`/accounts/${accountId}/r2/buckets/${params.bucketName}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `R2 bucket deleted: ${params.bucketName}`,
                        },
                    ],
                };
            }
            // Zone Settings
            case 'get_zone_settings': {
                const { zoneId } = GetZoneSettingsSchema.parse(args);
                const response = await client.get(`/zones/${zoneId}/settings`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.result, null, 2),
                        },
                    ],
                };
            }
            case 'update_zone_setting': {
                const { zoneId, setting, value } = UpdateZoneSettingSchema.parse(args);
                const response = await client.patch(`/zones/${zoneId}/settings/${setting}`, { value });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Setting '${setting}' updated to: ${JSON.stringify(value)}`,
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
    console.error('Cloudflare MCP server started');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map