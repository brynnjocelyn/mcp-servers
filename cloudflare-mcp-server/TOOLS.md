# Cloudflare MCP Server Tools Reference

This document provides detailed information about all available tools in the Cloudflare MCP Server.

## Table of Contents

- [Zone Management](#zone-management)
- [DNS Management](#dns-management)
- [Firewall Rules](#firewall-rules)
- [SSL/TLS Management](#ssltls-management)
- [Page Rules](#page-rules)
- [Workers](#workers)
- [Workers KV](#workers-kv)
- [R2 Storage](#r2-storage)
- [Zone Settings](#zone-settings)

## Zone Management

### list_zones
List all zones in your Cloudflare account.

**Parameters:**
- `name` (string, optional): Filter by domain name
- `status` (string, optional): Filter by zone status (active, pending, initializing, moved, deleted)
- `accountId` (string, optional): Filter by account ID
- `page` (number, optional): Page number for pagination
- `perPage` (number, optional): Results per page (max 50)

**Example:**
```json
{
  "tool": "list_zones",
  "arguments": {
    "status": "active",
    "perPage": 20
  }
}
```

### get_zone
Get details of a specific zone.

**Parameters:**
- `zoneId` (string, required): Zone ID

**Example:**
```json
{
  "tool": "get_zone",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353"
  }
}
```

### create_zone
Create a new zone.

**Parameters:**
- `name` (string, required): Domain name (e.g., example.com)
- `accountId` (string, optional): Account ID (uses default if not provided)
- `jumpStart` (boolean, optional): Automatically fetch DNS records
- `type` (string, optional): Zone type - "full" (default) or "partial"

**Example:**
```json
{
  "tool": "create_zone",
  "arguments": {
    "name": "example.com",
    "jumpStart": true
  }
}
```

### delete_zone
Delete a zone.

**Parameters:**
- `zoneId` (string, required): Zone ID to delete

**Warning:** This action is permanent and cannot be undone.

**Example:**
```json
{
  "tool": "delete_zone",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353"
  }
}
```

### purge_all_cache
Purge all cached content for a zone.

**Parameters:**
- `zoneId` (string, required): Zone ID

**Example:**
```json
{
  "tool": "purge_all_cache",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353"
  }
}
```

### purge_cache_by_urls
Purge specific URLs from cache.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `files` (array[string], required): Array of URLs to purge

**Example:**
```json
{
  "tool": "purge_cache_by_urls",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "files": [
      "https://example.com/image.jpg",
      "https://example.com/style.css"
    ]
  }
}
```

## DNS Management

### list_dns_records
List DNS records for a zone.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `type` (string, optional): Filter by record type (A, AAAA, CNAME, TXT, MX, etc.)
- `name` (string, optional): Filter by record name
- `content` (string, optional): Filter by record content
- `page` (number, optional): Page number
- `perPage` (number, optional): Results per page

**Example:**
```json
{
  "tool": "list_dns_records",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "type": "A"
  }
}
```

### get_dns_record
Get details of a specific DNS record.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `recordId` (string, required): DNS record ID

**Example:**
```json
{
  "tool": "get_dns_record",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "recordId": "372e67954025e0ba6aaa6d586b9e0b59"
  }
}
```

### create_dns_record
Create a new DNS record.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `type` (string, required): Record type (A, AAAA, CNAME, TXT, MX, NS, SRV, CAA)
- `name` (string, required): DNS record name (e.g., "example.com" or "sub.example.com")
- `content` (string, required): Record content (e.g., IP address for A record)
- `ttl` (number, optional): Time to live in seconds (1 = automatic)
- `priority` (number, optional): Priority (required for MX and SRV records)
- `proxied` (boolean, optional): Whether traffic is proxied through Cloudflare
- `comment` (string, optional): Comment for the record
- `tags` (array[string], optional): Tags for categorization

**Examples:**

A Record:
```json
{
  "tool": "create_dns_record",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "type": "A",
    "name": "www",
    "content": "192.0.2.1",
    "proxied": true
  }
}
```

MX Record:
```json
{
  "tool": "create_dns_record",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "type": "MX",
    "name": "@",
    "content": "mail.example.com",
    "priority": 10
  }
}
```

### update_dns_record
Update an existing DNS record.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `recordId` (string, required): DNS record ID
- All other parameters from create_dns_record (optional)

**Example:**
```json
{
  "tool": "update_dns_record",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "recordId": "372e67954025e0ba6aaa6d586b9e0b59",
    "content": "192.0.2.2",
    "proxied": false
  }
}
```

### delete_dns_record
Delete a DNS record.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `recordId` (string, required): DNS record ID

**Example:**
```json
{
  "tool": "delete_dns_record",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "recordId": "372e67954025e0ba6aaa6d586b9e0b59"
  }
}
```

## Firewall Rules

### list_firewall_rules
List firewall rules for a zone.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `page` (number, optional): Page number
- `perPage` (number, optional): Results per page

**Example:**
```json
{
  "tool": "list_firewall_rules",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353"
  }
}
```

### create_firewall_rule
Create a new firewall rule.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `filter` (object, required): Filter configuration
  - `expression` (string, required): Filter expression
  - `description` (string, optional): Filter description
- `action` (string, required): Rule action
  - `block`: Block requests
  - `challenge`: Present CAPTCHA
  - `js_challenge`: JavaScript challenge
  - `managed_challenge`: Managed challenge
  - `allow`: Allow requests
  - `log`: Log only
  - `bypass`: Bypass security features
- `description` (string, optional): Rule description
- `priority` (number, optional): Rule priority
- `paused` (boolean, optional): Whether rule is paused

**Example:**
```json
{
  "tool": "create_firewall_rule",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "filter": {
      "expression": "(ip.src in {192.0.2.0/24 203.0.113.0/24})",
      "description": "Block specific IP ranges"
    },
    "action": "block",
    "description": "Block malicious IP ranges"
  }
}
```

### update_firewall_rule
Update an existing firewall rule.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `ruleId` (string, required): Firewall rule ID
- `action` (string, optional): New action
- `description` (string, optional): New description
- `priority` (number, optional): New priority
- `paused` (boolean, optional): Pause/unpause rule

**Example:**
```json
{
  "tool": "update_firewall_rule",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "ruleId": "372e67954025e0ba6aaa6d586b9e0b60",
    "action": "challenge",
    "paused": false
  }
}
```

### delete_firewall_rule
Delete a firewall rule.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `ruleId` (string, required): Firewall rule ID

**Example:**
```json
{
  "tool": "delete_firewall_rule",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "ruleId": "372e67954025e0ba6aaa6d586b9e0b60"
  }
}
```

## SSL/TLS Management

### get_ssl_settings
Get SSL/TLS settings for a zone.

**Parameters:**
- `zoneId` (string, required): Zone ID

**Example:**
```json
{
  "tool": "get_ssl_settings",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353"
  }
}
```

### update_ssl_settings
Update SSL/TLS mode for a zone.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `value` (string, required): SSL mode
  - `off`: No SSL
  - `flexible`: Encrypts traffic between visitors and Cloudflare
  - `full`: Encrypts end-to-end, using self-signed certificate
  - `strict`: Encrypts end-to-end, requiring valid certificate

**Example:**
```json
{
  "tool": "update_ssl_settings",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "value": "strict"
  }
}
```

### list_certificates
List SSL certificates for a zone.

**Parameters:**
- `zoneId` (string, required): Zone ID

**Example:**
```json
{
  "tool": "list_certificates",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353"
  }
}
```

### order_certificate
Order a new SSL certificate.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `hosts` (array[string], required): Hostnames to cover
- `type` (string, optional): Certificate type ("dedicated-custom", "mtls")
- `validityDays` (number, optional): Certificate validity in days

**Example:**
```json
{
  "tool": "order_certificate",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "hosts": ["example.com", "*.example.com"],
    "validityDays": 365
  }
}
```

## Page Rules

### list_page_rules
List page rules for a zone.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `status` (string, optional): Filter by status ("active", "disabled")
- `order` (string, optional): Sort order ("status", "priority")

**Example:**
```json
{
  "tool": "list_page_rules",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "status": "active"
  }
}
```

### create_page_rule
Create a new page rule.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `targets` (array[object], required): URL pattern targets
  - `target`: Must be "url"
  - `constraint`: Object with operator and value
- `actions` (array[object], required): Rule actions
  - `id`: Action identifier
  - `value`: Action value (optional)
- `priority` (number, optional): Rule priority
- `status` (string, optional): Rule status ("active", "disabled")

**Common Actions:**
- `forwarding_url`: URL forwarding
- `always_use_https`: Force HTTPS
- `cache_level`: Set cache level
- `browser_cache_ttl`: Browser cache TTL
- `security_level`: Security level

**Example:**
```json
{
  "tool": "create_page_rule",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "targets": [{
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "*example.com/images/*"
      }
    }],
    "actions": [
      {
        "id": "browser_cache_ttl",
        "value": 14400
      },
      {
        "id": "cache_level",
        "value": "aggressive"
      }
    ],
    "status": "active"
  }
}
```

## Workers

### list_workers
List all Worker scripts.

**Parameters:**
- `accountId` (string, optional): Account ID (uses default if not provided)

**Example:**
```json
{
  "tool": "list_workers",
  "arguments": {}
}
```

### get_worker
Get Worker script content.

**Parameters:**
- `accountId` (string, optional): Account ID
- `scriptName` (string, required): Worker script name

**Example:**
```json
{
  "tool": "get_worker",
  "arguments": {
    "scriptName": "my-worker"
  }
}
```

### create_worker
Create or update a Worker script.

**Parameters:**
- `accountId` (string, optional): Account ID
- `scriptName` (string, required): Worker script name
- `script` (string, required): JavaScript code for the worker
- `bindings` (array[object], optional): Worker bindings (KV namespaces, secrets, etc.)

**Example:**
```json
{
  "tool": "create_worker",
  "arguments": {
    "scriptName": "hello-world",
    "script": "addEventListener('fetch', event => {\n  event.respondWith(new Response('Hello World!'))\n})"
  }
}
```

### delete_worker
Delete a Worker script.

**Parameters:**
- `accountId` (string, optional): Account ID
- `scriptName` (string, required): Worker script name

**Example:**
```json
{
  "tool": "delete_worker",
  "arguments": {
    "scriptName": "my-worker"
  }
}
```

## Workers KV

### list_kv_namespaces
List Workers KV namespaces.

**Parameters:**
- `accountId` (string, optional): Account ID
- `page` (number, optional): Page number
- `perPage` (number, optional): Results per page

**Example:**
```json
{
  "tool": "list_kv_namespaces",
  "arguments": {}
}
```

### create_kv_namespace
Create a new KV namespace.

**Parameters:**
- `accountId` (string, optional): Account ID
- `title` (string, required): Namespace title

**Example:**
```json
{
  "tool": "create_kv_namespace",
  "arguments": {
    "title": "MY_NAMESPACE"
  }
}
```

### delete_kv_namespace
Delete a KV namespace.

**Parameters:**
- `accountId` (string, optional): Account ID
- `namespaceId` (string, required): Namespace ID

**Example:**
```json
{
  "tool": "delete_kv_namespace",
  "arguments": {
    "namespaceId": "06779da6940b431db6e566b4846d64db"
  }
}
```

### list_kv_keys
List keys in a KV namespace.

**Parameters:**
- `accountId` (string, optional): Account ID
- `namespaceId` (string, required): Namespace ID
- `prefix` (string, optional): Key prefix filter
- `limit` (number, optional): Maximum keys to return
- `cursor` (string, optional): Pagination cursor

**Example:**
```json
{
  "tool": "list_kv_keys",
  "arguments": {
    "namespaceId": "06779da6940b431db6e566b4846d64db",
    "prefix": "user:",
    "limit": 100
  }
}
```

### get_kv_value
Get value for a key in KV namespace.

**Parameters:**
- `accountId` (string, optional): Account ID
- `namespaceId` (string, required): Namespace ID
- `key` (string, required): Key name

**Example:**
```json
{
  "tool": "get_kv_value",
  "arguments": {
    "namespaceId": "06779da6940b431db6e566b4846d64db",
    "key": "user:123"
  }
}
```

### put_kv_value
Store a key-value pair in KV namespace.

**Parameters:**
- `accountId` (string, optional): Account ID
- `namespaceId` (string, required): Namespace ID
- `key` (string, required): Key name
- `value` (string, required): Value to store
- `metadata` (object, optional): Key metadata
- `expirationTtl` (number, optional): TTL in seconds

**Example:**
```json
{
  "tool": "put_kv_value",
  "arguments": {
    "namespaceId": "06779da6940b431db6e566b4846d64db",
    "key": "user:123",
    "value": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
    "metadata": {"type": "user"},
    "expirationTtl": 3600
  }
}
```

### delete_kv_value
Delete a key from KV namespace.

**Parameters:**
- `accountId` (string, optional): Account ID
- `namespaceId` (string, required): Namespace ID
- `key` (string, required): Key name

**Example:**
```json
{
  "tool": "delete_kv_value",
  "arguments": {
    "namespaceId": "06779da6940b431db6e566b4846d64db",
    "key": "user:123"
  }
}
```

## R2 Storage

### list_r2_buckets
List R2 storage buckets.

**Parameters:**
- `accountId` (string, optional): Account ID

**Example:**
```json
{
  "tool": "list_r2_buckets",
  "arguments": {}
}
```

### create_r2_bucket
Create a new R2 bucket.

**Parameters:**
- `accountId` (string, optional): Account ID
- `name` (string, required): Bucket name
- `locationHint` (string, optional): Location hint for bucket placement

**Example:**
```json
{
  "tool": "create_r2_bucket",
  "arguments": {
    "name": "my-bucket",
    "locationHint": "enam"
  }
}
```

### delete_r2_bucket
Delete an R2 bucket.

**Parameters:**
- `accountId` (string, optional): Account ID
- `bucketName` (string, required): Bucket name

**Example:**
```json
{
  "tool": "delete_r2_bucket",
  "arguments": {
    "bucketName": "my-bucket"
  }
}
```

## Zone Settings

### get_zone_settings
Get all settings for a zone.

**Parameters:**
- `zoneId` (string, required): Zone ID

**Example:**
```json
{
  "tool": "get_zone_settings",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353"
  }
}
```

### update_zone_setting
Update a specific zone setting.

**Parameters:**
- `zoneId` (string, required): Zone ID
- `setting` (string, required): Setting name
- `value` (any, required): Setting value

**Common Settings:**
- `always_use_https`: Force HTTPS (on/off)
- `min_tls_version`: Minimum TLS version (1.0, 1.1, 1.2, 1.3)
- `automatic_https_rewrites`: Auto HTTPS rewrites (on/off)
- `browser_cache_ttl`: Browser cache TTL in seconds
- `browser_check`: Browser integrity check (on/off)
- `cache_level`: Cache level (bypass, basic, simplified, aggressive)
- `development_mode`: Development mode (on/off)
- `email_obfuscation`: Email obfuscation (on/off)
- `hotlink_protection`: Hotlink protection (on/off)
- `ip_geolocation`: IP geolocation (on/off)
- `minify`: Minification settings
- `mobile_redirect`: Mobile redirect settings
- `opportunistic_encryption`: Opportunistic encryption (on/off)
- `polish`: Image optimization (off, lossless, lossy)
- `rocket_loader`: Rocket Loader (on/off/manual)
- `security_level`: Security level (off, low, medium, high, under_attack)
- `server_side_exclude`: Server side excludes (on/off)
- `sort_query_string_for_cache`: Query string sort (on/off)
- `ssl`: SSL mode (off, flexible, full, strict)
- `tls_1_3`: TLS 1.3 support (on/off)
- `websockets`: WebSocket support (on/off)
- `http2`: HTTP/2 support (on/off)
- `http3`: HTTP/3 support (on/off)

**Example:**
```json
{
  "tool": "update_zone_setting",
  "arguments": {
    "zoneId": "023e105f4ecef8ad9ca31a8372d0c353",
    "setting": "always_use_https",
    "value": "on"
  }
}
```

## Common Workflows

### Complete DNS Setup

1. Create zone
2. Add DNS records
3. Enable security features
4. Configure SSL

### Security Hardening

1. Set SSL to strict
2. Enable always use HTTPS
3. Create firewall rules
4. Configure security level

### Performance Optimization

1. Configure caching
2. Enable minification
3. Set up page rules
4. Enable Argo smart routing

### Workers Deployment

1. Create KV namespace
2. Deploy Worker script
3. Configure routes
4. Bind KV namespace

## Error Handling

All tools return detailed error messages including:
- Error code
- Error message
- Additional context

Common error codes:
- 400: Bad request (invalid parameters)
- 401: Authentication error
- 403: Permission denied
- 404: Resource not found
- 429: Rate limit exceeded

Last Updated On: 2025-06-06