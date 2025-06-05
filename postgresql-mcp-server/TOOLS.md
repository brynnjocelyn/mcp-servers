# PostgreSQL MCP Server Tools Reference

This document provides comprehensive documentation for all tools available in the PostgreSQL MCP server.

## Table of Contents

1. [Query Execution Tools](#query-execution-tools)
2. [Schema Management Tools](#schema-management-tools)
3. [Table Management Tools](#table-management-tools)
4. [Data Manipulation Tools](#data-manipulation-tools)
5. [Index Management Tools](#index-management-tools)
6. [Performance Tools](#performance-tools)
7. [Advanced Database Features](#advanced-database-features)
8. [Utility Tools](#utility-tools)

---

## Query Execution Tools

### `query`
Execute raw SQL queries with optional parameterized values for security.

**Parameters:**
- `query` (string, required): SQL query to execute
- `params` (array, optional): Array of parameters for parameterized queries

**Examples:**

Simple query:
```json
{
  "tool": "query",
  "arguments": {
    "query": "SELECT * FROM users WHERE active = true LIMIT 10"
  }
}
```

Parameterized query (prevents SQL injection):
```json
{
  "tool": "query",
  "arguments": {
    "query": "SELECT * FROM users WHERE email = $1 AND created_at > $2",
    "params": ["user@example.com", "2024-01-01"]
  }
}
```

Complex join query:
```json
{
  "tool": "query",
  "arguments": {
    "query": "SELECT u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at > $1 GROUP BY u.id, u.name HAVING COUNT(o.id) > $2",
    "params": ["2024-01-01", 5]
  }
}
```

### `transaction`
Execute multiple queries within a single transaction. All queries succeed or all are rolled back.

**Parameters:**
- `queries` (array, required): Array of query objects
  - `query` (string): SQL query
  - `params` (array, optional): Query parameters

**Example:**

Transfer funds between accounts:
```json
{
  "tool": "transaction",
  "arguments": {
    "queries": [
      {
        "query": "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        "params": [100.00, 1]
      },
      {
        "query": "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        "params": [100.00, 2]
      },
      {
        "query": "INSERT INTO transactions (from_account, to_account, amount) VALUES ($1, $2, $3)",
        "params": [1, 2, 100.00]
      }
    ]
  }
}
```

### `explain`
Get the query execution plan to optimize performance.

**Parameters:**
- `query` (string, required): SQL query to explain
- `analyze` (boolean, optional): Run EXPLAIN ANALYZE for actual execution stats
- `params` (array, optional): Query parameters

**Examples:**

Basic execution plan:
```json
{
  "tool": "explain",
  "arguments": {
    "query": "SELECT * FROM users WHERE email = 'test@example.com'"
  }
}
```

Analyze with actual execution:
```json
{
  "tool": "explain",
  "arguments": {
    "query": "SELECT * FROM orders WHERE created_at > $1",
    "params": ["2024-01-01"],
    "analyze": true
  }
}
```

---

## Schema Management Tools

### `list_schemas`
List all schemas in the database with ownership and privileges.

**Parameters:** None

**Example:**
```json
{
  "tool": "list_schemas",
  "arguments": {}
}
```

**Returns:**
```json
[
  {
    "schema_name": "public",
    "schema_owner": "postgres",
    "privileges": ["USAGE", "CREATE"]
  },
  {
    "schema_name": "audit",
    "schema_owner": "admin",
    "privileges": ["USAGE"]
  }
]
```

### `create_schema`
Create a new schema with optional authorization.

**Parameters:**
- `name` (string, required): Schema name
- `authorization` (string, optional): Schema owner

**Examples:**

Basic schema:
```json
{
  "tool": "create_schema",
  "arguments": {
    "name": "analytics"
  }
}
```

Schema with specific owner:
```json
{
  "tool": "create_schema",
  "arguments": {
    "name": "reporting",
    "authorization": "report_user"
  }
}
```

---

## Table Management Tools

### `list_tables`
List all tables in a schema with their columns and data types.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")

**Example:**
```json
{
  "tool": "list_tables",
  "arguments": {
    "schema": "public"
  }
}
```

**Returns:**
```json
[
  {
    "table_name": "users",
    "table_type": "BASE TABLE",
    "comment": "User accounts table",
    "columns": [
      {
        "column_name": "id",
        "data_type": "integer",
        "is_nullable": "NO",
        "column_default": "nextval('users_id_seq'::regclass)"
      },
      {
        "column_name": "email",
        "data_type": "character varying",
        "is_nullable": "NO",
        "column_default": null
      }
    ]
  }
]
```

### `describe_table`
Get comprehensive information about a table including columns, constraints, and indexes.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name

**Example:**
```json
{
  "tool": "describe_table",
  "arguments": {
    "table": "users"
  }
}
```

**Returns:**
```json
{
  "columns": [
    {
      "column_name": "id",
      "data_type": "integer",
      "character_maximum_length": null,
      "numeric_precision": 32,
      "is_nullable": "NO",
      "column_default": "nextval('users_id_seq'::regclass)",
      "is_identity": "NO"
    }
  ],
  "constraints": [
    {
      "constraint_name": "users_pkey",
      "constraint_type": "PRIMARY KEY",
      "definition": "PRIMARY KEY (id)"
    },
    {
      "constraint_name": "users_email_key",
      "constraint_type": "UNIQUE",
      "definition": "UNIQUE (email)"
    }
  ],
  "indexes": [
    {
      "indexname": "users_pkey",
      "indexdef": "CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)"
    }
  ]
}
```

### `create_table`
Create a new table with columns and constraints.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name
- `columns` (array, required): Array of column definitions
  - `name` (string): Column name
  - `type` (string): Data type
  - `constraints` (string, optional): Column constraints
- `constraints` (array, optional): Table-level constraints

**Examples:**

Basic table:
```json
{
  "tool": "create_table",
  "arguments": {
    "table": "products",
    "columns": [
      {
        "name": "id",
        "type": "SERIAL",
        "constraints": "PRIMARY KEY"
      },
      {
        "name": "name",
        "type": "VARCHAR(255)",
        "constraints": "NOT NULL"
      },
      {
        "name": "price",
        "type": "DECIMAL(10,2)",
        "constraints": "NOT NULL CHECK (price >= 0)"
      },
      {
        "name": "created_at",
        "type": "TIMESTAMP",
        "constraints": "DEFAULT CURRENT_TIMESTAMP"
      }
    ]
  }
}
```

Table with foreign keys:
```json
{
  "tool": "create_table",
  "arguments": {
    "table": "order_items",
    "columns": [
      {
        "name": "id",
        "type": "SERIAL",
        "constraints": "PRIMARY KEY"
      },
      {
        "name": "order_id",
        "type": "INTEGER",
        "constraints": "NOT NULL"
      },
      {
        "name": "product_id",
        "type": "INTEGER",
        "constraints": "NOT NULL"
      },
      {
        "name": "quantity",
        "type": "INTEGER",
        "constraints": "NOT NULL CHECK (quantity > 0)"
      }
    ],
    "constraints": [
      "FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE",
      "FOREIGN KEY (product_id) REFERENCES products(id)",
      "UNIQUE (order_id, product_id)"
    ]
  }
}
```

### `drop_table`
Drop a table with optional cascade.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name
- `cascade` (boolean, optional): Drop dependent objects (default: false)

**Examples:**

Simple drop:
```json
{
  "tool": "drop_table",
  "arguments": {
    "table": "temp_data"
  }
}
```

Cascade drop:
```json
{
  "tool": "drop_table",
  "arguments": {
    "table": "users",
    "cascade": true
  }
}
```

### `table_stats`
Get detailed statistics about a table.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name

**Example:**
```json
{
  "tool": "table_stats",
  "arguments": {
    "table": "orders"
  }
}
```

**Returns:**
```json
{
  "total_size": "156 MB",
  "table_size": "89 MB",
  "indexes_size": "67 MB",
  "row_count": 1250000,
  "dead_rows": 1523,
  "last_vacuum": "2024-01-15 10:30:00",
  "last_autovacuum": "2024-01-15 08:15:00",
  "last_analyze": "2024-01-15 10:30:00",
  "last_autoanalyze": "2024-01-15 08:15:00"
}
```

---

## Data Manipulation Tools

### `select`
Select data from a table with filtering, sorting, and pagination.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name
- `columns` (array, optional): Columns to select (default: ["*"])
- `where` (string, optional): WHERE clause conditions
- `orderBy` (string, optional): ORDER BY clause
- `limit` (number, optional): Maximum rows to return
- `offset` (number, optional): Number of rows to skip

**Examples:**

Basic select:
```json
{
  "tool": "select",
  "arguments": {
    "table": "users",
    "columns": ["id", "name", "email"],
    "limit": 10
  }
}
```

Filtered and sorted:
```json
{
  "tool": "select",
  "arguments": {
    "table": "products",
    "columns": ["name", "price", "category"],
    "where": "price > 100 AND category = 'Electronics'",
    "orderBy": "price DESC",
    "limit": 20
  }
}
```

Pagination:
```json
{
  "tool": "select",
  "arguments": {
    "table": "orders",
    "where": "status = 'completed'",
    "orderBy": "created_at DESC",
    "limit": 50,
    "offset": 100
  }
}
```

### `insert`
Insert data into a table with optional RETURNING clause.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name
- `data` (object, required): Column-value pairs to insert
- `returning` (array, optional): Columns to return after insert

**Examples:**

Simple insert:
```json
{
  "tool": "insert",
  "arguments": {
    "table": "users",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

Insert with returning:
```json
{
  "tool": "insert",
  "arguments": {
    "table": "products",
    "data": {
      "name": "New Product",
      "price": 29.99,
      "category": "Books"
    },
    "returning": ["id", "created_at"]
  }
}
```

### `update`
Update records in a table with WHERE conditions.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name
- `data` (object, required): Column-value pairs to update
- `where` (string, required): WHERE clause conditions
- `returning` (array, optional): Columns to return after update

**Examples:**

Update single record:
```json
{
  "tool": "update",
  "arguments": {
    "table": "users",
    "data": {
      "last_login": "2024-01-15T10:30:00Z",
      "login_count": "login_count + 1"
    },
    "where": "id = 123"
  }
}
```

Bulk update with returning:
```json
{
  "tool": "update",
  "arguments": {
    "table": "products",
    "data": {
      "price": "price * 1.1",
      "updated_at": "CURRENT_TIMESTAMP"
    },
    "where": "category = 'Electronics'",
    "returning": ["id", "name", "price"]
  }
}
```

### `delete`
Delete records from a table with WHERE conditions.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name
- `where` (string, required): WHERE clause conditions
- `returning` (array, optional): Columns to return after delete

**Examples:**

Delete single record:
```json
{
  "tool": "delete",
  "arguments": {
    "table": "sessions",
    "where": "id = 'abc-123'"
  }
}
```

Bulk delete with returning:
```json
{
  "tool": "delete",
  "arguments": {
    "table": "logs",
    "where": "created_at < '2024-01-01'",
    "returning": ["id", "created_at"]
  }
}
```

---

## Index Management Tools

### `list_indexes`
List all indexes on a table.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name

**Example:**
```json
{
  "tool": "list_indexes",
  "arguments": {
    "table": "users"
  }
}
```

**Returns:**
```json
[
  {
    "indexname": "users_pkey",
    "indexdef": "CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)",
    "tablespace": null
  },
  {
    "indexname": "users_email_idx",
    "indexdef": "CREATE UNIQUE INDEX users_email_idx ON public.users USING btree (email)",
    "tablespace": null
  }
]
```

### `create_index`
Create an index on a table with various options.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name
- `name` (string, required): Index name
- `columns` (array, required): Columns to index
- `unique` (boolean, optional): Create unique index (default: false)
- `method` (string, optional): Index method - "btree", "hash", "gist", "spgist", "gin", "brin" (default: "btree")

**Examples:**

Simple index:
```json
{
  "tool": "create_index",
  "arguments": {
    "table": "orders",
    "name": "idx_orders_created_at",
    "columns": ["created_at"]
  }
}
```

Composite unique index:
```json
{
  "tool": "create_index",
  "arguments": {
    "table": "user_roles",
    "name": "idx_user_roles_unique",
    "columns": ["user_id", "role_id"],
    "unique": true
  }
}
```

GIN index for full-text search:
```json
{
  "tool": "create_index",
  "arguments": {
    "table": "articles",
    "name": "idx_articles_search",
    "columns": ["to_tsvector('english', title || ' ' || content)"],
    "method": "gin"
  }
}
```

---

## Performance Tools

### `analyze_table`
Update table statistics for query optimization.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name

**Example:**
```json
{
  "tool": "analyze_table",
  "arguments": {
    "table": "large_table"
  }
}
```

### `vacuum_table`
Clean up dead tuples and optimize table storage.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name
- `full` (boolean, optional): Perform FULL vacuum (default: false)
- `analyze` (boolean, optional): Update statistics after vacuum (default: true)

**Examples:**

Regular vacuum with analyze:
```json
{
  "tool": "vacuum_table",
  "arguments": {
    "table": "active_table"
  }
}
```

Full vacuum (locks table):
```json
{
  "tool": "vacuum_table",
  "arguments": {
    "table": "bloated_table",
    "full": true,
    "analyze": true
  }
}
```

---

## Advanced Database Features

### `list_views`
List all views in a schema.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")

**Example:**
```json
{
  "tool": "list_views",
  "arguments": {
    "schema": "reporting"
  }
}
```

### `create_view`
Create or replace a view.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `name` (string, required): View name
- `query` (string, required): SELECT query for the view
- `replace` (boolean, optional): Replace if exists (default: false)

**Example:**
```json
{
  "tool": "create_view",
  "arguments": {
    "name": "active_users",
    "query": "SELECT id, name, email, last_login FROM users WHERE active = true AND last_login > CURRENT_DATE - INTERVAL '30 days'",
    "replace": true
  }
}
```

### `list_functions`
List all functions in a schema.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")

**Example:**
```json
{
  "tool": "list_functions",
  "arguments": {
    "schema": "public"
  }
}
```

### `list_sequences`
List all sequences in a schema.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")

**Example:**
```json
{
  "tool": "list_sequences",
  "arguments": {}
}
```

### `list_constraints`
List all constraints on a table.

**Parameters:**
- `schema` (string, optional): Schema name (default: "public")
- `table` (string, required): Table name

**Example:**
```json
{
  "tool": "list_constraints",
  "arguments": {
    "table": "orders"
  }
}
```

**Returns:**
```json
[
  {
    "constraint_name": "orders_pkey",
    "constraint_type": "PRIMARY KEY",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "constraint_name": "orders_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "definition": "FOREIGN KEY (user_id) REFERENCES users(id)"
  },
  {
    "constraint_name": "orders_status_check",
    "constraint_type": "CHECK",
    "definition": "CHECK ((status = ANY (ARRAY['pending', 'completed', 'cancelled'])))"
  }
]
```

---

## Utility Tools

### `database_stats`
Get overall database statistics and connection information.

**Parameters:** None

**Example:**
```json
{
  "tool": "database_stats",
  "arguments": {}
}
```

**Returns:**
```json
{
  "database": "mydb",
  "database_size": "542 MB",
  "active_connections": 15,
  "max_connections": "100",
  "postgres_version": "15.2",
  "current_time": "2024-01-15T10:30:00Z"
}
```

### `list_extensions`
List installed PostgreSQL extensions.

**Parameters:** None

**Example:**
```json
{
  "tool": "list_extensions",
  "arguments": {}
}
```

**Returns:**
```json
[
  {
    "name": "plpgsql",
    "version": "1.0",
    "schema": "pg_catalog"
  },
  {
    "name": "uuid-ossp",
    "version": "1.1",
    "schema": "public"
  },
  {
    "name": "postgis",
    "version": "3.3.2",
    "schema": "public"
  }
]
```

### `backup_table`
Export table data as SQL INSERT statements or CSV format.

**Parameters:**
- `schema` (string, optional): Schema name (default: all schemas)
- `table` (string, optional): Table name (default: all tables)
- `format` (string, optional): Output format - "sql" or "csv" (default: "sql")

**Examples:**

SQL backup of a table:
```json
{
  "tool": "backup_table",
  "arguments": {
    "table": "users",
    "format": "sql"
  }
}
```

CSV export:
```json
{
  "tool": "backup_table",
  "arguments": {
    "schema": "public",
    "table": "products",
    "format": "csv"
  }
}
```

**Returns (SQL format):**
```sql
-- Backup of public.users
-- Generated at 2024-01-15T10:30:00Z

INSERT INTO public.users (id, name, email) VALUES
(1, 'John Doe', 'john@example.com'),
(2, 'Jane Smith', 'jane@example.com');
```

**Returns (CSV format):**
```csv
id,name,email
1,"John Doe","john@example.com"
2,"Jane Smith","jane@example.com"
```

---

## Best Practices

### 1. Use Parameterized Queries
Always use parameterized queries to prevent SQL injection:
```json
{
  "tool": "query",
  "arguments": {
    "query": "SELECT * FROM users WHERE email = $1",
    "params": ["user@example.com"]
  }
}
```

### 2. Transaction Management
Group related operations in transactions:
```json
{
  "tool": "transaction",
  "arguments": {
    "queries": [
      {"query": "INSERT INTO audit_log (action) VALUES ($1)", "params": ["user_update"]},
      {"query": "UPDATE users SET updated_at = NOW() WHERE id = $1", "params": [123]}
    ]
  }
}
```

### 3. Performance Optimization
- Use `explain` to understand query performance
- Create appropriate indexes for frequently queried columns
- Regular `vacuum` and `analyze` for optimal performance
- Use `limit` and `offset` for pagination

### 4. Security
- Never build queries with string concatenation
- Use least-privilege database users
- Regularly review and drop unused indexes
- Be cautious with `drop_table` and `cascade` options

### 5. Monitoring
- Use `database_stats` to monitor connections
- Check `table_stats` for bloat and dead tuples
- Monitor query performance with `explain analyze`