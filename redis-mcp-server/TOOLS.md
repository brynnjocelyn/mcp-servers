# Redis MCP Server Tools Reference

This document provides comprehensive documentation for all 70+ tools available in the Redis MCP server.

## Table of Contents

1. [Key Operations](#key-operations)
2. [String Operations](#string-operations)
3. [List Operations](#list-operations)
4. [Hash Operations](#hash-operations)
5. [Set Operations](#set-operations)
6. [Sorted Set Operations](#sorted-set-operations)
7. [Stream Operations](#stream-operations)
8. [Geo Operations](#geo-operations)
9. [HyperLogLog Operations](#hyperloglog-operations)
10. [Pub/Sub Operations](#pubsub-operations)
11. [Transaction Operations](#transaction-operations)
12. [Script Operations](#script-operations)
13. [Server Operations](#server-operations)

---

## Key Operations

### `keys`
Find all keys matching a pattern.

**Parameters:**
- `pattern` (string, default: "*"): Pattern to match keys (e.g., "user:*", "*:session")

**Examples:**
```json
// Get all keys
{
  "tool": "keys",
  "arguments": {
    "pattern": "*"
  }
}

// Get all user keys
{
  "tool": "keys",
  "arguments": {
    "pattern": "user:*"
  }
}

// Get keys ending with :session
{
  "tool": "keys",
  "arguments": {
    "pattern": "*:session"
  }
}
```

**Returns:**
```json
["user:123", "user:456", "user:789"]
```

### `exists`
Check if one or more keys exist.

**Parameters:**
- `keys` (array, required): Array of keys to check

**Example:**
```json
{
  "tool": "exists",
  "arguments": {
    "keys": ["user:123", "user:456", "nonexistent"]
  }
}
```

**Returns:**
```json
{
  "exists": 2,
  "total": 3
}
```

### `del`
Delete one or more keys.

**Parameters:**
- `keys` (array, required): Keys to delete

**Example:**
```json
{
  "tool": "del",
  "arguments": {
    "keys": ["temp:123", "cache:old", "session:expired"]
  }
}
```

**Returns:**
```json
{
  "deleted": 3
}
```

### `expire`
Set a key's time to live in seconds.

**Parameters:**
- `key` (string, required): Key to expire
- `seconds` (number, required): TTL in seconds

**Example:**
```json
{
  "tool": "expire",
  "arguments": {
    "key": "session:abc123",
    "seconds": 3600
  }
}
```

**Returns:**
```json
{
  "success": true
}
```

### `ttl`
Get the time to live for a key in seconds.

**Parameters:**
- `key` (string, required): Key to check

**Example:**
```json
{
  "tool": "ttl",
  "arguments": {
    "key": "session:abc123"
  }
}
```

**Returns:**
```json
{
  "ttl": 3542,
  "exists": true,
  "hasExpiration": true
}
```

### `type`
Determine the type stored at key.

**Parameters:**
- `key` (string, required): Key to check

**Example:**
```json
{
  "tool": "type",
  "arguments": {
    "key": "mylist"
  }
}
```

**Returns:**
```json
{
  "type": "list"
}
```

### `rename`
Rename a key.

**Parameters:**
- `key` (string, required): Current key name
- `newKey` (string, required): New key name
- `nx` (boolean, optional): Only rename if new key doesn't exist

**Examples:**
```json
// Simple rename
{
  "tool": "rename",
  "arguments": {
    "key": "old_name",
    "newKey": "new_name"
  }
}

// Rename only if new key doesn't exist
{
  "tool": "rename",
  "arguments": {
    "key": "old_name",
    "newKey": "new_name",
    "nx": true
  }
}
```

---

## String Operations

### `get`
Get the value of a key.

**Parameters:**
- `key` (string, required): Key to retrieve

**Example:**
```json
{
  "tool": "get",
  "arguments": {
    "key": "user:123:name"
  }
}
```

**Returns:**
```json
{
  "key": "user:123:name",
  "value": "John Doe"
}
```

### `set`
Set the string value of a key with optional expiration and conditions.

**Parameters:**
- `key` (string, required): Key to set
- `value` (any, required): Value to set (automatically JSON stringified if object)
- `ex` (number, optional): Expiration in seconds
- `px` (number, optional): Expiration in milliseconds
- `nx` (boolean, optional): Only set if key doesn't exist
- `xx` (boolean, optional): Only set if key exists
- `get` (boolean, optional): Return old value

**Examples:**
```json
// Simple set
{
  "tool": "set",
  "arguments": {
    "key": "name",
    "value": "John Doe"
  }
}

// Set with expiration
{
  "tool": "set",
  "arguments": {
    "key": "session:123",
    "value": { "user": "john", "role": "admin" },
    "ex": 3600
  }
}

// Set only if doesn't exist
{
  "tool": "set",
  "arguments": {
    "key": "lock:resource",
    "value": "process-123",
    "nx": true,
    "ex": 30
  }
}

// Set and get old value
{
  "tool": "set",
  "arguments": {
    "key": "counter",
    "value": 100,
    "get": true
  }
}
```

### `mget`
Get the values of multiple keys.

**Parameters:**
- `keys` (array, required): Keys to retrieve

**Example:**
```json
{
  "tool": "mget",
  "arguments": {
    "keys": ["user:1:name", "user:1:email", "user:1:age"]
  }
}
```

**Returns:**
```json
{
  "user:1:name": "John Doe",
  "user:1:email": "john@example.com",
  "user:1:age": "30"
}
```

### `mset`
Set multiple keys to multiple values.

**Parameters:**
- `data` (object, required): Object with key-value pairs

**Example:**
```json
{
  "tool": "mset",
  "arguments": {
    "data": {
      "user:1:name": "John Doe",
      "user:1:email": "john@example.com",
      "user:1:lastLogin": "2024-01-15T10:30:00Z"
    }
  }
}
```

### `incr`
Increment the integer value of a key.

**Parameters:**
- `key` (string, required): Key to increment
- `by` (number, optional): Increment amount (default: 1)

**Examples:**
```json
// Increment by 1
{
  "tool": "incr",
  "arguments": {
    "key": "page:views"
  }
}

// Increment by specific amount
{
  "tool": "incr",
  "arguments": {
    "key": "user:123:points",
    "by": 10
  }
}
```

### `decr`
Decrement the integer value of a key.

**Parameters:**
- `key` (string, required): Key to decrement
- `by` (number, optional): Decrement amount (default: 1)

**Example:**
```json
{
  "tool": "decr",
  "arguments": {
    "key": "inventory:item:123",
    "by": 5
  }
}
```

---

## List Operations

### `lpush`
Insert values at the head of a list.

**Parameters:**
- `key` (string, required): List key
- `value` (any, optional): Single value to push
- `values` (array, optional): Multiple values to push

**Examples:**
```json
// Push single value
{
  "tool": "lpush",
  "arguments": {
    "key": "notifications",
    "value": { "message": "New message", "time": "2024-01-15T10:30:00Z" }
  }
}

// Push multiple values
{
  "tool": "lpush",
  "arguments": {
    "key": "queue:tasks",
    "values": ["task1", "task2", "task3"]
  }
}
```

### `rpush`
Append values to a list.

**Parameters:**
- `key` (string, required): List key
- `value` (any, optional): Single value to push
- `values` (array, optional): Multiple values to push

**Example:**
```json
{
  "tool": "rpush",
  "arguments": {
    "key": "log:events",
    "value": "User logged in at 10:30"
  }
}
```

### `lpop`
Remove and return elements from the head of a list.

**Parameters:**
- `key` (string, required): List key
- `count` (number, optional): Number of elements to pop

**Examples:**
```json
// Pop single element
{
  "tool": "lpop",
  "arguments": {
    "key": "queue:tasks"
  }
}

// Pop multiple elements
{
  "tool": "lpop",
  "arguments": {
    "key": "queue:tasks",
    "count": 3
  }
}
```

### `rpop`
Remove and return elements from the tail of a list.

**Parameters:**
- `key` (string, required): List key
- `count` (number, optional): Number of elements to pop

**Example:**
```json
{
  "tool": "rpop",
  "arguments": {
    "key": "history:recent"
  }
}
```

### `lrange`
Get a range of elements from a list.

**Parameters:**
- `key` (string, required): List key
- `start` (number, optional): Start index (default: 0)
- `stop` (number, optional): Stop index (default: -1 for end)

**Examples:**
```json
// Get entire list
{
  "tool": "lrange",
  "arguments": {
    "key": "messages"
  }
}

// Get first 10 elements
{
  "tool": "lrange",
  "arguments": {
    "key": "messages",
    "start": 0,
    "stop": 9
  }
}

// Get last 5 elements
{
  "tool": "lrange",
  "arguments": {
    "key": "messages",
    "start": -5,
    "stop": -1
  }
}
```

### `llen`
Get the length of a list.

**Parameters:**
- `key` (string, required): List key

**Example:**
```json
{
  "tool": "llen",
  "arguments": {
    "key": "queue:pending"
  }
}
```

### `lindex`
Get an element from a list by its index.

**Parameters:**
- `key` (string, required): List key
- `index` (number, optional): Index position (default: 0)

**Example:**
```json
{
  "tool": "lindex",
  "arguments": {
    "key": "playlist",
    "index": 2
  }
}
```

### `lset`
Set the value of an element in a list by its index.

**Parameters:**
- `key` (string, required): List key
- `index` (number, required): Index position
- `value` (any, required): New value

**Example:**
```json
{
  "tool": "lset",
  "arguments": {
    "key": "playlist",
    "index": 0,
    "value": "New Song Title"
  }
}
```

### `lrem`
Remove elements from a list.

**Parameters:**
- `key` (string, required): List key
- `count` (number, optional): Number of occurrences to remove (default: 0 for all)
- `value` (any, required): Value to remove

**Examples:**
```json
// Remove all occurrences
{
  "tool": "lrem",
  "arguments": {
    "key": "tasks",
    "value": "completed-task"
  }
}

// Remove first 2 occurrences
{
  "tool": "lrem",
  "arguments": {
    "key": "tasks",
    "count": 2,
    "value": "duplicate-task"
  }
}
```

---

## Hash Operations

### `hget`
Get the value of a hash field.

**Parameters:**
- `key` (string, required): Hash key
- `field` (string, required): Field name

**Example:**
```json
{
  "tool": "hget",
  "arguments": {
    "key": "user:123",
    "field": "email"
  }
}
```

### `hset`
Set the value of hash field(s).

**Parameters:**
- `key` (string, required): Hash key
- `field` (string, optional): Single field name
- `value` (any, optional): Single field value
- `fields` (object, optional): Multiple field-value pairs

**Examples:**
```json
// Set single field
{
  "tool": "hset",
  "arguments": {
    "key": "user:123",
    "field": "name",
    "value": "John Doe"
  }
}

// Set multiple fields
{
  "tool": "hset",
  "arguments": {
    "key": "user:123",
    "fields": {
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "active": true
    }
  }
}
```

### `hmget`
Get the values of multiple hash fields.

**Parameters:**
- `key` (string, required): Hash key
- `fields` (array, required): Field names to retrieve

**Example:**
```json
{
  "tool": "hmget",
  "arguments": {
    "key": "user:123",
    "fields": ["name", "email", "age"]
  }
}
```

**Returns:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": "30"
}
```

### `hgetall`
Get all fields and values in a hash.

**Parameters:**
- `key` (string, required): Hash key

**Example:**
```json
{
  "tool": "hgetall",
  "arguments": {
    "key": "product:456"
  }
}
```

**Returns:**
```json
{
  "name": "Laptop",
  "price": "999.99",
  "category": "Electronics",
  "stock": "15"
}
```

### `hdel`
Delete one or more hash fields.

**Parameters:**
- `key` (string, required): Hash key
- `fields` (array, required): Fields to delete

**Example:**
```json
{
  "tool": "hdel",
  "arguments": {
    "key": "user:123",
    "fields": ["tempField", "obsoleteData"]
  }
}
```

### `hkeys`
Get all field names in a hash.

**Parameters:**
- `key` (string, required): Hash key

**Example:**
```json
{
  "tool": "hkeys",
  "arguments": {
    "key": "settings:app"
  }
}
```

### `hvals`
Get all values in a hash.

**Parameters:**
- `key` (string, required): Hash key

**Example:**
```json
{
  "tool": "hvals",
  "arguments": {
    "key": "config:database"
  }
}
```

### `hlen`
Get the number of fields in a hash.

**Parameters:**
- `key` (string, required): Hash key

**Example:**
```json
{
  "tool": "hlen",
  "arguments": {
    "key": "user:123"
  }
}
```

### `hexists`
Check if a field exists in a hash.

**Parameters:**
- `key` (string, required): Hash key
- `field` (string, required): Field to check

**Example:**
```json
{
  "tool": "hexists",
  "arguments": {
    "key": "user:123",
    "field": "premium"
  }
}
```

### `hincrby`
Increment the integer value of a hash field.

**Parameters:**
- `key` (string, required): Hash key
- `field` (string, required): Field to increment
- `increment` (number, required): Increment amount

**Example:**
```json
{
  "tool": "hincrby",
  "arguments": {
    "key": "stats:page",
    "field": "views",
    "increment": 1
  }
}
```

---

## Set Operations

### `sadd`
Add one or more members to a set.

**Parameters:**
- `key` (string, required): Set key
- `member` (any, optional): Single member to add
- `members` (array, optional): Multiple members to add

**Examples:**
```json
// Add single member
{
  "tool": "sadd",
  "arguments": {
    "key": "tags:post:123",
    "member": "javascript"
  }
}

// Add multiple members
{
  "tool": "sadd",
  "arguments": {
    "key": "users:online",
    "members": ["user:123", "user:456", "user:789"]
  }
}
```

### `srem`
Remove one or more members from a set.

**Parameters:**
- `key` (string, required): Set key
- `member` (any, optional): Single member to remove
- `members` (array, optional): Multiple members to remove

**Example:**
```json
{
  "tool": "srem",
  "arguments": {
    "key": "users:online",
    "members": ["user:123", "user:456"]
  }
}
```

### `smembers`
Get all members of a set.

**Parameters:**
- `key` (string, required): Set key

**Example:**
```json
{
  "tool": "smembers",
  "arguments": {
    "key": "categories:active"
  }
}
```

### `sismember`
Check if a value is a member of a set.

**Parameters:**
- `key` (string, required): Set key
- `member` (any, required): Member to check

**Example:**
```json
{
  "tool": "sismember",
  "arguments": {
    "key": "admins",
    "member": "user:123"
  }
}
```

### `scard`
Get the number of members in a set.

**Parameters:**
- `key` (string, required): Set key

**Example:**
```json
{
  "tool": "scard",
  "arguments": {
    "key": "users:active"
  }
}
```

### `spop`
Remove and return random member(s) from a set.

**Parameters:**
- `key` (string, required): Set key
- `count` (number, optional): Number of members to pop

**Example:**
```json
{
  "tool": "spop",
  "arguments": {
    "key": "lottery:entries",
    "count": 3
  }
}
```

### `srandmember`
Get random member(s) from a set without removing.

**Parameters:**
- `key` (string, required): Set key
- `count` (number, optional): Number of members to return

**Example:**
```json
{
  "tool": "srandmember",
  "arguments": {
    "key": "questions:pool",
    "count": 5
  }
}
```

### `sunion`
Get the union of multiple sets.

**Parameters:**
- `keys` (array, required): Set keys to union

**Example:**
```json
{
  "tool": "sunion",
  "arguments": {
    "keys": ["skills:user:123", "skills:user:456"]
  }
}
```

### `sinter`
Get the intersection of multiple sets.

**Parameters:**
- `keys` (array, required): Set keys to intersect

**Example:**
```json
{
  "tool": "sinter",
  "arguments": {
    "keys": ["friends:user:123", "friends:user:456"]
  }
}
```

### `sdiff`
Get the difference between sets.

**Parameters:**
- `keys` (array, required): Set keys (first minus others)

**Example:**
```json
{
  "tool": "sdiff",
  "arguments": {
    "keys": ["inventory:warehouse:A", "inventory:warehouse:B"]
  }
}
```

---

## Sorted Set Operations

### `zadd`
Add members to a sorted set with scores.

**Parameters:**
- `key` (string, required): Sorted set key
- `score` (number, optional): Score for single member
- `member` (any, optional): Single member
- `members` (array, optional): Array of {score, member} objects

**Examples:**
```json
// Add single member
{
  "tool": "zadd",
  "arguments": {
    "key": "leaderboard",
    "score": 100,
    "member": "player:123"
  }
}

// Add multiple members
{
  "tool": "zadd",
  "arguments": {
    "key": "leaderboard",
    "members": [
      { "score": 100, "member": "player:123" },
      { "score": 95, "member": "player:456" },
      { "score": 90, "member": "player:789" }
    ]
  }
}
```

### `zrem`
Remove members from a sorted set.

**Parameters:**
- `key` (string, required): Sorted set key
- `members` (array, required): Members to remove

**Example:**
```json
{
  "tool": "zrem",
  "arguments": {
    "key": "leaderboard",
    "members": ["player:inactive1", "player:inactive2"]
  }
}
```

### `zrange`
Get members by rank (ascending).

**Parameters:**
- `key` (string, required): Sorted set key
- `min` (number, optional): Start rank (default: 0)
- `max` (number, optional): Stop rank (default: -1)
- `withScores` (boolean, optional): Include scores

**Examples:**
```json
// Get top 10
{
  "tool": "zrange",
  "arguments": {
    "key": "leaderboard",
    "min": 0,
    "max": 9,
    "withScores": true
  }
}
```

**Returns:**
```json
[
  { "member": "player:123", "score": 100 },
  { "member": "player:456", "score": 95 },
  { "member": "player:789", "score": 90 }
]
```

### `zrevrange`
Get members by rank (descending).

**Parameters:**
- `key` (string, required): Sorted set key
- `min` (number, optional): Start rank (default: 0)
- `max` (number, optional): Stop rank (default: -1)
- `withScores` (boolean, optional): Include scores

**Example:**
```json
{
  "tool": "zrevrange",
  "arguments": {
    "key": "highscores",
    "min": 0,
    "max": 4,
    "withScores": true
  }
}
```

### `zrangebyscore`
Get members by score range.

**Parameters:**
- `key` (string, required): Sorted set key
- `min` (number/string, required): Minimum score (use "-inf" for negative infinity)
- `max` (number/string, required): Maximum score (use "+inf" for positive infinity)
- `offset` (number, optional): Skip first N results
- `count` (number, optional): Limit results
- `withScores` (boolean, optional): Include scores

**Examples:**
```json
// Get all members with scores between 80 and 100
{
  "tool": "zrangebyscore",
  "arguments": {
    "key": "exam:results",
    "min": 80,
    "max": 100,
    "withScores": true
  }
}

// Get paginated results
{
  "tool": "zrangebyscore",
  "arguments": {
    "key": "prices",
    "min": 10,
    "max": 50,
    "offset": 20,
    "count": 10
  }
}
```

### `zcard`
Get the number of members in a sorted set.

**Parameters:**
- `key` (string, required): Sorted set key

**Example:**
```json
{
  "tool": "zcard",
  "arguments": {
    "key": "active:users"
  }
}
```

### `zscore`
Get the score of a member.

**Parameters:**
- `key` (string, required): Sorted set key
- `member` (any, required): Member to check

**Example:**
```json
{
  "tool": "zscore",
  "arguments": {
    "key": "leaderboard",
    "member": "player:123"
  }
}
```

### `zrank`
Get the rank of a member (ascending).

**Parameters:**
- `key` (string, required): Sorted set key
- `member` (any, required): Member to check

**Example:**
```json
{
  "tool": "zrank",
  "arguments": {
    "key": "leaderboard",
    "member": "player:123"
  }
}
```

### `zincrby`
Increment the score of a member.

**Parameters:**
- `key` (string, required): Sorted set key
- `increment` (number, required): Score increment
- `member` (any, required): Member to increment

**Example:**
```json
{
  "tool": "zincrby",
  "arguments": {
    "key": "points:monthly",
    "increment": 10,
    "member": "user:123"
  }
}
```

---

## Stream Operations

### `xadd`
Add an entry to a stream.

**Parameters:**
- `key` (string, required): Stream key
- `id` (string, optional): Entry ID (default: "*" for auto-generate)
- `fields` (object, required): Field-value pairs for the entry

**Examples:**
```json
// Auto-generated ID
{
  "tool": "xadd",
  "arguments": {
    "key": "events:user",
    "fields": {
      "action": "login",
      "user": "user:123",
      "ip": "192.168.1.1",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}

// Specific ID
{
  "tool": "xadd",
  "arguments": {
    "key": "sensors:temp",
    "id": "1705315800000-0",
    "fields": {
      "temperature": 22.5,
      "humidity": 65
    }
  }
}
```

### `xread`
Read data from one or more streams.

**Parameters:**
- `streams` (object, required): Object mapping stream keys to IDs
- `count` (number, optional): Max entries per stream
- `block` (number, optional): Block for milliseconds

**Examples:**
```json
// Read new entries
{
  "tool": "xread",
  "arguments": {
    "streams": {
      "events:user": "$",
      "events:system": "$"
    }
  }
}

// Block for new entries
{
  "tool": "xread",
  "arguments": {
    "streams": {
      "notifications": "$"
    },
    "block": 5000,
    "count": 10
  }
}
```

### `xrange`
Get a range of entries from a stream.

**Parameters:**
- `key` (string, required): Stream key
- `start` (string, optional): Start ID (default: "-")
- `end` (string, optional): End ID (default: "+")
- `count` (number, optional): Maximum entries to return

**Examples:**
```json
// Get all entries
{
  "tool": "xrange",
  "arguments": {
    "key": "events:audit"
  }
}

// Get entries in time range
{
  "tool": "xrange",
  "arguments": {
    "key": "events:audit",
    "start": "1705315800000-0",
    "end": "1705319400000-0",
    "count": 100
  }
}
```

### `xlen`
Get the length of a stream.

**Parameters:**
- `key` (string, required): Stream key

**Example:**
```json
{
  "tool": "xlen",
  "arguments": {
    "key": "events:application"
  }
}
```

---

## Geo Operations

### `geoadd`
Add one or more geospatial items.

**Parameters:**
- `key` (string, required): Geo key
- `locations` (array, required): Array of location objects
  - `longitude` (number): Longitude
  - `latitude` (number): Latitude
  - `member` (string): Member name

**Example:**
```json
{
  "tool": "geoadd",
  "arguments": {
    "key": "stores",
    "locations": [
      { "longitude": -122.4194, "latitude": 37.7749, "member": "store:sf" },
      { "longitude": -118.2437, "latitude": 34.0522, "member": "store:la" },
      { "longitude": -73.9857, "latitude": 40.7484, "member": "store:ny" }
    ]
  }
}
```

### `geodist`
Get the distance between two members.

**Parameters:**
- `key` (string, required): Geo key
- `member1` (string, required): First member
- `member2` (string, required): Second member
- `unit` (string, optional): Unit - "m", "km", "mi", "ft" (default: "m")

**Example:**
```json
{
  "tool": "geodist",
  "arguments": {
    "key": "stores",
    "member1": "store:sf",
    "member2": "store:la",
    "unit": "km"
  }
}
```

### `georadius`
Query members by radius from coordinates.

**Parameters:**
- `key` (string, required): Geo key
- `longitude` (number, required): Center longitude
- `latitude` (number, required): Center latitude
- `radius` (number, required): Search radius
- `unit` (string, required): Unit - "m", "km", "mi", "ft"
- `count` (number, optional): Limit results
- `sort` (string, optional): Sort by distance - "ASC" or "DESC"
- `withCoord` (boolean, optional): Include coordinates
- `withDist` (boolean, optional): Include distance

**Example:**
```json
{
  "tool": "georadius",
  "arguments": {
    "key": "restaurants",
    "longitude": -122.4194,
    "latitude": 37.7749,
    "radius": 5,
    "unit": "km",
    "count": 10,
    "sort": "ASC",
    "withCoord": true,
    "withDist": true
  }
}
```

---

## HyperLogLog Operations

### `pfadd`
Add elements to a HyperLogLog.

**Parameters:**
- `key` (string, required): HyperLogLog key
- `elements` (array, required): Elements to add

**Example:**
```json
{
  "tool": "pfadd",
  "arguments": {
    "key": "unique:visitors:2024-01-15",
    "elements": ["user:123", "user:456", "user:789"]
  }
}
```

### `pfcount`
Get the cardinality estimate.

**Parameters:**
- `keys` (array, required): HyperLogLog keys

**Examples:**
```json
// Single HyperLogLog
{
  "tool": "pfcount",
  "arguments": {
    "keys": ["unique:visitors:2024-01-15"]
  }
}

// Multiple HyperLogLogs (union)
{
  "tool": "pfcount",
  "arguments": {
    "keys": [
      "unique:visitors:2024-01-13",
      "unique:visitors:2024-01-14",
      "unique:visitors:2024-01-15"
    ]
  }
}
```

---

## Pub/Sub Operations

### `publish`
Publish a message to a channel.

**Parameters:**
- `channel` (string, required): Channel name
- `message` (any, required): Message to publish

**Example:**
```json
{
  "tool": "publish",
  "arguments": {
    "channel": "notifications:user:123",
    "message": {
      "type": "friend_request",
      "from": "user:456",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Returns:**
```json
{
  "subscribers": 3
}
```

---

## Transaction Operations

### `multi_exec`
Execute multiple commands atomically.

**Parameters:**
- `commands` (array, required): Array of command objects
  - `command` (string): Redis command name
  - `args` (array): Command arguments

**Example:**
```json
{
  "tool": "multi_exec",
  "arguments": {
    "commands": [
      { "command": "incr", "args": ["counter:views"] },
      { "command": "zadd", "args": ["popular:today", 1, "article:123"] },
      { "command": "expire", "args": ["cache:temp", 3600] },
      { "command": "lpush", "args": ["events", "view:article:123"] }
    ]
  }
}
```

**Returns:**
```json
[
  [null, 42],
  [null, 1],
  [null, 1],
  [null, 5]
]
```

---

## Script Operations

### `eval`
Execute a Lua script.

**Parameters:**
- `script` (string, required): Lua script
- `keys` (array, optional): Keys for the script
- `args` (array, optional): Arguments for the script

**Examples:**
```json
// Simple script
{
  "tool": "eval",
  "arguments": {
    "script": "return redis.call('get', KEYS[1])",
    "keys": ["mykey"]
  }
}

// Complex script with arguments
{
  "tool": "eval",
  "arguments": {
    "script": "local current = redis.call('get', KEYS[1]) or 0; local new = current + ARGV[1]; redis.call('set', KEYS[1], new); return new",
    "keys": ["counter"],
    "args": [10]
  }
}

// Conditional logic
{
  "tool": "eval",
  "arguments": {
    "script": "if redis.call('exists', KEYS[1]) == 1 then return redis.call('incr', KEYS[1]) else redis.call('set', KEYS[1], ARGV[1]) return tonumber(ARGV[1]) end",
    "keys": ["visitor:count"],
    "args": [1]
  }
}
```

---

## Server Operations

### `ping`
Check if the server is running.

**Parameters:**
- `message` (string, optional): Optional message to echo

**Examples:**
```json
// Simple ping
{
  "tool": "ping",
  "arguments": {}
}

// Ping with message
{
  "tool": "ping",
  "arguments": {
    "message": "Hello Redis"
  }
}
```

### `dbsize`
Get the number of keys in the database.

**Parameters:** None

**Example:**
```json
{
  "tool": "dbsize",
  "arguments": {}
}
```

**Returns:**
```json
{
  "keys": 12543
}
```

### `flushdb`
Remove all keys from the current database.

**Parameters:**
- `async` (boolean, optional): Flush asynchronously

**Example:**
```json
{
  "tool": "flushdb",
  "arguments": {
    "async": true
  }
}
```

### `info`
Get information and statistics about the server.

**Parameters:**
- `section` (string, optional): Specific section to retrieve

**Available sections:**
- `server`: General server information
- `clients`: Client connections
- `memory`: Memory usage
- `persistence`: RDB and AOF information
- `stats`: General statistics
- `replication`: Master/replica information
- `cpu`: CPU usage
- `cluster`: Cluster information
- `keyspace`: Database key statistics

**Examples:**
```json
// Get all info
{
  "tool": "info",
  "arguments": {}
}

// Get specific section
{
  "tool": "info",
  "arguments": {
    "section": "memory"
  }
}
```

### `config_get`
Get Redis configuration parameters.

**Parameters:**
- `parameter` (string, required): Parameter pattern

**Examples:**
```json
// Get specific parameter
{
  "tool": "config_get",
  "arguments": {
    "parameter": "maxmemory"
  }
}

// Get all parameters matching pattern
{
  "tool": "config_get",
  "arguments": {
    "parameter": "*max*"
  }
}
```

### `config_set`
Set Redis configuration parameters.

**Parameters:**
- `parameter` (string, required): Parameter name
- `value` (string, required): Parameter value

**Example:**
```json
{
  "tool": "config_set",
  "arguments": {
    "parameter": "maxmemory-policy",
    "value": "lru"
  }
}
```

### `scan`
Incrementally iterate the keyspace.

**Parameters:**
- `cursor` (string, optional): Cursor position (default: "0")
- `match` (string, optional): Pattern to match
- `count` (number, optional): Hint for number of keys
- `type` (string, optional): Filter by key type

**Examples:**
```json
// Start scanning
{
  "tool": "scan",
  "arguments": {
    "cursor": "0",
    "match": "user:*",
    "count": 100
  }
}

// Continue scanning
{
  "tool": "scan",
  "arguments": {
    "cursor": "17",
    "match": "user:*",
    "count": 100
  }
}

// Scan for specific type
{
  "tool": "scan",
  "arguments": {
    "cursor": "0",
    "type": "hash",
    "count": 50
  }
}
```

**Returns:**
```json
{
  "cursor": "17",
  "keys": ["user:123", "user:456", "user:789"]
}
```

---

## Best Practices

### 1. Use Appropriate Data Types
- Strings for simple values and counters
- Lists for queues and timelines
- Sets for unique collections
- Sorted sets for rankings and time-series
- Hashes for objects with multiple fields
- Streams for event logs

### 2. Key Naming Conventions
```
object-type:id:field
```
Examples:
- `user:123:profile`
- `session:abc123`
- `cache:api:response:endpoint1`

### 3. Memory Management
- Set appropriate TTLs for temporary data
- Use `SCAN` instead of `KEYS` in production
- Monitor memory usage with `INFO memory`

### 4. Transaction Usage
- Keep transactions short
- Avoid long-running scripts
- Use optimistic locking with WATCH when needed

### 5. Performance Tips
- Pipeline commands when possible
- Use batch operations for bulk updates
- Consider using Lua scripts for complex operations
- Monitor slow queries with SLOWLOG