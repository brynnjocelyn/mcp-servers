#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const zod_1 = require("zod");
const config_loader_js_1 = require("./config-loader.js");
const ceph_client_js_1 = require("./ceph-client.js");
// Tool schemas
const EmptySchema = zod_1.z.object({});
const PoolNameSchema = zod_1.z.object({
    pool_name: zod_1.z.string().describe('Name of the pool')
});
const OptionalPoolSchema = zod_1.z.object({
    pool_name: zod_1.z.string().optional().describe('Name of the pool (optional)')
});
const CreatePoolSchema = zod_1.z.object({
    name: zod_1.z.string().describe('Name of the new pool'),
    pg_num: zod_1.z.number().min(1).default(128).describe('Number of placement groups')
});
const ConfigSchema = zod_1.z.object({
    section: zod_1.z.string().optional().describe('Configuration section'),
    name: zod_1.z.string().optional().describe('Configuration parameter name')
});
const SetConfigSchema = zod_1.z.object({
    section: zod_1.z.string().describe('Configuration section'),
    name: zod_1.z.string().describe('Configuration parameter name'),
    value: zod_1.z.string().describe('Configuration value')
});
const ObjectSchema = zod_1.z.object({
    pool: zod_1.z.string().describe('Pool name'),
    object_name: zod_1.z.string().describe('Object name')
});
const RBDImageSchema = zod_1.z.object({
    name: zod_1.z.string().describe('Image name'),
    pool: zod_1.z.string().optional().describe('Pool name (optional)')
});
const CreateRBDImageSchema = zod_1.z.object({
    name: zod_1.z.string().describe('Image name'),
    size: zod_1.z.string().describe('Image size (e.g., 10G, 1T)'),
    pool: zod_1.z.string().optional().describe('Pool name (optional)')
});
const RGWUserSchema = zod_1.z.object({
    uid: zod_1.z.string().describe('User ID'),
    display_name: zod_1.z.string().describe('Display name')
});
const RGWUserIdSchema = zod_1.z.object({
    uid: zod_1.z.string().describe('User ID')
});
const RGWBucketSchema = zod_1.z.object({
    bucket: zod_1.z.string().describe('Bucket name')
});
/**
 * Main MCP server for Ceph
 */
async function main() {
    const config = (0, config_loader_js_1.loadConfig)();
    const cephClient = new ceph_client_js_1.CephClient(config);
    const server = new index_js_1.Server({
        name: 'ceph-mcp-server',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    // Error handler helper
    const handleError = (error) => {
        if (error instanceof ceph_client_js_1.CephError) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Ceph error: ${error.message}`, error.details);
        }
        throw error;
    };
    // List available tools
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
        tools: [
            // Cluster Operations
            {
                name: 'get_cluster_status',
                description: 'Get the overall status of the Ceph cluster',
                inputSchema: EmptySchema
            },
            {
                name: 'get_cluster_health',
                description: 'Get the health status of the Ceph cluster',
                inputSchema: EmptySchema
            },
            {
                name: 'get_config',
                description: 'Get cluster configuration values',
                inputSchema: ConfigSchema
            },
            {
                name: 'set_config',
                description: 'Set cluster configuration values',
                inputSchema: SetConfigSchema
            },
            // Pool Operations
            {
                name: 'list_pools',
                description: 'List all pools in the cluster',
                inputSchema: EmptySchema
            },
            {
                name: 'create_pool',
                description: 'Create a new pool',
                inputSchema: CreatePoolSchema
            },
            {
                name: 'delete_pool',
                description: 'Delete a pool (use with caution)',
                inputSchema: PoolNameSchema
            },
            {
                name: 'get_pool_stats',
                description: 'Get statistics for pools',
                inputSchema: OptionalPoolSchema
            },
            // Object Operations
            {
                name: 'list_objects',
                description: 'List objects in a pool',
                inputSchema: PoolNameSchema
            },
            {
                name: 'delete_object',
                description: 'Delete an object from a pool',
                inputSchema: ObjectSchema
            },
            // OSD Operations
            {
                name: 'list_osds',
                description: 'List all OSDs in the cluster',
                inputSchema: EmptySchema
            },
            {
                name: 'get_osd_tree',
                description: 'Get the OSD tree showing the cluster topology',
                inputSchema: EmptySchema
            },
            {
                name: 'get_osd_stats',
                description: 'Get OSD usage statistics',
                inputSchema: EmptySchema
            },
            // Monitor Operations
            {
                name: 'get_monitor_status',
                description: 'Get monitor status',
                inputSchema: EmptySchema
            },
            {
                name: 'list_monitors',
                description: 'List all monitors in the cluster',
                inputSchema: EmptySchema
            },
            // PG Operations
            {
                name: 'get_pg_stats',
                description: 'Get placement group statistics',
                inputSchema: EmptySchema
            },
            {
                name: 'list_pgs',
                description: 'List placement groups',
                inputSchema: EmptySchema
            },
            // MDS/CephFS Operations
            {
                name: 'get_mds_status',
                description: 'Get metadata server status',
                inputSchema: EmptySchema
            },
            {
                name: 'list_filesystems',
                description: 'List CephFS filesystems',
                inputSchema: EmptySchema
            },
            // RBD Operations
            {
                name: 'list_rbd_images',
                description: 'List RBD (RADOS Block Device) images',
                inputSchema: OptionalPoolSchema
            },
            {
                name: 'create_rbd_image',
                description: 'Create a new RBD image',
                inputSchema: CreateRBDImageSchema
            },
            {
                name: 'delete_rbd_image',
                description: 'Delete an RBD image',
                inputSchema: RBDImageSchema
            },
            {
                name: 'get_rbd_image_info',
                description: 'Get information about an RBD image',
                inputSchema: RBDImageSchema
            },
            // RGW/S3 Operations
            {
                name: 'list_rgw_users',
                description: 'List RADOS Gateway (S3) users',
                inputSchema: EmptySchema
            },
            {
                name: 'create_rgw_user',
                description: 'Create a new RADOS Gateway user',
                inputSchema: RGWUserSchema
            },
            {
                name: 'get_rgw_user_info',
                description: 'Get information about a RADOS Gateway user',
                inputSchema: RGWUserIdSchema
            },
            {
                name: 'delete_rgw_user',
                description: 'Delete a RADOS Gateway user',
                inputSchema: RGWUserIdSchema
            },
            {
                name: 'list_rgw_buckets',
                description: 'List all RADOS Gateway buckets',
                inputSchema: EmptySchema
            },
            {
                name: 'get_rgw_bucket_stats',
                description: 'Get statistics for a RADOS Gateway bucket',
                inputSchema: RGWBucketSchema
            }
        ]
    }));
    // Handle tool calls
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            switch (name) {
                // Cluster Operations
                case 'get_cluster_status':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getStatus(), null, 2)
                            }]
                    };
                case 'get_cluster_health':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getHealth(), null, 2)
                            }]
                    };
                case 'get_config': {
                    const { section, name } = ConfigSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getConfig(section, name), null, 2)
                            }]
                    };
                }
                case 'set_config': {
                    const { section, name, value } = SetConfigSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.setConfig(section, name, value), null, 2)
                            }]
                    };
                }
                // Pool Operations
                case 'list_pools':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.listPools(), null, 2)
                            }]
                    };
                case 'create_pool': {
                    const { name, pg_num } = CreatePoolSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.createPool(name, pg_num), null, 2)
                            }]
                    };
                }
                case 'delete_pool': {
                    const { pool_name } = PoolNameSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.deletePool(pool_name), null, 2)
                            }]
                    };
                }
                case 'get_pool_stats': {
                    const { pool_name } = OptionalPoolSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getPoolStats(pool_name), null, 2)
                            }]
                    };
                }
                // Object Operations
                case 'list_objects': {
                    const { pool_name } = PoolNameSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.listObjects(pool_name), null, 2)
                            }]
                    };
                }
                case 'delete_object': {
                    const { pool, object_name } = ObjectSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.deleteObject(pool, object_name), null, 2)
                            }]
                    };
                }
                // OSD Operations
                case 'list_osds':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.listOSDs(), null, 2)
                            }]
                    };
                case 'get_osd_tree':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getOSDTree(), null, 2)
                            }]
                    };
                case 'get_osd_stats':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getOSDStats(), null, 2)
                            }]
                    };
                // Monitor Operations
                case 'get_monitor_status':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getMonitorStatus(), null, 2)
                            }]
                    };
                case 'list_monitors':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.listMonitors(), null, 2)
                            }]
                    };
                // PG Operations
                case 'get_pg_stats':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getPGStats(), null, 2)
                            }]
                    };
                case 'list_pgs':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.listPGs(), null, 2)
                            }]
                    };
                // MDS/CephFS Operations
                case 'get_mds_status':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getMDSStatus(), null, 2)
                            }]
                    };
                case 'list_filesystems':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.listFilesystems(), null, 2)
                            }]
                    };
                // RBD Operations
                case 'list_rbd_images': {
                    const { pool_name } = OptionalPoolSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.listRBDImages(pool_name), null, 2)
                            }]
                    };
                }
                case 'create_rbd_image': {
                    const { name, size, pool } = CreateRBDImageSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.createRBDImage(name, size, pool), null, 2)
                            }]
                    };
                }
                case 'delete_rbd_image': {
                    const { name, pool } = RBDImageSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.deleteRBDImage(name, pool), null, 2)
                            }]
                    };
                }
                case 'get_rbd_image_info': {
                    const { name, pool } = RBDImageSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getRBDImageInfo(name, pool), null, 2)
                            }]
                    };
                }
                // RGW/S3 Operations
                case 'list_rgw_users':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.listRGWUsers(), null, 2)
                            }]
                    };
                case 'create_rgw_user': {
                    const { uid, display_name } = RGWUserSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.createRGWUser(uid, display_name), null, 2)
                            }]
                    };
                }
                case 'get_rgw_user_info': {
                    const { uid } = RGWUserIdSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getRGWUserInfo(uid), null, 2)
                            }]
                    };
                }
                case 'delete_rgw_user': {
                    const { uid } = RGWUserIdSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.deleteRGWUser(uid), null, 2)
                            }]
                    };
                }
                case 'list_rgw_buckets':
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.listRGWBuckets(), null, 2)
                            }]
                    };
                case 'get_rgw_bucket_stats': {
                    const { bucket } = RGWBucketSchema.parse(args);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(await cephClient.getRGWBucketStats(bucket), null, 2)
                            }]
                    };
                }
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
        }
        catch (error) {
            return handleError(error);
        }
    });
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Ceph MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map