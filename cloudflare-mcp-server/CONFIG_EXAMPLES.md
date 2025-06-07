# Cloudflare MCP Server Configuration Examples

This document provides various configuration examples for different Cloudflare setups and use cases.

## Configuration Methods

The Cloudflare MCP Server can be configured in three ways (in order of precedence):

1. **Local configuration file** (`.cloudflare-mcp.json`)
2. **Environment variables**
3. **Default values**

## Basic Configuration Examples

### API Token Configuration (Recommended)

**.cloudflare-mcp.json:**
```json
{
  "apiToken": "your-cloudflare-api-token",
  "accountId": "your-account-id"
}
```

**Environment Variables:**
```bash
export CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
export CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### API Key Configuration (Legacy)

**.cloudflare-mcp.json:**
```json
{
  "apiKey": "your-global-api-key",
  "email": "your-email@example.com",
  "accountId": "your-account-id"
}
```

**Environment Variables:**
```bash
export CLOUDFLARE_API_KEY=your-global-api-key
export CLOUDFLARE_EMAIL=your-email@example.com
export CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### Zone-Specific Configuration

**.cloudflare-mcp.json:**
```json
{
  "apiToken": "your-api-token",
  "accountId": "your-account-id",
  "zoneId": "default-zone-id"
}
```

## Claude Desktop Configuration Examples

### Single Account Setup

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

### Multiple Accounts/Environments

```json
{
  "mcpServers": {
    "cloudflare-personal": {
      "command": "/path/to/cloudflare-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "CLOUDFLARE_API_TOKEN": "personal-account-token",
        "CLOUDFLARE_ACCOUNT_ID": "personal-account-id"
      }
    },
    "cloudflare-work": {
      "command": "/path/to/cloudflare-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "CLOUDFLARE_API_TOKEN": "work-account-token",
        "CLOUDFLARE_ACCOUNT_ID": "work-account-id"
      }
    },
    "cloudflare-client": {
      "command": "/path/to/cloudflare-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "CLOUDFLARE_API_TOKEN": "client-account-token",
        "CLOUDFLARE_ACCOUNT_ID": "client-account-id"
      }
    }
  }
}
```

## Creating API Tokens

### Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Choose a template or **Create Custom Token**

### DNS Management Token

For DNS record management only:

**Permissions:**
- Zone → DNS → Edit
- Zone → Zone → Read

**Zone Resources:**
- Include → Specific zone → example.com

### Full Zone Management Token

For complete zone management:

**Permissions:**
- Zone → Zone Settings → Edit
- Zone → DNS → Edit
- Zone → SSL and Certificates → Edit
- Zone → Firewall Services → Edit
- Zone → Page Rules → Edit
- Zone → Caching Configuration → Edit
- Zone → Cache Purge → Purge

**Zone Resources:**
- Include → All zones from an account → Your Account

### Workers Management Token

For Workers and KV storage:

**Account Permissions:**
- Account → Workers Scripts → Edit
- Account → Workers KV Storage → Edit
- Account → Workers R2 Storage → Edit

**Account Resources:**
- Include → Your Account

### Read-Only Token

For monitoring and reporting:

**Permissions:**
- Zone → Zone → Read
- Zone → DNS → Read
- Zone → Analytics → Read
- Zone → Logs → Read

**Zone Resources:**
- Include → All zones from an account → Your Account

## Configuration for Specific Use Cases

### DNS Automation

**.cloudflare-mcp.json:**
```json
{
  "apiToken": "dns-management-token",
  "zoneId": "your-zone-id"
}
```

Required permissions:
- Zone → DNS → Edit
- Zone → Zone → Read

### Security Management

**.cloudflare-mcp.json:**
```json
{
  "apiToken": "security-token",
  "accountId": "your-account-id"
}
```

Required permissions:
- Zone → Firewall Services → Edit
- Zone → SSL and Certificates → Edit
- Zone → Zone Settings → Edit

### Workers Development

**.cloudflare-mcp.json:**
```json
{
  "apiToken": "workers-token",
  "accountId": "your-account-id"
}
```

Required permissions:
- Account → Workers Scripts → Edit
- Account → Workers KV Storage → Edit
- Account → Workers Routes → Edit

### Multi-Zone Management

**.cloudflare-mcp.json:**
```json
{
  "apiToken": "account-wide-token",
  "accountId": "your-account-id"
}
```

Token configuration:
- Zone Resources → Include → All zones from an account

## Advanced Configurations

### Custom API Endpoint

For Cloudflare enterprise or testing:

**.cloudflare-mcp.json:**
```json
{
  "apiToken": "your-api-token",
  "accountId": "your-account-id",
  "baseUrl": "https://api.cloudflare.com/client/v4",
  "timeout": 60000
}
```

### Development Environment

**.cloudflare-mcp.json:**
```json
{
  "apiToken": "dev-token",
  "accountId": "dev-account-id",
  "timeout": 120000
}
```

### Production Environment

**.cloudflare-mcp.json:**
```json
{
  "apiToken": "prod-restricted-token",
  "accountId": "prod-account-id",
  "timeout": 30000
}
```

## Environment-Specific Examples

### Local Development

```bash
# .env.local
CLOUDFLARE_API_TOKEN=dev-token
CLOUDFLARE_ACCOUNT_ID=dev-account
CLOUDFLARE_TIMEOUT=60000
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Docker Container

```dockerfile
ENV CLOUDFLARE_API_TOKEN=your-token
ENV CLOUDFLARE_ACCOUNT_ID=your-account-id
```

## Token Permission Reference

### Zone-Level Permissions

| Permission | Description | Use Case |
|------------|-------------|----------|
| Zone:Read | Read zone details | Basic access |
| DNS:Read | Read DNS records | DNS queries |
| DNS:Edit | Modify DNS records | DNS automation |
| SSL and Certificates:Read | View SSL settings | SSL monitoring |
| SSL and Certificates:Edit | Manage certificates | SSL automation |
| Firewall Services:Read | View firewall rules | Security audit |
| Firewall Services:Edit | Manage firewall rules | Security automation |
| Cache Purge:Purge | Purge cache | Cache management |

### Account-Level Permissions

| Permission | Description | Use Case |
|------------|-------------|----------|
| Workers Scripts:Read | View Worker scripts | Workers monitoring |
| Workers Scripts:Edit | Deploy Worker scripts | Workers development |
| Workers KV Storage:Read | Read KV values | KV data access |
| Workers KV Storage:Edit | Write KV values | KV data management |
| Workers R2 Storage:Read | List R2 buckets | R2 monitoring |
| Workers R2 Storage:Edit | Manage R2 buckets | R2 management |

## Troubleshooting Configuration

### Test Token Validity

Create a minimal config to test:
```json
{
  "apiToken": "your-token"
}
```

Then use the tool to verify:
```
cloudflare list_zones
```

### Debug Mode

Enable verbose logging:
```bash
export DEBUG=cloudflare-mcp:*
export CLOUDFLARE_API_TOKEN=your-token
```

### Common Issues

1. **"Authentication error"**
   - Verify token is correct
   - Check token hasn't expired
   - Ensure token has required permissions

2. **"Zone not found"**
   - Verify zone ID is correct
   - Check token has access to the zone
   - Ensure account ID matches

3. **"Permission denied"**
   - Review token permissions
   - Some features require specific plans
   - Check API endpoint availability

## Security Best Practices

1. **Use API Tokens** instead of Global API Keys
2. **Minimal Permissions**: Only grant necessary permissions
3. **Separate Tokens**: Use different tokens for different environments
4. **Token Rotation**: Regularly rotate tokens
5. **Secure Storage**: Never commit tokens to version control
6. **IP Restrictions**: Add IP allowlists to tokens when possible

Last Updated On: 2025-06-06