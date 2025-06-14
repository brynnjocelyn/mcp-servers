# Cloudflare MCP Server

A Model Context Protocol (MCP) server that provides comprehensive tools for managing Cloudflare services including zones, DNS, security, caching, Workers, and storage. This server enables LLMs to interact with Cloudflare's API through a standardized interface.

## Overview

This MCP server exposes Cloudflare's extensive API functionality as tools that can be used by any MCP-compatible client (like Claude Desktop). It provides complete management capabilities for domains, DNS records, security rules, SSL certificates, Workers scripts, KV storage, R2 buckets, and more.

## Features

### Zone Management
- List, create, and delete zones
- Manage zone settings and configurations
- Purge cache (all or specific URLs)
- Zone analytics and statistics

### DNS Management
- Full CRUD operations for DNS records
- Support for all record types (A, AAAA, CNAME, MX, TXT, etc.)
- Bulk operations and filtering
- Import/export capabilities

### Security Features
- Firewall rules management
- Web Application Firewall (WAF) configuration
- DDoS protection settings
- Bot management
- SSL/TLS certificate management

### Performance & Caching
- Cache purging and management
- Page rules for URL-specific settings
- Performance optimization settings
- Argo smart routing configuration

### Cloudflare Workers
- Deploy and manage Worker scripts
- Workers KV storage operations
- Cron triggers and routes
- Script bindings management

### R2 Object Storage
- Bucket creation and management
- Object operations (coming soon)
- Access control and CORS settings

## Installation

```bash
npm install
npm run build
```

## Multiple Instance Support

The Cloudflare MCP server supports running multiple instances with different configurations by using the `MCP_SERVER_NAME` environment variable. This enables you to manage multiple Cloudflare accounts or use different configurations for different environments.

### Instance-Specific Configuration

When `MCP_SERVER_NAME` is set, the server will look for a configuration file named `.{MCP_SERVER_NAME}-cloudflare-mcp.json` instead of the default `.cloudflare-mcp.json`.

**Example: Multiple Cloudflare Accounts**
```bash
# Personal Cloudflare account
export MCP_SERVER_NAME=personal
# Uses: .personal-cloudflare-mcp.json

# Work Cloudflare account
export MCP_SERVER_NAME=work
# Uses: .work-cloudflare-mcp.json

# Client Cloudflare account
export MCP_SERVER_NAME=client
# Uses: .client-cloudflare-mcp.json
```

### Configuration File Resolution

The server resolves configuration in this order:
1. **Instance-specific config**: `.{MCP_SERVER_NAME}-cloudflare-mcp.json` (if MCP_SERVER_NAME is set)
2. **Default config file**: `.cloudflare-mcp.json`
3. **Environment variables**
4. **Default values**

### Benefits of Multiple Instances

- **Multi-account**: Manage personal, work, and client Cloudflare accounts separately
- **Environment isolation**: Separate dev, staging, and production configurations
- **Team collaboration**: Different team members with different Cloudflare accounts
- **Client management**: Agencies managing multiple client accounts
- **Claude Code**: Perfect for managing multiple projects with different Cloudflare setups

### Example: Multiple Cloudflare Accounts

**.personal-cloudflare-mcp.json** (Personal):
```json
{
  "apiToken": "personal-account-api-token",
  "accountId": "personal-account-id"
}
```

**.work-cloudflare-mcp.json** (Work):
```json
{
  "apiToken": "work-account-api-token",
  "accountId": "work-account-id",
  "zoneId": "work-primary-zone-id"
}
```

**.client-cloudflare-mcp.json** (Client):
```json
{
  "apiToken": "client-account-api-token",
  "accountId": "client-account-id",
  "timeout": 30000
}
```

### Claude Code Usage

With Claude Code, you can easily switch between Cloudflare accounts:

```bash
# Manage personal domains
MCP_SERVER_NAME=personal claude-code "List all zones and check SSL status"

# Work on company infrastructure
MCP_SERVER_NAME=work claude-code "Update DNS records for staging environment"

# Client management
MCP_SERVER_NAME=client claude-code "Deploy Workers script and check performance"

# Default account
claude-code "Get Cloudflare analytics for the last week"
```

### Claude Desktop Integration

For Claude Desktop, configure multiple Cloudflare servers:

```json
{
  "mcpServers": {
    "cloudflare-personal": {
      "command": "/path/to/cloudflare-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "personal"
      }
    },
    "cloudflare-work": {
      "command": "/path/to/cloudflare-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "work"
      }
    },
    "cloudflare-client": {
      "command": "/path/to/cloudflare-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "client"
      }
    },
    "cloudflare": {
      "command": "/path/to/cloudflare-mcp-server/dist/mcp-server.js",
      "args": []
    }
  }
}
```

## Configuration

The Cloudflare MCP server can be configured in multiple ways (in order of precedence):

### Configuration File (.cloudflare-mcp.json)

Create a `.cloudflare-mcp.json` file in your project directory:

```json
{
  "apiToken": "your-api-token",
  "accountId": "your-account-id",
  "zoneId": "default-zone-id"
}
```

### API Token (Recommended)

API tokens provide fine-grained permissions and are the recommended authentication method:

```json
{
  "apiToken": "your-cloudflare-api-token"
}
```

To create an API token:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use a template or create a custom token with required permissions
4. Copy the token (shown only once)

### API Key (Legacy)

For legacy compatibility, you can use Global API Key:

```json
{
  "apiKey": "your-global-api-key",
  "email": "your-email@example.com"
}
```

### Environment Variables

```bash
# API Token (recommended)
export CLOUDFLARE_API_TOKEN=your-api-token

# OR API Key (legacy)
export CLOUDFLARE_API_KEY=your-api-key
export CLOUDFLARE_EMAIL=your-email@example.com

# Optional
export CLOUDFLARE_ACCOUNT_ID=your-account-id
export CLOUDFLARE_ZONE_ID=default-zone-id
export CLOUDFLARE_BASE_URL=https://api.cloudflare.com/client/v4
export CLOUDFLARE_TIMEOUT=30000
```

## Usage with Claude Desktop

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "/path/to/cloudflare-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Available Tools

### Zone Management

#### list_zones
List all zones in your Cloudflare account.
- `name` (optional): Filter by domain name
- `status` (optional): Filter by zone status
- `accountId` (optional): Filter by account ID
- `page` (optional): Page number
- `perPage` (optional): Results per page (max 50)

#### get_zone
Get details of a specific zone.
- `zoneId`: Zone ID

#### create_zone
Create a new zone.
- `name`: Domain name
- `accountId` (optional): Account ID
- `jumpStart` (optional): Enable Cloudflare default settings
- `type` (optional): Zone type (full/partial)

#### delete_zone
Delete a zone.
- `zoneId`: Zone ID to delete

#### purge_all_cache
Purge all cached content for a zone.
- `zoneId`: Zone ID

#### purge_cache_by_urls
Purge specific URLs from cache.
- `zoneId`: Zone ID
- `files`: Array of URLs to purge

### DNS Management

#### list_dns_records
List DNS records for a zone.
- `zoneId`: Zone ID
- `type` (optional): Filter by record type
- `name` (optional): Filter by record name
- `content` (optional): Filter by record content

#### get_dns_record
Get details of a specific DNS record.
- `zoneId`: Zone ID
- `recordId`: DNS record ID

#### create_dns_record
Create a new DNS record.
- `zoneId`: Zone ID
- `type`: Record type (A, AAAA, CNAME, TXT, MX, etc.)
- `name`: Record name
- `content`: Record content
- `ttl` (optional): Time to live (1 = automatic)
- `proxied` (optional): Proxy through Cloudflare
- `priority` (optional): For MX/SRV records
- `comment` (optional): Record comment
- `tags` (optional): Record tags

#### update_dns_record
Update an existing DNS record.
- `zoneId`: Zone ID
- `recordId`: DNS record ID
- Additional fields same as create_dns_record

#### delete_dns_record
Delete a DNS record.
- `zoneId`: Zone ID
- `recordId`: DNS record ID

### Firewall Rules

#### list_firewall_rules
List firewall rules for a zone.
- `zoneId`: Zone ID

#### create_firewall_rule
Create a new firewall rule.
- `zoneId`: Zone ID
- `filter`: Filter expression and description
- `action`: Rule action (block, challenge, allow, etc.)
- `description` (optional): Rule description
- `priority` (optional): Rule priority
- `paused` (optional): Whether rule is paused

#### update_firewall_rule
Update an existing firewall rule.
- `zoneId`: Zone ID
- `ruleId`: Firewall rule ID
- Additional fields same as create_firewall_rule

#### delete_firewall_rule
Delete a firewall rule.
- `zoneId`: Zone ID
- `ruleId`: Firewall rule ID

### SSL/TLS Management

#### get_ssl_settings
Get SSL/TLS settings for a zone.
- `zoneId`: Zone ID

#### update_ssl_settings
Update SSL/TLS mode for a zone.
- `zoneId`: Zone ID
- `value`: SSL mode (off, flexible, full, strict)

#### list_certificates
List SSL certificates for a zone.
- `zoneId`: Zone ID

#### order_certificate
Order a new SSL certificate.
- `zoneId`: Zone ID
- `hosts`: Array of hostnames to cover
- `type` (optional): Certificate type
- `validityDays` (optional): Certificate validity in days

### Page Rules

#### list_page_rules
List page rules for a zone.
- `zoneId`: Zone ID
- `status` (optional): Filter by status
- `order` (optional): Sort order

#### create_page_rule
Create a new page rule.
- `zoneId`: Zone ID
- `targets`: URL pattern targets
- `actions`: Rule actions
- `priority` (optional): Rule priority
- `status` (optional): Rule status

### Workers

#### list_workers
List all Worker scripts.
- `accountId` (optional): Account ID

#### get_worker
Get Worker script content.
- `accountId` (optional): Account ID
- `scriptName`: Worker script name

#### create_worker
Create or update a Worker script.
- `accountId` (optional): Account ID
- `scriptName`: Worker script name
- `script`: JavaScript code
- `bindings` (optional): Worker bindings

#### delete_worker
Delete a Worker script.
- `accountId` (optional): Account ID
- `scriptName`: Worker script name

### Workers KV

#### list_kv_namespaces
List Workers KV namespaces.
- `accountId` (optional): Account ID

#### create_kv_namespace
Create a new KV namespace.
- `accountId` (optional): Account ID
- `title`: Namespace title

#### delete_kv_namespace
Delete a KV namespace.
- `accountId` (optional): Account ID
- `namespaceId`: Namespace ID

#### list_kv_keys
List keys in a KV namespace.
- `accountId` (optional): Account ID
- `namespaceId`: Namespace ID
- `prefix` (optional): Key prefix filter
- `limit` (optional): Maximum keys to return
- `cursor` (optional): Pagination cursor

#### get_kv_value
Get value for a key in KV namespace.
- `accountId` (optional): Account ID
- `namespaceId`: Namespace ID
- `key`: Key name

#### put_kv_value
Store a key-value pair in KV namespace.
- `accountId` (optional): Account ID
- `namespaceId`: Namespace ID
- `key`: Key name
- `value`: Value to store
- `metadata` (optional): Key metadata
- `expirationTtl` (optional): TTL in seconds

#### delete_kv_value
Delete a key from KV namespace.
- `accountId` (optional): Account ID
- `namespaceId`: Namespace ID
- `key`: Key name

### R2 Storage

#### list_r2_buckets
List R2 storage buckets.
- `accountId` (optional): Account ID

#### create_r2_bucket
Create a new R2 bucket.
- `accountId` (optional): Account ID
- `name`: Bucket name
- `locationHint` (optional): Location hint

#### delete_r2_bucket
Delete an R2 bucket.
- `accountId` (optional): Account ID
- `bucketName`: Bucket name

### Zone Settings

#### get_zone_settings
Get all settings for a zone.
- `zoneId`: Zone ID

#### update_zone_setting
Update a specific zone setting.
- `zoneId`: Zone ID
- `setting`: Setting name
- `value`: Setting value

## Example Workflows

### DNS Record Management

```json
// List all DNS records
{
  "tool": "list_dns_records",
  "arguments": {
    "zoneId": "your-zone-id"
  }
}

// Create A record
{
  "tool": "create_dns_record",
  "arguments": {
    "zoneId": "your-zone-id",
    "type": "A",
    "name": "subdomain.example.com",
    "content": "192.0.2.1",
    "proxied": true
  }
}

// Update record
{
  "tool": "update_dns_record",
  "arguments": {
    "zoneId": "your-zone-id",
    "recordId": "record-id",
    "content": "192.0.2.2"
  }
}
```

### Security Configuration

```json
// Create firewall rule
{
  "tool": "create_firewall_rule",
  "arguments": {
    "zoneId": "your-zone-id",
    "filter": {
      "expression": "(ip.src eq 192.0.2.0/24)",
      "description": "Block specific IP range"
    },
    "action": "block",
    "description": "Block malicious IP range"
  }
}

// Update SSL settings
{
  "tool": "update_ssl_settings",
  "arguments": {
    "zoneId": "your-zone-id",
    "value": "strict"
  }
}
```

### Workers Deployment

```json
// Deploy Worker script
{
  "tool": "create_worker",
  "arguments": {
    "scriptName": "my-worker",
    "script": "addEventListener('fetch', event => { event.respondWith(new Response('Hello World!')) })"
  }
}

// Create KV namespace
{
  "tool": "create_kv_namespace",
  "arguments": {
    "title": "MY_KV_NAMESPACE"
  }
}

// Store value in KV
{
  "tool": "put_kv_value",
  "arguments": {
    "namespaceId": "namespace-id",
    "key": "my-key",
    "value": "my-value",
    "expirationTtl": 3600
  }
}
```

## API Token Permissions

For full functionality, create an API token with these permissions:

### Zone-level permissions:
- Zone:Read
- Zone:Edit
- DNS:Read
- DNS:Edit
- SSL and Certificates:Read
- SSL and Certificates:Edit
- Firewall Services:Read
- Firewall Services:Edit
- Page Rules:Read
- Page Rules:Edit
- Zone Settings:Read
- Zone Settings:Edit
- Cache Purge:Purge

### Account-level permissions:
- Workers Scripts:Read
- Workers Scripts:Edit
- Workers KV Storage:Read
- Workers KV Storage:Edit
- Workers R2 Storage:Read
- Workers R2 Storage:Edit

## Rate Limits

Cloudflare API has rate limits:
- 1200 requests per 5 minutes for most endpoints
- Some endpoints have specific limits
- The server handles rate limit errors gracefully

## Error Handling

The server provides detailed error messages for:
- Authentication failures
- Permission errors
- Resource not found
- Validation errors
- Rate limit exceeded

## Security Considerations

1. **API Token Security**: Store tokens securely, never commit to version control
2. **Minimal Permissions**: Create tokens with only necessary permissions
3. **Zone Isolation**: Use zone-specific tokens when possible
4. **Audit Logs**: Monitor API token usage in Cloudflare dashboard
5. **Token Rotation**: Regularly rotate API tokens

## Troubleshooting

### Authentication Issues
- Verify API token has required permissions
- Check token hasn't expired
- Ensure correct authentication method (token vs key)

### Zone Not Found
- Verify zone ID is correct
- Check account has access to the zone
- Ensure zone status is active

### Permission Errors
- Review API token permissions
- Some operations require specific plans (e.g., Workers)
- Check account limits and quotas

## Development

### Running in Development
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Making the Server Executable
```bash
chmod +x dist/mcp-server.js
```

## License

ISC

Last Updated On: June 14, 2025