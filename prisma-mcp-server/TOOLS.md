# Prisma MCP Server Tools Reference

This document provides detailed information about all available tools in the Prisma MCP Server.

## Table of Contents

- [Schema Management Tools](#schema-management-tools)
- [Database Management Tools](#database-management-tools)
- [Migration Tools](#migration-tools)
- [Data Operation Tools](#data-operation-tools)
- [Utility Tools](#utility-tools)

## Schema Management Tools

### init_prisma
Initialize a new Prisma project with schema and configuration files.

**Parameters:**
- `provider` (string, optional): Database provider to use
  - Values: `postgresql`, `mysql`, `sqlite`, `sqlserver`, `mongodb`, `cockroachdb`
  - Default: `postgresql`

**Example:**
```json
{
  "tool": "init_prisma",
  "arguments": {
    "provider": "postgresql"
  }
}
```

### read_schema
Read the current Prisma schema file content.

**Parameters:** None

**Returns:** The complete schema file content as text

**Example:**
```json
{
  "tool": "read_schema",
  "arguments": {}
}
```

### write_schema
Write or update the Prisma schema file.

**Parameters:**
- `content` (string, required): The complete schema content to write

**Example:**
```json
{
  "tool": "write_schema",
  "arguments": {
    "content": "datasource db {\n  provider = \"postgresql\"\n  url = env(\"DATABASE_URL\")\n}\n\nmodel User {\n  id Int @id\n}"
  }
}
```

### format_schema
Format the Prisma schema file using Prisma's built-in formatter.

**Parameters:** None

**Example:**
```json
{
  "tool": "format_schema",
  "arguments": {}
}
```

### validate_schema
Validate the Prisma schema syntax and consistency.

**Parameters:** None

**Returns:** Success message or validation errors

**Example:**
```json
{
  "tool": "validate_schema",
  "arguments": {}
}
```

### generate_client
Generate or regenerate the Prisma Client from the current schema.

**Parameters:** None

**Note:** This must be run after schema changes before using data operation tools.

**Example:**
```json
{
  "tool": "generate_client",
  "arguments": {}
}
```

## Database Management Tools

### db_pull
Pull the database schema and update the Prisma schema file to match the database.

**Parameters:** None

**Note:** This will overwrite your current schema with the database structure.

**Example:**
```json
{
  "tool": "db_pull",
  "arguments": {}
}
```

### db_push
Push Prisma schema changes to the database without creating migrations.

**Parameters:**
- `acceptDataLoss` (boolean, optional): Accept potential data loss when pushing changes
  - Default: `false`

**Warning:** This is for development only. Use migrations for production changes.

**Example:**
```json
{
  "tool": "db_push",
  "arguments": {
    "acceptDataLoss": true
  }
}
```

## Migration Tools

### migrate_create
Create a new migration file without applying it.

**Parameters:**
- `name` (string, required): Name for the migration

**Example:**
```json
{
  "tool": "migrate_create",
  "arguments": {
    "name": "add_user_table"
  }
}
```

### migrate_dev
Create and apply migrations in development.

**Parameters:**
- `name` (string, optional): Name for the migration

**Note:** If name is not provided, Prisma will auto-generate one.

**Example:**
```json
{
  "tool": "migrate_dev",
  "arguments": {
    "name": "add_email_verification"
  }
}
```

### migrate_deploy
Apply pending migrations in production.

**Parameters:** None

**Note:** Only applies migrations, doesn't create new ones.

**Example:**
```json
{
  "tool": "migrate_deploy",
  "arguments": {}
}
```

### migrate_reset
Reset the database by dropping all data and reapplying all migrations.

**Parameters:**
- `force` (boolean, optional): Skip confirmation prompt
  - Default: `false`

**Warning:** This will delete all data in your database!

**Example:**
```json
{
  "tool": "migrate_reset",
  "arguments": {
    "force": true
  }
}
```

### migrate_status
Check the status of migrations (applied, pending, failed).

**Parameters:** None

**Returns:** Detailed migration status information

**Example:**
```json
{
  "tool": "migrate_status",
  "arguments": {}
}
```

### migrate_resolve
Resolve migration issues by marking migrations as applied or rolled back.

**Parameters:**
- `applied` (string, optional): Migration name to mark as applied
- `rolledBack` (string, optional): Migration name to mark as rolled back

**Note:** Use exactly one of `applied` or `rolledBack`.

**Example:**
```json
{
  "tool": "migrate_resolve",
  "arguments": {
    "applied": "20240101120000_add_user_table"
  }
}
```

### migrate_diff
Compare schema differences between two sources.

**Parameters:**
- `from` (string, required): Source to compare from
  - Values: `schema`, `database`, `migrations`, `empty`
- `to` (string, required): Target to compare to
  - Values: `schema`, `database`, `migrations`, `empty`
- `script` (boolean, optional): Output as executable SQL script
  - Default: `false`

**Example:**
```json
{
  "tool": "migrate_diff",
  "arguments": {
    "from": "database",
    "to": "schema",
    "script": true
  }
}
```

## Data Operation Tools

### find_many
Find multiple records with advanced filtering, sorting, and pagination.

**Parameters:**
- `model` (string, required): Model name to query
- `where` (object, optional): Filter conditions
- `select` (object, optional): Fields to select (object with field names as keys and boolean values)
- `include` (object, optional): Relations to include
- `orderBy` (object, optional): Sort order (field names with 'asc' or 'desc')
- `skip` (number, optional): Number of records to skip
- `take` (number, optional): Number of records to take

**Example:**
```json
{
  "tool": "find_many",
  "arguments": {
    "model": "User",
    "where": {
      "email": {
        "contains": "@example.com"
      }
    },
    "select": {
      "id": true,
      "email": true,
      "name": true
    },
    "orderBy": {
      "createdAt": "desc"
    },
    "take": 10
  }
}
```

### find_unique
Find a single record by unique identifier.

**Parameters:**
- `model` (string, required): Model name to query
- `where` (object, required): Unique identifier (e.g., `{"id": 1}`)
- `select` (object, optional): Fields to select
- `include` (object, optional): Relations to include

**Example:**
```json
{
  "tool": "find_unique",
  "arguments": {
    "model": "User",
    "where": {
      "id": 1
    },
    "include": {
      "posts": true
    }
  }
}
```

### create
Create a new record.

**Parameters:**
- `model` (string, required): Model name
- `data` (object, required): Data to create
- `select` (object, optional): Fields to return
- `include` (object, optional): Relations to include in response

**Example:**
```json
{
  "tool": "create",
  "arguments": {
    "model": "User",
    "data": {
      "email": "alice@example.com",
      "name": "Alice Smith",
      "posts": {
        "create": [
          {
            "title": "First Post",
            "content": "Hello, world!"
          }
        ]
      }
    },
    "include": {
      "posts": true
    }
  }
}
```

### update
Update an existing record.

**Parameters:**
- `model` (string, required): Model name
- `where` (object, required): Record identifier
- `data` (object, required): Update data
- `select` (object, optional): Fields to return
- `include` (object, optional): Relations to include

**Example:**
```json
{
  "tool": "update",
  "arguments": {
    "model": "User",
    "where": {
      "id": 1
    },
    "data": {
      "name": "Alice Johnson"
    }
  }
}
```

### delete
Delete a record.

**Parameters:**
- `model` (string, required): Model name
- `where` (object, required): Record identifier

**Example:**
```json
{
  "tool": "delete",
  "arguments": {
    "model": "Post",
    "where": {
      "id": 5
    }
  }
}
```

### count
Count records matching criteria.

**Parameters:**
- `model` (string, required): Model name
- `where` (object, optional): Filter conditions

**Example:**
```json
{
  "tool": "count",
  "arguments": {
    "model": "User",
    "where": {
      "email": {
        "endsWith": "@company.com"
      }
    }
  }
}
```

### aggregate
Perform aggregations on numeric fields.

**Parameters:**
- `model` (string, required): Model name
- `where` (object, optional): Filter conditions
- `_count` (boolean, optional): Include count
- `_sum` (object, optional): Fields to sum
- `_avg` (object, optional): Fields to average
- `_min` (object, optional): Fields to get minimum
- `_max` (object, optional): Fields to get maximum

**Example:**
```json
{
  "tool": "aggregate",
  "arguments": {
    "model": "Order",
    "where": {
      "status": "completed"
    },
    "_sum": {
      "total": true
    },
    "_avg": {
      "total": true
    },
    "_count": true
  }
}
```

### execute_raw
Execute raw SQL queries.

**Parameters:**
- `query` (string, required): SQL query to execute
- `parameters` (array, optional): Query parameters for parameterized queries

**Warning:** Be careful with raw queries. Use parameterized queries to prevent SQL injection.

**Example:**
```json
{
  "tool": "execute_raw",
  "arguments": {
    "query": "SELECT * FROM \"User\" WHERE email = $1",
    "parameters": ["alice@example.com"]
  }
}
```

## Utility Tools

### seed_database
Run the database seed script defined in package.json.

**Parameters:** None

**Note:** Requires a seed script to be defined in your project.

**Example:**
```json
{
  "tool": "seed_database",
  "arguments": {}
}
```

### list_models
List all models and enums defined in the schema.

**Parameters:** None

**Returns:** Object with arrays of model and enum names

**Example:**
```json
{
  "tool": "list_models",
  "arguments": {}
}
```

## Query Filter Examples

### Comparison Operators

```json
{
  "where": {
    "age": {
      "gt": 18,        // greater than
      "gte": 18,       // greater than or equal
      "lt": 65,        // less than
      "lte": 65        // less than or equal
    }
  }
}
```

### String Filters

```json
{
  "where": {
    "name": {
      "contains": "john",
      "startsWith": "J",
      "endsWith": "son",
      "equals": "Johnson",
      "not": "Smith"
    }
  }
}
```

### List Filters

```json
{
  "where": {
    "id": {
      "in": [1, 2, 3],
      "notIn": [4, 5, 6]
    }
  }
}
```

### Logical Operators

```json
{
  "where": {
    "OR": [
      { "email": { "contains": "@gmail.com" } },
      { "email": { "contains": "@yahoo.com" } }
    ],
    "AND": [
      { "age": { "gte": 18 } },
      { "age": { "lte": 65 } }
    ],
    "NOT": {
      "status": "inactive"
    }
  }
}
```

### Relation Filters

```json
{
  "where": {
    "posts": {
      "some": {
        "published": true
      }
    }
  }
}
```

## Best Practices

1. **Always validate schema** before running migrations
2. **Use transactions** for multiple related operations
3. **Test migrations** in development before production
4. **Use parameterized queries** for raw SQL
5. **Include only needed fields** with `select` for performance
6. **Use pagination** (`skip`/`take`) for large datasets
7. **Handle errors gracefully** in your application

Last Updated On: 2025-06-06