# LinkedIn MCP Server Configuration Examples

This document provides various configuration examples for different LinkedIn integration scenarios.

## Multiple Instance Support

The LinkedIn MCP server supports running multiple instances with different configurations by using the `MCP_SERVER_NAME` environment variable. This enables you to manage multiple LinkedIn accounts or use different configurations for different environments.

### Instance-Specific Configuration

When `MCP_SERVER_NAME` is set, the server will look for a configuration file named `.{MCP_SERVER_NAME}-linkedin-mcp.json` instead of the default `.linkedin-mcp.json`.

**Example: Personal and Business LinkedIn Accounts**
```bash
# Personal LinkedIn account
export MCP_SERVER_NAME=personal
# Uses: .personal-linkedin-mcp.json

# Business/Company account
export MCP_SERVER_NAME=company
# Uses: .company-linkedin-mcp.json

# Development account
export MCP_SERVER_NAME=dev
# Uses: .dev-linkedin-mcp.json
```

### Configuration File Resolution

The server resolves configuration in this order:
1. **Instance-specific config**: `.{MCP_SERVER_NAME}-linkedin-mcp.json` (if MCP_SERVER_NAME is set)
2. **Default config file**: `.linkedin-mcp.json`
3. **Environment variables**
4. **Default values**

### Benefits of Multiple Instances

- **Multi-account**: Separate personal and business LinkedIn accounts
- **Development environments**: Different LinkedIn apps for dev/staging/prod
- **Team collaboration**: Team members with individual LinkedIn app configurations
- **Content strategy**: Different content workflows for different purposes
- **Claude Code**: Perfect for managing multiple projects with different LinkedIn integrations

## Configuration Methods

The LinkedIn MCP Server can be configured in multiple ways (in order of precedence):

## Instance-Specific Configuration Examples

**.personal-linkedin-mcp.json** (Personal Account):
```json
{
  "clientId": "personal-app-client-id",
  "clientSecret": "WPL_AP1.personal.xxxxxxxx.yyyyyyyy",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social"
}
```

**.company-linkedin-mcp.json** (Company Account):
```json
{
  "clientId": "company-app-client-id",
  "clientSecret": "WPL_AP1.company.xxxxxxxx.yyyyyyyy", 
  "redirectUri": "http://localhost:3001/callback",
  "scope": "openid profile email w_member_social r_organization_admin w_organization_social"
}
```

**.dev-linkedin-mcp.json** (Development):
```json
{
  "clientId": "dev-app-client-id",
  "clientSecret": "WPL_AP1.dev.xxxxxxxx.yyyyyyyy",
  "redirectUri": "http://localhost:3002/callback",
  "scope": "openid profile email w_member_social"
}
```

## Basic Configuration Examples

### Initial Setup (Before Authentication)

**.linkedin-mcp.json:**
```json
{
  "clientId": "86p3aqpfdryb5c",
  "clientSecret": "WPL_AP1.xxxxxxxx.yyyyyyyy",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social"
}
```

**Environment Variables:**
```bash
export LINKEDIN_CLIENT_ID=86p3aqpfdryb5c
export LINKEDIN_CLIENT_SECRET=WPL_AP1.xxxxxxxx.yyyyyyyy
export LINKEDIN_REDIRECT_URI=http://localhost:3000/callback
export LINKEDIN_SCOPE="openid profile email w_member_social"
```

### After Authentication (With Tokens)

**.linkedin-mcp.json:**
```json
{
  "clientId": "86p3aqpfdryb5c",
  "clientSecret": "WPL_AP1.xxxxxxxx.yyyyyyyy",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social",
  "accessToken": "AQVJKxxxxxxx...",
  "refreshToken": "AQWZMyyyyyyy...",
  "expiresAt": 1735689600000
}
```

## LinkedIn App Configuration

### Creating a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click "Create app"
3. Fill in required information:
   - **App name**: MCP Server Integration
   - **LinkedIn Page**: Select or create a company page
   - **Privacy policy URL**: Your privacy policy
   - **App logo**: 100x100px image

### OAuth 2.0 Settings

In your LinkedIn app settings:

1. **Authorized redirect URLs**:
   ```
   http://localhost:3000/callback
   ```

2. **OAuth 2.0 scopes**:
   - ✅ Sign In with LinkedIn using OpenID Connect
   - ✅ Share on LinkedIn
   - ✅ Advertising API (if needed for analytics)

## Claude Desktop Configuration Examples

### Basic Setup

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "/path/to/linkedin-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {}
    }
  }
}
```

### With Environment Variables

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "/path/to/linkedin-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "LINKEDIN_CLIENT_ID": "your-client-id",
        "LINKEDIN_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### Multiple LinkedIn Accounts with Instance-Specific Configs

```json
{
  "mcpServers": {
    "linkedin-personal": {
      "command": "/path/to/linkedin-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "personal"
      }
    },
    "linkedin-company": {
      "command": "/path/to/linkedin-mcp-server/dist/mcp-server.js", 
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "company"
      }
    },
    "linkedin-dev": {
      "command": "/path/to/linkedin-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "dev"
      }
    }
  }
}
```

### Multiple LinkedIn Accounts (Legacy Environment Variables)

```json
{
  "mcpServers": {
    "linkedin-personal": {
      "command": "/path/to/linkedin-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "LINKEDIN_CLIENT_ID": "personal-client-id",
        "LINKEDIN_CLIENT_SECRET": "personal-secret"
      }
    },
    "linkedin-company": {
      "command": "/path/to/linkedin-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "LINKEDIN_CLIENT_ID": "company-client-id",
        "LINKEDIN_CLIENT_SECRET": "company-secret"
      }
    }
  }
}
```

## Scope Configuration Examples

### Basic Posting

```json
{
  "scope": "openid profile email w_member_social"
}
```

Allows:
- User authentication
- Reading profile information
- Posting on behalf of the user

### Extended Permissions

```json
{
  "scope": "openid profile email w_member_social r_basicprofile r_organization_admin w_organization_social"
}
```

Allows:
- Everything from basic
- Managing company pages
- Posting as companies
- Reading organization data

### Analytics Access

```json
{
  "scope": "openid profile email w_member_social r_organization_social rw_organization_admin r_1st_connections"
}
```

Allows:
- Post analytics
- Connection insights
- Organization analytics

## Use Case Configurations

### Personal Blog Sharing

**.linkedin-mcp.json:**
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-secret",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social"
}
```

Perfect for:
- Sharing personal blog posts
- Posting updates
- Building personal brand

### Company Social Media Manager

**.linkedin-mcp.json:**
```json
{
  "clientId": "company-app-id",
  "clientSecret": "company-secret",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social r_organization_admin w_organization_social"
}
```

Perfect for:
- Managing multiple company pages
- Scheduling company updates
- Cross-posting content

### Content Analytics Platform

**.linkedin-mcp.json:**
```json
{
  "clientId": "analytics-app-id",
  "clientSecret": "analytics-secret",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social r_organization_social r_1st_connections_size"
}
```

Perfect for:
- Tracking post performance
- Analyzing engagement
- Reporting on social metrics

## Development vs Production

### Development Configuration

**.linkedin-mcp.json:**
```json
{
  "clientId": "dev-client-id",
  "clientSecret": "dev-secret",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social"
}
```

### Production Configuration

Use environment variables for production:

```bash
# .env.production
LINKEDIN_CLIENT_ID=prod-client-id
LINKEDIN_CLIENT_SECRET=prod-secret
LINKEDIN_REDIRECT_URI=https://app.example.com/linkedin/callback
LINKEDIN_SCOPE="openid profile email w_member_social"
```

## Security Configurations

### Minimal Permissions

For read-only access:
```json
{
  "scope": "openid profile email"
}
```

### Secure Token Storage

Store tokens separately from config:

**config.json:**
```json
{
  "clientId": "your-client-id",
  "redirectUri": "http://localhost:3000/callback"
}
```

**tokens.json:** (git-ignored)
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresAt": 1735689600000
}
```

## Troubleshooting Configurations

### Debug Mode

Enable verbose logging:
```bash
export DEBUG=linkedin-mcp:*
export LINKEDIN_CLIENT_ID=your-client-id
export LINKEDIN_CLIENT_SECRET=your-secret
```

### Test Configuration

Minimal config to test connection:
```json
{
  "clientId": "test-client-id",
  "clientSecret": "test-secret"
}
```

Then test with:
```
linkedin authenticate
linkedin get_profile
```

## Common Configuration Issues

### Issue: "Invalid redirect URI"

**Solution:** Ensure redirect URI matches exactly:
```json
{
  "redirectUri": "http://localhost:3000/callback"
}
```

Must match LinkedIn app settings exactly (including trailing slashes).

### Issue: "Insufficient permissions"

**Solution:** Add required scopes:
```json
{
  "scope": "openid profile email w_member_social r_organization_admin"
}
```

### Issue: "Token expired"

**Solution:** Tokens auto-refresh, but if refresh token is invalid:
1. Delete token fields from config
2. Re-authenticate

## Environment-Specific Examples

### Docker Container

```dockerfile
ENV LINKEDIN_CLIENT_ID=your-client-id
ENV LINKEDIN_CLIENT_SECRET=your-secret
ENV LINKEDIN_REDIRECT_URI=http://localhost:3000/callback
```

### GitHub Actions

```yaml
env:
  LINKEDIN_CLIENT_ID: ${{ secrets.LINKEDIN_CLIENT_ID }}
  LINKEDIN_CLIENT_SECRET: ${{ secrets.LINKEDIN_CLIENT_SECRET }}
```

### Kubernetes Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: linkedin-mcp-config
type: Opaque
stringData:
  LINKEDIN_CLIENT_ID: your-client-id
  LINKEDIN_CLIENT_SECRET: your-secret
```

## Best Practices

1. **Never commit secrets**: Add `.linkedin-mcp.json` to `.gitignore`
2. **Use environment variables** in production
3. **Minimal scopes**: Only request what you need
4. **Separate configs**: Use different apps for dev/prod
5. **Regular rotation**: Refresh secrets periodically
6. **Secure storage**: Encrypt tokens at rest
7. **Audit logging**: Track token usage

## Migration Guide

### From Environment Variables to Config File

```bash
# Export current config
echo '{
  "clientId": "'$LINKEDIN_CLIENT_ID'",
  "clientSecret": "'$LINKEDIN_CLIENT_SECRET'",
  "redirectUri": "'$LINKEDIN_REDIRECT_URI'",
  "scope": "'$LINKEDIN_SCOPE'"
}' > .linkedin-mcp.json
```

### From Old Token Format

If you have tokens in an old format:
```javascript
// Convert old format
const oldConfig = {
  access_token: "...",
  refresh_token: "...",
  expires_in: 3600
};

const newConfig = {
  accessToken: oldConfig.access_token,
  refreshToken: oldConfig.refresh_token,
  expiresAt: Date.now() + (oldConfig.expires_in * 1000)
};
```

## Claude Code Usage Examples

### Multiple LinkedIn Accounts with Claude Code

```bash
# Post from personal account
MCP_SERVER_NAME=personal claude-code "Share my latest blog post about AI on LinkedIn"

# Post from company account
MCP_SERVER_NAME=company claude-code "Share company quarterly update on LinkedIn"

# Development testing
MCP_SERVER_NAME=dev claude-code "Test LinkedIn API connection and get profile info"

# Default account
claude-code "Get my LinkedIn post analytics for the last month"
```

### Content Strategy with Multiple Accounts

```bash
# Personal branding
MCP_SERVER_NAME=personal claude-code "Share thought leadership article about industry trends"

# Company marketing  
MCP_SERVER_NAME=company claude-code "Post job opening for senior developer position"

# Development testing
MCP_SERVER_NAME=dev claude-code "Test posting with image attachment"
```

Last Updated On: June 14, 2025