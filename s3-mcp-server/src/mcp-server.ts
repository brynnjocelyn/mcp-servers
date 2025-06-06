#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as Minio from 'minio';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { loadConfig, getEndpointUrl } from './config-loader.js';

// Initialize S3 client
let minioClient: Minio.Client;

/**
 * Initialize S3 client connection
 */
function initializeClient() {
  const config = loadConfig();
  minioClient = new Minio.Client({
    endPoint: config.endPoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: config.region,
    sessionToken: config.sessionToken,
    partSize: config.partSize,
    pathStyle: config.pathStyle,
  });
  
  console.error(`S3 client initialized for ${getEndpointUrl(config)}`);
}

// Tool schemas
const BucketSchema = z.object({
  bucket: z.string().describe('Bucket name'),
});

const BucketPolicySchema = z.object({
  bucket: z.string().describe('Bucket name'),
  policy: z.string().optional().describe('Bucket policy (READ_ONLY, WRITE_ONLY, READ_WRITE, or custom JSON)'),
});

const ObjectSchema = z.object({
  bucket: z.string().describe('Bucket name'),
  object: z.string().describe('Object key/path'),
});

const PutObjectSchema = z.object({
  bucket: z.string().describe('Bucket name'),
  object: z.string().describe('Object key/path'),
  content: z.string().describe('Object content (text or base64 for binary)'),
  contentType: z.string().optional().describe('MIME type of the object'),
  metadata: z.record(z.string()).optional().describe('Object metadata'),
});

const ListObjectsSchema = z.object({
  bucket: z.string().describe('Bucket name'),
  prefix: z.string().optional().describe('Filter objects by prefix'),
  recursive: z.boolean().default(false).describe('List recursively'),
  maxKeys: z.number().optional().describe('Maximum number of objects to return'),
});

const CopyObjectSchema = z.object({
  sourceBucket: z.string().describe('Source bucket name'),
  sourceObject: z.string().describe('Source object key'),
  destBucket: z.string().describe('Destination bucket name'),
  destObject: z.string().describe('Destination object key'),
});

const PresignedUrlSchema = z.object({
  bucket: z.string().describe('Bucket name'),
  object: z.string().describe('Object key/path'),
  expiry: z.number().default(604800).describe('URL expiry in seconds (default: 7 days)'),
  method: z.enum(['GET', 'PUT']).default('GET').describe('HTTP method for the URL'),
});


// Initialize server
const server = new Server(
  {
    name: 's3-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Bucket operations
      {
        name: 'list_buckets',
        description: 'List all buckets',
        inputSchema: zodToJsonSchema(z.object({})),
      },
      {
        name: 'make_bucket',
        description: 'Create a new bucket',
        inputSchema: zodToJsonSchema(z.object({
          bucket: z.string().describe('Bucket name'),
          region: z.string().optional().describe('Region for the bucket'),
        })),
      },
      {
        name: 'remove_bucket',
        description: 'Remove an empty bucket',
        inputSchema: zodToJsonSchema(BucketSchema),
      },
      {
        name: 'bucket_exists',
        description: 'Check if a bucket exists',
        inputSchema: zodToJsonSchema(BucketSchema),
      },
      {
        name: 'get_bucket_policy',
        description: 'Get bucket policy',
        inputSchema: zodToJsonSchema(BucketSchema),
      },
      {
        name: 'set_bucket_policy',
        description: 'Set bucket policy',
        inputSchema: zodToJsonSchema(BucketPolicySchema),
      },
      {
        name: 'get_bucket_notification',
        description: 'Get bucket notification configuration',
        inputSchema: zodToJsonSchema(BucketSchema),
      },
      {
        name: 'get_bucket_versioning',
        description: 'Get bucket versioning configuration',
        inputSchema: zodToJsonSchema(BucketSchema),
      },
      
      // Object operations
      {
        name: 'list_objects',
        description: 'List objects in a bucket',
        inputSchema: zodToJsonSchema(ListObjectsSchema),
      },
      {
        name: 'get_object',
        description: 'Get an object content',
        inputSchema: zodToJsonSchema(ObjectSchema),
      },
      {
        name: 'put_object',
        description: 'Upload an object',
        inputSchema: zodToJsonSchema(PutObjectSchema),
      },
      {
        name: 'copy_object',
        description: 'Copy an object',
        inputSchema: zodToJsonSchema(CopyObjectSchema),
      },
      {
        name: 'remove_object',
        description: 'Delete an object',
        inputSchema: zodToJsonSchema(ObjectSchema),
      },
      {
        name: 'remove_objects',
        description: 'Delete multiple objects',
        inputSchema: zodToJsonSchema(z.object({
          bucket: z.string().describe('Bucket name'),
          objects: z.array(z.string()).describe('Array of object keys to delete'),
        })),
      },
      {
        name: 'stat_object',
        description: 'Get object metadata',
        inputSchema: zodToJsonSchema(ObjectSchema),
      },
      {
        name: 'presigned_get_object',
        description: 'Generate presigned URL for downloading',
        inputSchema: zodToJsonSchema(PresignedUrlSchema),
      },
      {
        name: 'presigned_put_object',
        description: 'Generate presigned URL for uploading',
        inputSchema: zodToJsonSchema(PresignedUrlSchema),
      },
      {
        name: 'get_object_tags',
        description: 'Get object tags',
        inputSchema: zodToJsonSchema(ObjectSchema),
      },
      {
        name: 'set_object_tags',
        description: 'Set object tags',
        inputSchema: zodToJsonSchema(z.object({
          bucket: z.string().describe('Bucket name'),
          object: z.string().describe('Object key'),
          tags: z.record(z.string()).describe('Object tags'),
        })),
      },
      
      // Storage info
      {
        name: 'bucket_usage',
        description: 'Get bucket storage usage statistics',
        inputSchema: zodToJsonSchema(BucketSchema),
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      // Bucket operations
      case 'list_buckets': {
        const buckets = await minioClient.listBuckets();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              buckets: buckets.map(b => ({
                name: b.name,
                creationDate: b.creationDate,
              })),
              count: buckets.length,
            }, null, 2),
          }],
        };
      }
      
      case 'make_bucket': {
        const { bucket, region } = args as { bucket: string; region?: string };
        await minioClient.makeBucket(bucket, region || 'us-east-1');
        return {
          content: [{
            type: 'text',
            text: `Bucket '${bucket}' created successfully${region ? ` in region ${region}` : ''}.`,
          }],
        };
      }
      
      case 'remove_bucket': {
        const { bucket } = args as z.infer<typeof BucketSchema>;
        await minioClient.removeBucket(bucket);
        return {
          content: [{
            type: 'text',
            text: `Bucket '${bucket}' removed successfully.`,
          }],
        };
      }
      
      case 'bucket_exists': {
        const { bucket } = args as z.infer<typeof BucketSchema>;
        const exists = await minioClient.bucketExists(bucket);
        return {
          content: [{
            type: 'text',
            text: exists ? `Bucket '${bucket}' exists.` : `Bucket '${bucket}' does not exist.`,
          }],
        };
      }
      
      case 'get_bucket_policy': {
        const { bucket } = args as z.infer<typeof BucketSchema>;
        try {
          const policy = await minioClient.getBucketPolicy(bucket);
          return {
            content: [{
              type: 'text',
              text: `Bucket policy for '${bucket}':\n${policy}`,
            }],
          };
        } catch (error: any) {
          if (error.code === 'NoSuchBucketPolicy') {
            return {
              content: [{
                type: 'text',
                text: `No policy set for bucket '${bucket}'.`,
              }],
            };
          }
          throw error;
        }
      }
      
      case 'set_bucket_policy': {
        const { bucket, policy } = args as z.infer<typeof BucketPolicySchema>;
        if (policy) {
          await minioClient.setBucketPolicy(bucket, policy);
          return {
            content: [{
              type: 'text',
              text: `Bucket policy set for '${bucket}'.`,
            }],
          };
        } else {
          // To remove policy, set an empty policy
          await minioClient.setBucketPolicy(bucket, '');
          return {
            content: [{
              type: 'text',
              text: `Bucket policy removed for '${bucket}'.`,
            }],
          };
        }
      }
      
      case 'get_bucket_notification': {
        const { bucket } = args as z.infer<typeof BucketSchema>;
        const config = await minioClient.getBucketNotification(bucket);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(config, null, 2),
          }],
        };
      }
      
      case 'get_bucket_versioning': {
        const { bucket } = args as z.infer<typeof BucketSchema>;
        const config = await minioClient.getBucketVersioning(bucket);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(config, null, 2),
          }],
        };
      }
      
      // Object operations
      case 'list_objects': {
        const { bucket, prefix, recursive, maxKeys } = args as z.infer<typeof ListObjectsSchema>;
        const stream = minioClient.listObjectsV2(bucket, prefix, recursive);
        const objects: any[] = [];
        let count = 0;
        
        return new Promise((resolve, reject) => {
          stream.on('data', (obj) => {
            if (!maxKeys || count < maxKeys) {
              objects.push({
                name: obj.name,
                lastModified: obj.lastModified,
                etag: obj.etag,
                size: obj.size,
              });
              count++;
            }
          });
          
          stream.on('error', reject);
          
          stream.on('end', () => {
            resolve({
              content: [{
                type: 'text',
                text: JSON.stringify({
                  objects,
                  count: objects.length,
                  truncated: maxKeys ? count >= maxKeys : false,
                }, null, 2),
              }],
            });
          });
        });
      }
      
      case 'get_object': {
        const { bucket, object } = args as z.infer<typeof ObjectSchema>;
        const stream = await minioClient.getObject(bucket, object);
        const chunks: Buffer[] = [];
        
        return new Promise((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => {
            const content = Buffer.concat(chunks);
            // Try to return as text if possible, otherwise base64
            try {
              const text = content.toString('utf8');
              // Check if it's valid UTF-8
              if (Buffer.from(text, 'utf8').equals(content)) {
                resolve({
                  content: [{
                    type: 'text',
                    text: text,
                  }],
                });
              } else {
                resolve({
                  content: [{
                    type: 'text',
                    text: `[Binary content - ${content.length} bytes]\nBase64: ${content.toString('base64')}`,
                  }],
                });
              }
            } catch {
              resolve({
                content: [{
                  type: 'text',
                  text: `[Binary content - ${content.length} bytes]\nBase64: ${content.toString('base64')}`,
                }],
              });
            }
          });
        });
      }
      
      case 'put_object': {
        const { bucket, object, content, contentType, metadata } = args as z.infer<typeof PutObjectSchema>;
        // Handle both text and base64 content
        let buffer: Buffer;
        try {
          // Try base64 first
          buffer = Buffer.from(content, 'base64');
          // Verify it's valid base64 by checking if decoding and re-encoding matches
          if (buffer.toString('base64') !== content) {
            // Not base64, treat as text
            buffer = Buffer.from(content, 'utf8');
          }
        } catch {
          // Fall back to UTF-8
          buffer = Buffer.from(content, 'utf8');
        }
        
        const result = await minioClient.putObject(bucket, object, buffer, buffer.length, {
          'Content-Type': contentType || 'application/octet-stream',
          ...metadata,
        });
        
        return {
          content: [{
            type: 'text',
            text: `Object '${object}' uploaded to bucket '${bucket}'. ETag: ${result.etag}`,
          }],
        };
      }
      
      case 'copy_object': {
        const { sourceBucket, sourceObject, destBucket, destObject } = args as z.infer<typeof CopyObjectSchema>;
        await minioClient.copyObject(destBucket, destObject, `/${sourceBucket}/${sourceObject}`);
        return {
          content: [{
            type: 'text',
            text: `Object copied from '${sourceBucket}/${sourceObject}' to '${destBucket}/${destObject}'.`,
          }],
        };
      }
      
      case 'remove_object': {
        const { bucket, object } = args as z.infer<typeof ObjectSchema>;
        await minioClient.removeObject(bucket, object);
        return {
          content: [{
            type: 'text',
            text: `Object '${object}' removed from bucket '${bucket}'.`,
          }],
        };
      }
      
      case 'remove_objects': {
        const { bucket, objects } = args as { bucket: string; objects: string[] };
        const objectsList = objects.map(name => ({ name }));
        
        try {
          const results = await minioClient.removeObjects(bucket, objectsList);
          const errors = results.filter(r => r?.Error);
          
          if (errors.length > 0) {
            return {
              content: [{
                type: 'text',
                text: `Removed ${objects.length - errors.length} objects. Errors:\n${JSON.stringify(errors, null, 2)}`,
              }],
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `Successfully removed ${objects.length} objects from bucket '${bucket}'.`,
              }],
            };
          }
        } catch (error) {
          throw error;
        }
      }
      
      case 'stat_object': {
        const { bucket, object } = args as z.infer<typeof ObjectSchema>;
        const stat = await minioClient.statObject(bucket, object);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              size: stat.size,
              etag: stat.etag,
              lastModified: stat.lastModified,
              metaData: stat.metaData,
            }, null, 2),
          }],
        };
      }
      
      case 'presigned_get_object': {
        const { bucket, object, expiry } = args as z.infer<typeof PresignedUrlSchema>;
        const url = await minioClient.presignedGetObject(bucket, object, expiry);
        return {
          content: [{
            type: 'text',
            text: `Presigned GET URL (expires in ${expiry} seconds):\n${url}`,
          }],
        };
      }
      
      case 'presigned_put_object': {
        const { bucket, object, expiry } = args as z.infer<typeof PresignedUrlSchema>;
        const url = await minioClient.presignedPutObject(bucket, object, expiry);
        return {
          content: [{
            type: 'text',
            text: `Presigned PUT URL (expires in ${expiry} seconds):\n${url}`,
          }],
        };
      }
      
      case 'get_object_tags': {
        const { bucket, object } = args as z.infer<typeof ObjectSchema>;
        const tags = await minioClient.getObjectTagging(bucket, object);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tags, null, 2),
          }],
        };
      }
      
      case 'set_object_tags': {
        const { bucket, object, tags } = args as { bucket: string; object: string; tags: Record<string, string> };
        await minioClient.setObjectTagging(bucket, object, tags);
        return {
          content: [{
            type: 'text',
            text: `Tags set for object '${object}' in bucket '${bucket}'.`,
          }],
        };
      }
      
      case 'bucket_usage': {
        const { bucket } = args as z.infer<typeof BucketSchema>;
        const stream = minioClient.listObjectsV2(bucket, '', true);
        let totalSize = 0;
        let objectCount = 0;
        
        return new Promise((resolve, reject) => {
          stream.on('data', (obj) => {
            totalSize += obj.size;
            objectCount++;
          });
          
          stream.on('error', reject);
          
          stream.on('end', () => {
            resolve({
              content: [{
                type: 'text',
                text: JSON.stringify({
                  bucket,
                  objectCount,
                  totalSize,
                  totalSizeHuman: formatBytes(totalSize),
                }, null, 2),
              }],
            });
          });
        });
      }
      
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    
    if (error instanceof McpError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new McpError(
      ErrorCode.InternalError,
      `S3 operation failed: ${errorMessage}`
    );
  }
});

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Start the server
async function main() {
  try {
    // Initialize the S3 client
    initializeClient();
    
    // Test the connection by listing buckets
    try {
      await minioClient.listBuckets();
      console.error('S3 connection established');
    } catch (error) {
      console.error('Warning: Could not connect to S3 endpoint:', error);
      console.error('The server will start but operations may fail until S3 endpoint is accessible');
    }
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('S3 MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  process.exit(0);
});

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});