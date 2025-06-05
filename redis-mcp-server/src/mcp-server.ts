#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import Redis from 'ioredis';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getRedisOptions, loadConfig } from './config-loader.js';

// Initialize Redis client
let redis: Redis | any; // Using any for Cluster type compatibility
let pubClient: Redis | undefined;
let subClient: Redis | undefined;

/**
 * Initialize Redis connection
 */
function initializeRedis() {
  const options = getRedisOptions();
  const config = loadConfig();
  
  if (config.cluster) {
    redis = new Redis.Cluster(options.clusters, options);
  } else {
    redis = new Redis(options);
  }
  
  redis.on('error', (err: Error) => {
    console.error('Redis connection error:', err);
  });
  
  redis.on('connect', () => {
    console.error('Connected to Redis');
  });
}

/**
 * Format value based on type
 */
function formatValue(value: any): any {
  if (value === null) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  // Try to parse as JSON
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// Tool schemas
const KeyPatternSchema = z.object({
  pattern: z.string().default('*').describe('Pattern to match keys (e.g., "user:*", "*:session")')
});

const GetSetSchema = z.object({
  key: z.string().describe('Key to get/set'),
  value: z.any().optional().describe('Value to set (for SET operation)'),
  ex: z.number().optional().describe('Expiration in seconds'),
  px: z.number().optional().describe('Expiration in milliseconds'),
  nx: z.boolean().optional().describe('Only set if key does not exist'),
  xx: z.boolean().optional().describe('Only set if key exists'),
  get: z.boolean().optional().describe('Return old value (SET only)')
});

const ListSchema = z.object({
  key: z.string().describe('List key'),
  value: z.any().optional().describe('Value(s) to push'),
  values: z.array(z.any()).optional().describe('Multiple values to push'),
  index: z.number().optional().describe('Index for operations'),
  count: z.number().optional().describe('Count for operations'),
  start: z.number().optional().describe('Start index for range'),
  stop: z.number().optional().describe('Stop index for range'),
  pivot: z.any().optional().describe('Pivot value for insert operations'),
  before: z.boolean().optional().describe('Insert before pivot')
});

const HashSchema = z.object({
  key: z.string().describe('Hash key'),
  field: z.string().optional().describe('Hash field'),
  value: z.any().optional().describe('Field value'),
  fields: z.record(z.any()).optional().describe('Multiple field-value pairs')
});

const SetSchema = z.object({
  key: z.string().describe('Set key'),
  member: z.any().optional().describe('Set member'),
  members: z.array(z.any()).optional().describe('Multiple set members'),
  count: z.number().optional().describe('Count for random members'),
  destination: z.string().optional().describe('Destination key for operations')
});

const SortedSetSchema = z.object({
  key: z.string().describe('Sorted set key'),
  member: z.any().optional().describe('Member'),
  score: z.number().optional().describe('Score'),
  members: z.array(z.object({
    score: z.number(),
    member: z.any()
  })).optional().describe('Multiple score-member pairs'),
  min: z.union([z.number(), z.string()]).optional().describe('Minimum score/value'),
  max: z.union([z.number(), z.string()]).optional().describe('Maximum score/value'),
  offset: z.number().optional().describe('Offset for range queries'),
  count: z.number().optional().describe('Count/limit for operations'),
  withScores: z.boolean().optional().describe('Include scores in result')
});

const StreamSchema = z.object({
  key: z.string().describe('Stream key'),
  id: z.string().optional().describe('Entry ID (use * for auto-generate)'),
  fields: z.record(z.any()).optional().describe('Field-value pairs for the entry'),
  start: z.string().optional().describe('Start ID for range queries'),
  end: z.string().optional().describe('End ID for range queries'),
  count: z.number().optional().describe('Maximum entries to return'),
  consumer: z.string().optional().describe('Consumer name'),
  group: z.string().optional().describe('Consumer group name')
});

const PubSubSchema = z.object({
  channel: z.string().describe('Channel name'),
  message: z.any().optional().describe('Message to publish'),
  pattern: z.string().optional().describe('Pattern for pattern-based subscriptions')
});

const TransactionSchema = z.object({
  commands: z.array(z.object({
    command: z.string().describe('Redis command'),
    args: z.array(z.any()).describe('Command arguments')
  })).describe('Commands to execute in transaction')
});

const ScriptSchema = z.object({
  script: z.string().describe('Lua script'),
  keys: z.array(z.string()).optional().describe('Keys for the script'),
  args: z.array(z.any()).optional().describe('Arguments for the script')
});

// Create server instance
const server = new Server(
  {
    name: 'redis-mcp-server',
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
      // Key operations
      {
        name: 'keys',
        description: 'Find all keys matching a pattern',
        inputSchema: zodToJsonSchema(KeyPatternSchema),
      },
      {
        name: 'exists',
        description: 'Check if keys exist',
        inputSchema: zodToJsonSchema(z.object({
          keys: z.array(z.string()).describe('Keys to check')
        })),
      },
      {
        name: 'del',
        description: 'Delete one or more keys',
        inputSchema: zodToJsonSchema(z.object({
          keys: z.array(z.string()).describe('Keys to delete')
        })),
      },
      {
        name: 'expire',
        description: 'Set expiration on a key',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Key to expire'),
          seconds: z.number().describe('Expiration in seconds')
        })),
      },
      {
        name: 'ttl',
        description: 'Get time to live for a key',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Key to check TTL')
        })),
      },
      {
        name: 'type',
        description: 'Get the type of a key',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Key to check type')
        })),
      },
      {
        name: 'rename',
        description: 'Rename a key',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Current key name'),
          newKey: z.string().describe('New key name'),
          nx: z.boolean().optional().describe('Only rename if new key does not exist')
        })),
      },
      // String operations
      {
        name: 'get',
        description: 'Get the value of a key',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Key to get')
        })),
      },
      {
        name: 'set',
        description: 'Set the value of a key with optional expiration',
        inputSchema: zodToJsonSchema(GetSetSchema),
      },
      {
        name: 'mget',
        description: 'Get values of multiple keys',
        inputSchema: zodToJsonSchema(z.object({
          keys: z.array(z.string()).describe('Keys to get')
        })),
      },
      {
        name: 'mset',
        description: 'Set multiple key-value pairs',
        inputSchema: zodToJsonSchema(z.object({
          data: z.record(z.any()).describe('Object with key-value pairs')
        })),
      },
      {
        name: 'incr',
        description: 'Increment a number stored at key',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Key to increment'),
          by: z.number().optional().describe('Increment by value (default: 1)')
        })),
      },
      {
        name: 'decr',
        description: 'Decrement a number stored at key',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Key to decrement'),
          by: z.number().optional().describe('Decrement by value (default: 1)')
        })),
      },
      // List operations
      {
        name: 'lpush',
        description: 'Push values to the left of a list',
        inputSchema: zodToJsonSchema(ListSchema),
      },
      {
        name: 'rpush',
        description: 'Push values to the right of a list',
        inputSchema: zodToJsonSchema(ListSchema),
      },
      {
        name: 'lpop',
        description: 'Pop value from the left of a list',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('List key'),
          count: z.number().optional().describe('Number of elements to pop')
        })),
      },
      {
        name: 'rpop',
        description: 'Pop value from the right of a list',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('List key'),
          count: z.number().optional().describe('Number of elements to pop')
        })),
      },
      {
        name: 'lrange',
        description: 'Get a range of elements from a list',
        inputSchema: zodToJsonSchema(ListSchema),
      },
      {
        name: 'llen',
        description: 'Get the length of a list',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('List key')
        })),
      },
      {
        name: 'lindex',
        description: 'Get element at index in a list',
        inputSchema: zodToJsonSchema(ListSchema),
      },
      {
        name: 'lset',
        description: 'Set element at index in a list',
        inputSchema: zodToJsonSchema(ListSchema),
      },
      {
        name: 'lrem',
        description: 'Remove elements from a list',
        inputSchema: zodToJsonSchema(ListSchema),
      },
      // Hash operations
      {
        name: 'hget',
        description: 'Get a field value from a hash',
        inputSchema: zodToJsonSchema(HashSchema),
      },
      {
        name: 'hset',
        description: 'Set field(s) in a hash',
        inputSchema: zodToJsonSchema(HashSchema),
      },
      {
        name: 'hmget',
        description: 'Get multiple field values from a hash',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Hash key'),
          fields: z.array(z.string()).describe('Fields to get')
        })),
      },
      {
        name: 'hgetall',
        description: 'Get all fields and values from a hash',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Hash key')
        })),
      },
      {
        name: 'hdel',
        description: 'Delete fields from a hash',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Hash key'),
          fields: z.array(z.string()).describe('Fields to delete')
        })),
      },
      {
        name: 'hkeys',
        description: 'Get all field names from a hash',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Hash key')
        })),
      },
      {
        name: 'hvals',
        description: 'Get all values from a hash',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Hash key')
        })),
      },
      {
        name: 'hlen',
        description: 'Get number of fields in a hash',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Hash key')
        })),
      },
      {
        name: 'hexists',
        description: 'Check if field exists in hash',
        inputSchema: zodToJsonSchema(HashSchema),
      },
      {
        name: 'hincrby',
        description: 'Increment hash field by integer',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Hash key'),
          field: z.string().describe('Field to increment'),
          increment: z.number().describe('Increment value')
        })),
      },
      // Set operations
      {
        name: 'sadd',
        description: 'Add members to a set',
        inputSchema: zodToJsonSchema(SetSchema),
      },
      {
        name: 'srem',
        description: 'Remove members from a set',
        inputSchema: zodToJsonSchema(SetSchema),
      },
      {
        name: 'smembers',
        description: 'Get all members of a set',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Set key')
        })),
      },
      {
        name: 'sismember',
        description: 'Check if member exists in set',
        inputSchema: zodToJsonSchema(SetSchema),
      },
      {
        name: 'scard',
        description: 'Get number of members in set',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Set key')
        })),
      },
      {
        name: 'spop',
        description: 'Remove and return random members from set',
        inputSchema: zodToJsonSchema(SetSchema),
      },
      {
        name: 'srandmember',
        description: 'Get random members from set',
        inputSchema: zodToJsonSchema(SetSchema),
      },
      {
        name: 'sunion',
        description: 'Get union of multiple sets',
        inputSchema: zodToJsonSchema(z.object({
          keys: z.array(z.string()).describe('Set keys to union')
        })),
      },
      {
        name: 'sinter',
        description: 'Get intersection of multiple sets',
        inputSchema: zodToJsonSchema(z.object({
          keys: z.array(z.string()).describe('Set keys to intersect')
        })),
      },
      {
        name: 'sdiff',
        description: 'Get difference of sets',
        inputSchema: zodToJsonSchema(z.object({
          keys: z.array(z.string()).describe('Set keys (first minus others)')
        })),
      },
      // Sorted set operations
      {
        name: 'zadd',
        description: 'Add members to sorted set with scores',
        inputSchema: zodToJsonSchema(SortedSetSchema),
      },
      {
        name: 'zrem',
        description: 'Remove members from sorted set',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Sorted set key'),
          members: z.array(z.any()).describe('Members to remove')
        })),
      },
      {
        name: 'zrange',
        description: 'Get range of members by rank',
        inputSchema: zodToJsonSchema(SortedSetSchema),
      },
      {
        name: 'zrevrange',
        description: 'Get range of members by rank (reverse)',
        inputSchema: zodToJsonSchema(SortedSetSchema),
      },
      {
        name: 'zrangebyscore',
        description: 'Get range of members by score',
        inputSchema: zodToJsonSchema(SortedSetSchema),
      },
      {
        name: 'zcard',
        description: 'Get number of members in sorted set',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Sorted set key')
        })),
      },
      {
        name: 'zscore',
        description: 'Get score of member in sorted set',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Sorted set key'),
          member: z.any().describe('Member to get score for')
        })),
      },
      {
        name: 'zrank',
        description: 'Get rank of member in sorted set',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Sorted set key'),
          member: z.any().describe('Member to get rank for')
        })),
      },
      {
        name: 'zincrby',
        description: 'Increment score of member in sorted set',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Sorted set key'),
          increment: z.number().describe('Score increment'),
          member: z.any().describe('Member to increment')
        })),
      },
      // Stream operations
      {
        name: 'xadd',
        description: 'Add entry to a stream',
        inputSchema: zodToJsonSchema(StreamSchema),
      },
      {
        name: 'xread',
        description: 'Read entries from streams',
        inputSchema: zodToJsonSchema(z.object({
          streams: z.record(z.string()).describe('Object of stream keys to IDs'),
          count: z.number().optional().describe('Max entries per stream'),
          block: z.number().optional().describe('Block for milliseconds')
        })),
      },
      {
        name: 'xrange',
        description: 'Get range of entries from stream',
        inputSchema: zodToJsonSchema(StreamSchema),
      },
      {
        name: 'xlen',
        description: 'Get length of stream',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Stream key')
        })),
      },
      // Pub/Sub operations
      {
        name: 'publish',
        description: 'Publish message to a channel',
        inputSchema: zodToJsonSchema(PubSubSchema),
      },
      // Geo operations
      {
        name: 'geoadd',
        description: 'Add geo locations',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Geo key'),
          locations: z.array(z.object({
            longitude: z.number(),
            latitude: z.number(),
            member: z.string()
          })).describe('Array of locations to add')
        })),
      },
      {
        name: 'geodist',
        description: 'Get distance between geo members',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Geo key'),
          member1: z.string().describe('First member'),
          member2: z.string().describe('Second member'),
          unit: z.enum(['m', 'km', 'mi', 'ft']).optional().describe('Unit (default: m)')
        })),
      },
      {
        name: 'georadius',
        description: 'Query geo members by radius',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('Geo key'),
          longitude: z.number().describe('Center longitude'),
          latitude: z.number().describe('Center latitude'),
          radius: z.number().describe('Search radius'),
          unit: z.enum(['m', 'km', 'mi', 'ft']).describe('Radius unit'),
          count: z.number().optional().describe('Limit results'),
          sort: z.enum(['ASC', 'DESC']).optional().describe('Sort by distance'),
          withCoord: z.boolean().optional().describe('Include coordinates'),
          withDist: z.boolean().optional().describe('Include distance')
        })),
      },
      // HyperLogLog operations
      {
        name: 'pfadd',
        description: 'Add elements to HyperLogLog',
        inputSchema: zodToJsonSchema(z.object({
          key: z.string().describe('HyperLogLog key'),
          elements: z.array(z.any()).describe('Elements to add')
        })),
      },
      {
        name: 'pfcount',
        description: 'Get cardinality estimate from HyperLogLog',
        inputSchema: zodToJsonSchema(z.object({
          keys: z.array(z.string()).describe('HyperLogLog keys')
        })),
      },
      // Transaction operations
      {
        name: 'multi_exec',
        description: 'Execute multiple commands in a transaction',
        inputSchema: zodToJsonSchema(TransactionSchema),
      },
      // Script operations
      {
        name: 'eval',
        description: 'Execute a Lua script',
        inputSchema: zodToJsonSchema(ScriptSchema),
      },
      // Server operations
      {
        name: 'flushdb',
        description: 'Delete all keys in current database',
        inputSchema: zodToJsonSchema(z.object({
          async: z.boolean().optional().describe('Flush asynchronously')
        })),
      },
      {
        name: 'dbsize',
        description: 'Get number of keys in database',
        inputSchema: zodToJsonSchema(z.object({})),
      },
      {
        name: 'info',
        description: 'Get Redis server information',
        inputSchema: zodToJsonSchema(z.object({
          section: z.string().optional().describe('Specific section (e.g., "server", "clients", "memory")')
        })),
      },
      {
        name: 'ping',
        description: 'Ping the Redis server',
        inputSchema: zodToJsonSchema(z.object({
          message: z.string().optional().describe('Optional message to echo')
        })),
      },
      {
        name: 'config_get',
        description: 'Get Redis configuration',
        inputSchema: zodToJsonSchema(z.object({
          parameter: z.string().describe('Config parameter pattern')
        })),
      },
      {
        name: 'config_set',
        description: 'Set Redis configuration',
        inputSchema: zodToJsonSchema(z.object({
          parameter: z.string().describe('Config parameter'),
          value: z.string().describe('Parameter value')
        })),
      },
      {
        name: 'scan',
        description: 'Incrementally iterate over keys',
        inputSchema: zodToJsonSchema(z.object({
          cursor: z.string().default('0').describe('Cursor position'),
          match: z.string().optional().describe('Pattern to match'),
          count: z.number().optional().describe('Hint for number of keys to return'),
          type: z.string().optional().describe('Filter by key type')
        }))
      }
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Key operations
      case 'keys': {
        const { pattern } = KeyPatternSchema.parse(args);
        const keys = await redis.keys(pattern);
        return { content: [{ type: 'text', text: JSON.stringify(keys, null, 2) }] };
      }

      case 'exists': {
        const { keys } = z.object({ keys: z.array(z.string()) }).parse(args);
        const count = await redis.exists(...keys);
        return { content: [{ type: 'text', text: JSON.stringify({ exists: count, total: keys.length }, null, 2) }] };
      }

      case 'del': {
        const { keys } = z.object({ keys: z.array(z.string()) }).parse(args);
        const count = await redis.del(...keys);
        return { content: [{ type: 'text', text: JSON.stringify({ deleted: count }, null, 2) }] };
      }

      case 'expire': {
        const { key, seconds } = z.object({ key: z.string(), seconds: z.number() }).parse(args);
        const result = await redis.expire(key, seconds);
        return { content: [{ type: 'text', text: JSON.stringify({ success: result === 1 }, null, 2) }] };
      }

      case 'ttl': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const ttl = await redis.ttl(key);
        return { content: [{ type: 'text', text: JSON.stringify({ ttl, exists: ttl !== -2, hasExpiration: ttl !== -1 }, null, 2) }] };
      }

      case 'type': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const type = await redis.type(key);
        return { content: [{ type: 'text', text: JSON.stringify({ type }, null, 2) }] };
      }

      case 'rename': {
        const { key, newKey, nx } = z.object({ 
          key: z.string(), 
          newKey: z.string(),
          nx: z.boolean().optional()
        }).parse(args);
        
        if (nx) {
          const result = await redis.renamenx(key, newKey);
          return { content: [{ type: 'text', text: JSON.stringify({ success: result === 1 }, null, 2) }] };
        } else {
          await redis.rename(key, newKey);
          return { content: [{ type: 'text', text: JSON.stringify({ success: true }, null, 2) }] };
        }
      }

      // String operations
      case 'get': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const value = await redis.get(key);
        return { content: [{ type: 'text', text: JSON.stringify({ key, value: formatValue(value) }, null, 2) }] };
      }

      case 'set': {
        const { key, value, ex, px, nx, xx, get } = GetSetSchema.parse(args);
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        const options: any = {};
        if (ex) options.EX = ex;
        if (px) options.PX = px;
        if (nx) options.NX = true;
        if (xx) options.XX = true;
        if (get) options.GET = true;
        
        let result;
        if (Object.keys(options).length > 0) {
          result = await redis.set(key, stringValue, options);
        } else {
          result = await redis.set(key, stringValue);
        }
        
        return { content: [{ type: 'text', text: JSON.stringify({ success: result === 'OK' || !!result, oldValue: get ? result : undefined }, null, 2) }] };
      }

      case 'mget': {
        const { keys } = z.object({ keys: z.array(z.string()) }).parse(args);
        const values = await redis.mget(...keys);
        const result = keys.reduce((acc, key, index) => {
          acc[key] = formatValue(values[index]);
          return acc;
        }, {} as Record<string, any>);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'mset': {
        const { data } = z.object({ data: z.record(z.any()) }).parse(args);
        const flatData: string[] = [];
        for (const [key, value] of Object.entries(data)) {
          flatData.push(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
        await redis.mset(...flatData);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, count: Object.keys(data).length }, null, 2) }] };
      }

      case 'incr': {
        const { key, by } = z.object({ key: z.string(), by: z.number().optional() }).parse(args);
        const result = by ? await redis.incrby(key, by) : await redis.incr(key);
        return { content: [{ type: 'text', text: JSON.stringify({ value: result }, null, 2) }] };
      }

      case 'decr': {
        const { key, by } = z.object({ key: z.string(), by: z.number().optional() }).parse(args);
        const result = by ? await redis.decrby(key, by) : await redis.decr(key);
        return { content: [{ type: 'text', text: JSON.stringify({ value: result }, null, 2) }] };
      }

      // List operations
      case 'lpush': {
        const { key, value, values } = ListSchema.parse(args);
        const items = values || (value !== undefined ? [value] : []);
        const stringItems = items.map(v => typeof v === 'string' ? v : JSON.stringify(v));
        const length = await redis.lpush(key, ...stringItems);
        return { content: [{ type: 'text', text: JSON.stringify({ length }, null, 2) }] };
      }

      case 'rpush': {
        const { key, value, values } = ListSchema.parse(args);
        const items = values || (value !== undefined ? [value] : []);
        const stringItems = items.map(v => typeof v === 'string' ? v : JSON.stringify(v));
        const length = await redis.rpush(key, ...stringItems);
        return { content: [{ type: 'text', text: JSON.stringify({ length }, null, 2) }] };
      }

      case 'lpop': {
        const { key, count } = z.object({ key: z.string(), count: z.number().optional() }).parse(args);
        const result = count ? await redis.lpop(key, count) : await redis.lpop(key);
        return { content: [{ type: 'text', text: JSON.stringify({ value: formatValue(result) }, null, 2) }] };
      }

      case 'rpop': {
        const { key, count } = z.object({ key: z.string(), count: z.number().optional() }).parse(args);
        const result = count ? await redis.rpop(key, count) : await redis.rpop(key);
        return { content: [{ type: 'text', text: JSON.stringify({ value: formatValue(result) }, null, 2) }] };
      }

      case 'lrange': {
        const { key, start = 0, stop = -1 } = ListSchema.parse(args);
        const values = await redis.lrange(key, start, stop);
        return { content: [{ type: 'text', text: JSON.stringify(values.map(formatValue), null, 2) }] };
      }

      case 'llen': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const length = await redis.llen(key);
        return { content: [{ type: 'text', text: JSON.stringify({ length }, null, 2) }] };
      }

      case 'lindex': {
        const { key, index = 0 } = ListSchema.parse(args);
        const value = await redis.lindex(key, index);
        return { content: [{ type: 'text', text: JSON.stringify({ value: formatValue(value) }, null, 2) }] };
      }

      case 'lset': {
        const { key, index = 0, value } = ListSchema.parse(args);
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        await redis.lset(key, index, stringValue);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true }, null, 2) }] };
      }

      case 'lrem': {
        const { key, count = 0, value } = ListSchema.parse(args);
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        const removed = await redis.lrem(key, count, stringValue);
        return { content: [{ type: 'text', text: JSON.stringify({ removed }, null, 2) }] };
      }

      // Hash operations
      case 'hget': {
        const { key, field } = HashSchema.parse(args);
        const value = await redis.hget(key, field!);
        return { content: [{ type: 'text', text: JSON.stringify({ value: formatValue(value) }, null, 2) }] };
      }

      case 'hset': {
        const { key, field, value, fields } = HashSchema.parse(args);
        if (fields) {
          const flatData: string[] = [];
          for (const [f, v] of Object.entries(fields)) {
            flatData.push(f, typeof v === 'string' ? v : JSON.stringify(v));
          }
          const result = await redis.hset(key, ...flatData);
          return { content: [{ type: 'text', text: JSON.stringify({ fieldsAdded: result }, null, 2) }] };
        } else {
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          const result = await redis.hset(key, field!, stringValue);
          return { content: [{ type: 'text', text: JSON.stringify({ newField: result === 1 }, null, 2) }] };
        }
      }

      case 'hmget': {
        const { key, fields } = z.object({ key: z.string(), fields: z.array(z.string()) }).parse(args);
        const values = await redis.hmget(key, ...fields);
        const result = fields.reduce((acc, field, index) => {
          acc[field] = formatValue(values[index]);
          return acc;
        }, {} as Record<string, any>);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'hgetall': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const data = await redis.hgetall(key);
        const formatted = Object.entries(data).reduce((acc, [field, value]) => {
          acc[field] = formatValue(value);
          return acc;
        }, {} as Record<string, any>);
        return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
      }

      case 'hdel': {
        const { key, fields } = z.object({ key: z.string(), fields: z.array(z.string()) }).parse(args);
        const deleted = await redis.hdel(key, ...fields);
        return { content: [{ type: 'text', text: JSON.stringify({ deleted }, null, 2) }] };
      }

      case 'hkeys': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const fields = await redis.hkeys(key);
        return { content: [{ type: 'text', text: JSON.stringify(fields, null, 2) }] };
      }

      case 'hvals': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const values = await redis.hvals(key);
        return { content: [{ type: 'text', text: JSON.stringify(values.map(formatValue), null, 2) }] };
      }

      case 'hlen': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const length = await redis.hlen(key);
        return { content: [{ type: 'text', text: JSON.stringify({ length }, null, 2) }] };
      }

      case 'hexists': {
        const { key, field } = HashSchema.parse(args);
        const exists = await redis.hexists(key, field!);
        return { content: [{ type: 'text', text: JSON.stringify({ exists: exists === 1 }, null, 2) }] };
      }

      case 'hincrby': {
        const { key, field, increment } = z.object({
          key: z.string(),
          field: z.string(),
          increment: z.number()
        }).parse(args);
        const value = await redis.hincrby(key, field, increment);
        return { content: [{ type: 'text', text: JSON.stringify({ value }, null, 2) }] };
      }

      // Set operations
      case 'sadd': {
        const { key, member, members } = SetSchema.parse(args);
        const items = members || (member !== undefined ? [member] : []);
        const stringItems = items.map(v => typeof v === 'string' ? v : JSON.stringify(v));
        const added = await redis.sadd(key, ...stringItems);
        return { content: [{ type: 'text', text: JSON.stringify({ added }, null, 2) }] };
      }

      case 'srem': {
        const { key, member, members } = SetSchema.parse(args);
        const items = members || (member !== undefined ? [member] : []);
        const stringItems = items.map(v => typeof v === 'string' ? v : JSON.stringify(v));
        const removed = await redis.srem(key, ...stringItems);
        return { content: [{ type: 'text', text: JSON.stringify({ removed }, null, 2) }] };
      }

      case 'smembers': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const members = await redis.smembers(key);
        return { content: [{ type: 'text', text: JSON.stringify(members.map(formatValue), null, 2) }] };
      }

      case 'sismember': {
        const { key, member } = SetSchema.parse(args);
        const stringMember = typeof member === 'string' ? member : JSON.stringify(member);
        const isMember = await redis.sismember(key, stringMember);
        return { content: [{ type: 'text', text: JSON.stringify({ isMember: isMember === 1 }, null, 2) }] };
      }

      case 'scard': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const count = await redis.scard(key);
        return { content: [{ type: 'text', text: JSON.stringify({ count }, null, 2) }] };
      }

      case 'spop': {
        const { key, count } = SetSchema.parse(args);
        const result = count ? await redis.spop(key, count) : await redis.spop(key);
        return { content: [{ type: 'text', text: JSON.stringify({ members: Array.isArray(result) ? result.map(formatValue) : formatValue(result) }, null, 2) }] };
      }

      case 'srandmember': {
        const { key, count } = SetSchema.parse(args);
        const result = count ? await redis.srandmember(key, count) : await redis.srandmember(key);
        return { content: [{ type: 'text', text: JSON.stringify({ members: Array.isArray(result) ? result.map(formatValue) : formatValue(result) }, null, 2) }] };
      }

      case 'sunion': {
        const { keys } = z.object({ keys: z.array(z.string()) }).parse(args);
        const members = await redis.sunion(...keys);
        return { content: [{ type: 'text', text: JSON.stringify(members.map(formatValue), null, 2) }] };
      }

      case 'sinter': {
        const { keys } = z.object({ keys: z.array(z.string()) }).parse(args);
        const members = await redis.sinter(...keys);
        return { content: [{ type: 'text', text: JSON.stringify(members.map(formatValue), null, 2) }] };
      }

      case 'sdiff': {
        const { keys } = z.object({ keys: z.array(z.string()) }).parse(args);
        const members = await redis.sdiff(...keys);
        return { content: [{ type: 'text', text: JSON.stringify(members.map(formatValue), null, 2) }] };
      }

      // Sorted set operations
      case 'zadd': {
        const { key, member, score, members } = SortedSetSchema.parse(args);
        if (members) {
          const args: (string | number)[] = [];
          members.forEach(({ score, member }) => {
            args.push(score, typeof member === 'string' ? member : JSON.stringify(member));
          });
          const added = await redis.zadd(key, ...args);
          return { content: [{ type: 'text', text: JSON.stringify({ added }, null, 2) }] };
        } else {
          const stringMember = typeof member === 'string' ? member : JSON.stringify(member);
          const added = await redis.zadd(key, score!, stringMember);
          return { content: [{ type: 'text', text: JSON.stringify({ added }, null, 2) }] };
        }
      }

      case 'zrem': {
        const { key, members } = z.object({ key: z.string(), members: z.array(z.any()) }).parse(args);
        const stringMembers = members.map(m => typeof m === 'string' ? m : JSON.stringify(m));
        const removed = await redis.zrem(key, ...stringMembers);
        return { content: [{ type: 'text', text: JSON.stringify({ removed }, null, 2) }] };
      }

      case 'zrange': {
        const { key, min = 0, max = -1, withScores } = SortedSetSchema.parse(args);
        const result = withScores 
          ? await redis.zrange(key, min as number, max as number, 'WITHSCORES')
          : await redis.zrange(key, min as number, max as number);
        
        if (withScores && Array.isArray(result)) {
          const formatted = [];
          for (let i = 0; i < result.length; i += 2) {
            formatted.push({
              member: formatValue(result[i]),
              score: parseFloat(result[i + 1])
            });
          }
          return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
        }
        
        return { content: [{ type: 'text', text: JSON.stringify(result.map(formatValue), null, 2) }] };
      }

      case 'zrevrange': {
        const { key, min = 0, max = -1, withScores } = SortedSetSchema.parse(args);
        const result = withScores 
          ? await redis.zrevrange(key, min as number, max as number, 'WITHSCORES')
          : await redis.zrevrange(key, min as number, max as number);
        
        if (withScores && Array.isArray(result)) {
          const formatted = [];
          for (let i = 0; i < result.length; i += 2) {
            formatted.push({
              member: formatValue(result[i]),
              score: parseFloat(result[i + 1])
            });
          }
          return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
        }
        
        return { content: [{ type: 'text', text: JSON.stringify(result.map(formatValue), null, 2) }] };
      }

      case 'zrangebyscore': {
        const { key, min, max, offset, count, withScores } = SortedSetSchema.parse(args);
        const options: any = {};
        if (withScores) options.WITHSCORES = true;
        if (offset !== undefined && count !== undefined) {
          options.LIMIT = { offset, count };
        }
        
        const result = await redis.zrangebyscore(key, min!, max!, options);
        
        if (withScores && Array.isArray(result)) {
          const formatted = [];
          for (let i = 0; i < result.length; i += 2) {
            formatted.push({
              member: formatValue(result[i]),
              score: parseFloat(result[i + 1])
            });
          }
          return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
        }
        
        return { content: [{ type: 'text', text: JSON.stringify(result.map(formatValue), null, 2) }] };
      }

      case 'zcard': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const count = await redis.zcard(key);
        return { content: [{ type: 'text', text: JSON.stringify({ count }, null, 2) }] };
      }

      case 'zscore': {
        const { key, member } = z.object({ key: z.string(), member: z.any() }).parse(args);
        const stringMember = typeof member === 'string' ? member : JSON.stringify(member);
        const score = await redis.zscore(key, stringMember);
        return { content: [{ type: 'text', text: JSON.stringify({ score: score ? parseFloat(score) : null }, null, 2) }] };
      }

      case 'zrank': {
        const { key, member } = z.object({ key: z.string(), member: z.any() }).parse(args);
        const stringMember = typeof member === 'string' ? member : JSON.stringify(member);
        const rank = await redis.zrank(key, stringMember);
        return { content: [{ type: 'text', text: JSON.stringify({ rank }, null, 2) }] };
      }

      case 'zincrby': {
        const { key, increment, member } = z.object({
          key: z.string(),
          increment: z.number(),
          member: z.any()
        }).parse(args);
        const stringMember = typeof member === 'string' ? member : JSON.stringify(member);
        const score = await redis.zincrby(key, increment, stringMember);
        return { content: [{ type: 'text', text: JSON.stringify({ score: parseFloat(score) }, null, 2) }] };
      }

      // Stream operations
      case 'xadd': {
        const { key, id = '*', fields } = StreamSchema.parse(args);
        if (!fields) {
          throw new Error('Fields are required for xadd');
        }
        const xaddArgs: string[] = [];
        for (const [k, v] of Object.entries(fields)) {
          xaddArgs.push(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
        const entryId = await redis.xadd(key, id, ...xaddArgs);
        return { content: [{ type: 'text', text: JSON.stringify({ id: entryId }, null, 2) }] };
      }

      case 'xread': {
        const { streams, count, block } = z.object({
          streams: z.record(z.string()),
          count: z.number().optional(),
          block: z.number().optional()
        }).parse(args);
        
        const streamKeys = Object.keys(streams);
        const streamIds = Object.values(streams);
        
        let result;
        if (block !== undefined) {
          if (count !== undefined) {
            result = await (redis as any).xread('BLOCK', block, 'COUNT', count, 'STREAMS', ...streamKeys, ...streamIds);
          } else {
            result = await (redis as any).xread('BLOCK', block, 'STREAMS', ...streamKeys, ...streamIds);
          }
        } else if (count !== undefined) {
          result = await redis.xread('COUNT', count, 'STREAMS', ...streamKeys, ...streamIds);
        } else {
          result = await redis.xread('STREAMS', ...streamKeys, ...streamIds);
        }
        
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'xrange': {
        const { key, start = '-', end = '+', count } = StreamSchema.parse(args);
        const result = count 
          ? await redis.xrange(key, start, end, 'COUNT', count)
          : await redis.xrange(key, start, end);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'xlen': {
        const { key } = z.object({ key: z.string() }).parse(args);
        const length = await redis.xlen(key);
        return { content: [{ type: 'text', text: JSON.stringify({ length }, null, 2) }] };
      }

      // Pub/Sub operations
      case 'publish': {
        const { channel, message } = PubSubSchema.parse(args);
        const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);
        const subscribers = await redis.publish(channel, stringMessage);
        return { content: [{ type: 'text', text: JSON.stringify({ subscribers }, null, 2) }] };
      }

      // Geo operations
      case 'geoadd': {
        const { key, locations } = z.object({
          key: z.string(),
          locations: z.array(z.object({
            longitude: z.number(),
            latitude: z.number(),
            member: z.string()
          }))
        }).parse(args);
        
        const geoArgs: (string | number)[] = [];
        locations.forEach(({ longitude, latitude, member }) => {
          geoArgs.push(longitude, latitude, member);
        });
        const added = await redis.geoadd(key, ...geoArgs);
        return { content: [{ type: 'text', text: JSON.stringify({ added }, null, 2) }] };
      }

      case 'geodist': {
        const { key, member1, member2, unit = 'm' } = z.object({
          key: z.string(),
          member1: z.string(),
          member2: z.string(),
          unit: z.enum(['m', 'km', 'mi', 'ft']).optional()
        }).parse(args);
        
        const distance = await (redis as any).geodist(key, member1, member2, unit);
        return { content: [{ type: 'text', text: JSON.stringify({ distance: distance ? parseFloat(distance) : null, unit }, null, 2) }] };
      }

      case 'georadius': {
        const { key, longitude, latitude, radius, unit, count, sort, withCoord, withDist } = z.object({
          key: z.string(),
          longitude: z.number(),
          latitude: z.number(),
          radius: z.number(),
          unit: z.enum(['m', 'km', 'mi', 'ft']),
          count: z.number().optional(),
          sort: z.enum(['ASC', 'DESC']).optional(),
          withCoord: z.boolean().optional(),
          withDist: z.boolean().optional()
        }).parse(args);
        
        const options: string[] = [];
        if (withCoord) options.push('WITHCOORD');
        if (withDist) options.push('WITHDIST');
        if (count) options.push('COUNT', count.toString());
        if (sort) options.push(sort);
        
        const result = await redis.georadius(key, longitude, latitude, radius, unit, ...options);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // HyperLogLog operations
      case 'pfadd': {
        const { key, elements } = z.object({
          key: z.string(),
          elements: z.array(z.any())
        }).parse(args);
        const stringElements = elements.map(e => typeof e === 'string' ? e : JSON.stringify(e));
        const modified = await redis.pfadd(key, ...stringElements);
        return { content: [{ type: 'text', text: JSON.stringify({ modified: modified === 1 }, null, 2) }] };
      }

      case 'pfcount': {
        const { keys } = z.object({ keys: z.array(z.string()) }).parse(args);
        const count = await redis.pfcount(...keys);
        return { content: [{ type: 'text', text: JSON.stringify({ count }, null, 2) }] };
      }

      // Transaction operations
      case 'multi_exec': {
        const { commands } = TransactionSchema.parse(args);
        const pipeline = redis.multi();
        
        for (const { command, args } of commands) {
          (pipeline as any)[command.toLowerCase()](...args);
        }
        
        const results = await pipeline.exec();
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      }

      // Script operations
      case 'eval': {
        const { script, keys = [], args: scriptArgs = [] } = ScriptSchema.parse(args);
        const result = await redis.eval(script, keys.length, ...keys, ...scriptArgs);
        return { content: [{ type: 'text', text: JSON.stringify({ result: formatValue(result) }, null, 2) }] };
      }

      // Server operations
      case 'flushdb': {
        const { async } = z.object({ async: z.boolean().optional() }).parse(args);
        if (async) {
          await redis.flushdb('ASYNC');
        } else {
          await redis.flushdb();
        }
        return { content: [{ type: 'text', text: JSON.stringify({ success: true }, null, 2) }] };
      }

      case 'dbsize': {
        const size = await redis.dbsize();
        return { content: [{ type: 'text', text: JSON.stringify({ keys: size }, null, 2) }] };
      }

      case 'info': {
        const { section } = z.object({ section: z.string().optional() }).parse(args);
        const info = section ? await redis.info(section) : await redis.info();
        
        // Parse info string into object
        const infoObj: Record<string, any> = {};
        const sections = info.split('\r\n\r\n');
        
        for (const section of sections) {
          const lines = section.split('\r\n').filter((l: string) => l && !l.startsWith('#'));
          const sectionName = section.match(/^# (.+)$/m)?.[1] || 'general';
          
          infoObj[sectionName] = {};
          for (const line of lines) {
            const [key, value] = line.split(':');
            if (key && value) {
              infoObj[sectionName][key] = value;
            }
          }
        }
        
        return { content: [{ type: 'text', text: JSON.stringify(infoObj, null, 2) }] };
      }

      case 'ping': {
        const { message } = z.object({ message: z.string().optional() }).parse(args);
        const result = message ? await redis.ping(message) : await redis.ping();
        return { content: [{ type: 'text', text: JSON.stringify({ response: result }, null, 2) }] };
      }

      case 'config_get': {
        const { parameter } = z.object({ parameter: z.string() }).parse(args);
        const config = await redis.config('GET', parameter) as string[];
        
        // Convert array to object
        const configObj: Record<string, string> = {};
        for (let i = 0; i < config.length; i += 2) {
          configObj[config[i]] = config[i + 1];
        }
        
        return { content: [{ type: 'text', text: JSON.stringify(configObj, null, 2) }] };
      }

      case 'config_set': {
        const { parameter, value } = z.object({
          parameter: z.string(),
          value: z.string()
        }).parse(args);
        await redis.config('SET', parameter, value);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true }, null, 2) }] };
      }

      case 'scan': {
        const { cursor = '0', match, count, type } = z.object({
          cursor: z.string().default('0'),
          match: z.string().optional(),
          count: z.number().optional(),
          type: z.string().optional()
        }).parse(args);
        
        const options: string[] = [];
        if (match) {
          options.push('MATCH', match);
        }
        if (count) {
          options.push('COUNT', count.toString());
        }
        if (type) {
          options.push('TYPE', type);
        }
        
        const result = await (redis as any).scan(cursor, ...options);
        const [nextCursor, keys] = result;
        return { content: [{ type: 'text', text: JSON.stringify({ cursor: nextCursor, keys }, null, 2) }] };
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
      `Redis operation failed: ${errorMessage}`
    );
  }
});

// Start the server
async function main() {
  try {
    // Initialize Redis connection
    initializeRedis();
    
    // Test the connection
    await redis.ping();
    console.error('Redis connection established');
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Redis MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  if (redis) {
    redis.disconnect();
  }
  if (pubClient) {
    pubClient.disconnect();
  }
  if (subClient) {
    subClient.disconnect();
  }
  process.exit(0);
});

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});