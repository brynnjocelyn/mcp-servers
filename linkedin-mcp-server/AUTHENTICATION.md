# LinkedIn MCP Server Authentication Guide

This guide provides detailed instructions for setting up and managing LinkedIn OAuth2 authentication.

## Overview

The LinkedIn MCP Server uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for secure authentication. This provides:

- Secure authorization without exposing credentials
- Automatic token refresh
- Granular permission scopes
- Multi-account support

## Prerequisites

1. LinkedIn account
2. LinkedIn Developer account (free)
3. A LinkedIn Company Page (required for app creation)

## Step 1: Create a LinkedIn App

### 1.1 Navigate to LinkedIn Developers

Go to [https://www.linkedin.com/developers/](https://www.linkedin.com/developers/) and sign in.

### 1.2 Create New App

Click **"Create app"** and fill in:

- **App name**: Choose a descriptive name (e.g., "MCP LinkedIn Integration")
- **LinkedIn Page**: 
  - Select an existing company page, or
  - Click "Create a new LinkedIn Page" if needed
- **Privacy policy URL**: Your privacy policy (can be a placeholder for testing)
- **App logo**: Upload a 100x100px image

### 1.3 Configure OAuth Settings

1. Go to the **"Auth"** tab
2. Under **"OAuth 2.0 settings"**:
   - Add Authorized redirect URL: `http://localhost:3000/callback`
   - For production, add your production callback URL

3. Note your credentials:
   - **Client ID**: (looks like "86p3aqpfdryb5c")
   - **Client Secret**: (looks like "WPL_AP1.xxxxxxxx.yyyyyyyy")

### 1.4 Request API Products

1. Go to the **"Products"** tab
2. Request access to:
   - **Sign In with LinkedIn using OpenID Connect** (usually instant approval)
   - **Share on LinkedIn** (may require review)
   - **Advertising API** (optional, for analytics)

## Step 2: Configure MCP Server

### 2.1 Create Configuration File

Create `.linkedin-mcp.json` in your project directory:

```json
{
  "clientId": "your-client-id-here",
  "clientSecret": "your-client-secret-here",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social"
}
```

### 2.2 Alternative: Use Environment Variables

```bash
export LINKEDIN_CLIENT_ID="your-client-id-here"
export LINKEDIN_CLIENT_SECRET="your-client-secret-here"
export LINKEDIN_REDIRECT_URI="http://localhost:3000/callback"
export LINKEDIN_SCOPE="openid profile email w_member_social"
```

## Step 3: Initial Authentication

### 3.1 Start the MCP Server

```bash
npm run build
npm start
```

### 3.2 Authenticate via Claude

In Claude Desktop, use:
```
Use the authenticate tool
```

### 3.3 Complete OAuth Flow

1. A browser window will open automatically
2. Log in to LinkedIn if not already logged in
3. Review and accept the permissions
4. You'll see "Authentication successful!" 
5. The browser window can be closed

### 3.4 Verify Authentication

Test that authentication worked:
```
Get my LinkedIn profile
```

## OAuth 2.0 Scopes

### Available Scopes

| Scope | Description | Use Case |
|-------|-------------|----------|
| `openid` | Basic OpenID Connect | Required for authentication |
| `profile` | Basic profile information | Name, photo, headline |
| `email` | Email address | Contact information |
| `w_member_social` | Post on user's behalf | Share posts, articles |
| `r_basicprofile` | Extended profile data | Detailed profile info |
| `r_organization_admin` | Manage organizations | Company page access |
| `w_organization_social` | Post as organization | Company posts |
| `r_1st_connections` | Connection data | Network analytics |
| `r_ads` | Advertising data | Campaign analytics |

### Recommended Scope Combinations

**Personal Use:**
```json
"scope": "openid profile email w_member_social"
```

**Business Use:**
```json
"scope": "openid profile email w_member_social r_organization_admin w_organization_social"
```

**Analytics Focus:**
```json
"scope": "openid profile email w_member_social r_1st_connections r_organization_social"
```

## Token Management

### Token Storage

After successful authentication, tokens are saved in `.linkedin-mcp.json`:

```json
{
  "clientId": "...",
  "clientSecret": "...",
  "redirectUri": "...",
  "scope": "...",
  "accessToken": "AQVJKxxxxxx...",
  "refreshToken": "AQWZMyyyyyy...",
  "expiresAt": 1735689600000
}
```

### Token Lifecycle

1. **Access Token**: 
   - Valid for 60 days
   - Used for API requests
   - Automatically refreshed when expired

2. **Refresh Token**:
   - Valid for 365 days
   - Used to obtain new access tokens
   - Must re-authenticate when expired

### Manual Token Refresh

Tokens refresh automatically, but you can force a refresh:

```javascript
// The server handles this automatically
// Tokens are refreshed on 401 responses
```

## Security Best Practices

### 1. Protect Your Credentials

**Never commit secrets:**
```bash
# .gitignore
.linkedin-mcp.json
.env
*.token
```

### 2. Use Environment Variables in Production

```bash
# Production setup
export LINKEDIN_CLIENT_ID="${SECRET_LINKEDIN_CLIENT_ID}"
export LINKEDIN_CLIENT_SECRET="${SECRET_LINKEDIN_CLIENT_SECRET}"
```

### 3. Implement Token Encryption

For production, consider encrypting tokens:

```javascript
// Example: Encrypt tokens before storage
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const password = process.env.ENCRYPTION_KEY;

function encryptToken(token) {
  const salt = crypto.randomBytes(64);
  const key = crypto.pbkdf2Sync(password, salt, 2145, 32, 'sha512');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted.toString('hex'),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}
```

### 4. Limit Scope Access

Only request necessary permissions:
- Start with minimal scopes
- Add scopes as needed
- Review scope usage regularly

### 5. Implement IP Restrictions

For production apps, consider IP allowlisting in LinkedIn app settings.

## Multi-Account Setup

### Managing Multiple LinkedIn Accounts

**Directory Structure:**
```
linkedin-accounts/
├── personal/
│   └── .linkedin-mcp.json
├── company-a/
│   └── .linkedin-mcp.json
└── company-b/
    └── .linkedin-mcp.json
```

**Claude Desktop Config:**
```json
{
  "mcpServers": {
    "linkedin-personal": {
      "command": "/path/to/mcp-server.js",
      "args": [],
      "env": {
        "PWD": "/path/to/linkedin-accounts/personal"
      }
    },
    "linkedin-company": {
      "command": "/path/to/mcp-server.js",
      "args": [],
      "env": {
        "PWD": "/path/to/linkedin-accounts/company-a"
      }
    }
  }
}
```

## Troubleshooting Authentication

### Common Issues and Solutions

#### "Invalid client id"
- Verify client ID matches exactly
- Check for extra spaces or characters
- Ensure app is not in deleted state

#### "Invalid redirect URI"
- Must match exactly (including protocol)
- Check for trailing slashes
- Verify it's added in LinkedIn app settings

#### "Invalid scope"
- Check scope spelling
- Ensure requested products are approved
- Some scopes require additional verification

#### "Authorization code expired"
- Complete OAuth flow within 10 minutes
- Don't reuse authorization codes
- Restart authentication if timeout

#### "Token expired" 
- Access tokens last 60 days
- Refresh tokens last 365 days
- Re-authenticate if refresh fails

### Debug Mode

Enable debug logging:
```bash
export DEBUG=linkedin-mcp:*
export NODE_ENV=development
```

### Testing Authentication

1. **Test OAuth Flow:**
```bash
# Start server in test mode
npm run dev

# In another terminal
curl http://localhost:3000/test-auth
```

2. **Verify Token Validity:**
```javascript
// Test endpoint (add to server)
app.get('/test-token', async (req, res) => {
  try {
    const profile = await linkedInClient.getProfile();
    res.json({ valid: true, profile });
  } catch (error) {
    res.json({ valid: false, error: error.message });
  }
});
```

## Production Considerations

### 1. Use HTTPS for Redirect URI

```json
{
  "redirectUri": "https://app.example.com/linkedin/callback"
}
```

### 2. Implement State Parameter Validation

The server already implements state validation for CSRF protection.

### 3. Add Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

app.use('/callback', authLimiter);
```

### 4. Monitor Token Usage

Log token refreshes and usage:
```javascript
// Add to linkedin-client.ts
private logTokenUsage(action: string) {
  console.log({
    timestamp: new Date().toISOString(),
    action,
    tokenAge: this.config.expiresAt 
      ? Date.now() - this.config.expiresAt 
      : null
  });
}
```

### 5. Implement Token Rotation

For high-security environments:
```javascript
// Rotate tokens periodically
async function rotateTokens() {
  if (shouldRotate()) {
    await linkedInClient.refreshAccessToken();
    // Log rotation
    // Notify admins
  }
}
```

## LinkedIn API Requirements

### App Review Process

For production use:
1. Complete app information
2. Add company verification
3. Submit for review if needed
4. Some APIs require partnership

### Rate Limits

Be aware of LinkedIn's rate limits:
- Application rate limits: ~100 requests per day
- User rate limits: ~100 requests per user per day
- Throttling starts at 75% of limit

### Compliance

Follow LinkedIn's policies:
- Store minimal user data
- Respect user privacy
- Follow data retention policies
- Implement user data deletion

## Additional Resources

- [LinkedIn OAuth Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [LinkedIn API Terms of Use](https://legal.linkedin.com/api-terms-of-use)
- [LinkedIn Developer Support](https://www.linkedin.com/help/linkedin/ask/DevHelp)

Last Updated On: 2025-06-07