# LinkedIn MCP Server

A Model Context Protocol (MCP) server for LinkedIn integration. Share posts, manage content, and interact with the LinkedIn API through a simple interface.

## Features

- **OAuth2 Authentication**: Secure login with LinkedIn using OAuth2 with PKCE
- **Post Sharing**: Share text posts, articles, and images on LinkedIn
- **Content Management**: View, analyze, and delete your LinkedIn posts
- **Company Pages**: Search for companies and share content on behalf of company pages
- **Analytics**: Get engagement metrics for your posts
- **Token Management**: Automatic token refresh and secure storage

## Prerequisites

- Node.js 18 or higher
- LinkedIn account
- LinkedIn OAuth2 app credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-servers.git
cd mcp-servers/linkedin-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Make the server executable:
```bash
chmod +x dist/mcp-server.js
```

## LinkedIn App Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click "Create app"
3. Fill in the required information:
   - App name: Your app name
   - LinkedIn Page: Select or create a company page
   - App logo: Upload a logo
   - Legal agreement: Check the box

4. Once created, go to the "Auth" tab
5. Add OAuth 2.0 redirect URL: `http://localhost:3000/callback`
6. Note your **Client ID** and **Client Secret**

7. In the "Products" tab, request access to:
   - **Share on LinkedIn** (for posting capabilities)
   - **Sign In with LinkedIn using OpenID Connect** (for authentication)

## Multiple Instance Support

The LinkedIn MCP server supports running multiple instances with different configurations by using the `MCP_SERVER_NAME` environment variable. This enables you to manage multiple LinkedIn accounts or use different configurations for different environments.

### Instance-Specific Configuration

When `MCP_SERVER_NAME` is set, the server will look for a configuration file named `.{MCP_SERVER_NAME}-linkedin-mcp.json` instead of the default `.linkedin-mcp.json`.

**Example: Personal and Business Accounts**
```bash
# Personal LinkedIn account
export MCP_SERVER_NAME=personal
# Uses: .personal-linkedin-mcp.json

# Business LinkedIn account
export MCP_SERVER_NAME=business
# Uses: .business-linkedin-mcp.json

# Default account (no MCP_SERVER_NAME)
# Uses: .linkedin-mcp.json
```

### Configuration File Resolution

The server resolves configuration in this order:
1. **Instance-specific config**: `.{MCP_SERVER_NAME}-linkedin-mcp.json` (if MCP_SERVER_NAME is set)
2. **Default config file**: `.linkedin-mcp.json`
3. **Environment variables**
4. **Default values**

### Benefits of Multiple Instances

- **Multi-account**: Manage personal and business LinkedIn accounts separately
- **Development environments**: Separate dev and production LinkedIn apps
- **Team collaboration**: Different team members with different LinkedIn apps
- **Claude Code**: Perfect for managing multiple projects with different LinkedIn integrations

### Example: Multiple LinkedIn Accounts

**.personal-linkedin-mcp.json** (Personal):
```json
{
  "clientId": "personal-app-client-id",
  "clientSecret": "personal-app-secret",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social"
}
```

**.business-linkedin-mcp.json** (Business):
```json
{
  "clientId": "business-app-client-id", 
  "clientSecret": "business-app-secret",
  "redirectUri": "http://localhost:3001/callback",
  "scope": "openid profile email w_member_social r_organization_admin w_organization_social"
}
```

**.linkedin-mcp.json** (Default):
```json
{
  "clientId": "default-client-id",
  "clientSecret": "default-secret",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social"
}
```

### Claude Code Usage

With Claude Code, you can easily switch between LinkedIn accounts:

```bash
# Post from personal account
MCP_SERVER_NAME=personal claude-code "Share my latest blog post on LinkedIn"

# Post from business account
MCP_SERVER_NAME=business claude-code "Share company update on LinkedIn"

# Use default account
claude-code "Get my LinkedIn profile information"
```

### Claude Desktop Integration

For Claude Desktop, configure multiple LinkedIn servers:

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
    "linkedin-business": {
      "command": "/path/to/linkedin-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "business"
      }
    },
    "linkedin": {
      "command": "/path/to/linkedin-mcp-server/dist/mcp-server.js",
      "args": []
    }
  }
}
```

## Configuration

### Method 1: Configuration File (Recommended)

Create `.linkedin-mcp.json` in your project directory:

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social"
}
```

### Method 2: Environment Variables

```bash
export LINKEDIN_CLIENT_ID=your-client-id
export LINKEDIN_CLIENT_SECRET=your-client-secret
export LINKEDIN_REDIRECT_URI=http://localhost:3000/callback
export LINKEDIN_SCOPE="openid profile email w_member_social"
```

### Tokens Storage

After authentication, tokens are automatically saved to `.linkedin-mcp.json`:

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost:3000/callback",
  "scope": "openid profile email w_member_social",
  "accessToken": "...",
  "refreshToken": "...",
  "expiresAt": 1704067200000
}
```

## Claude Desktop Integration

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

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

## Available Tools

### Authentication

#### authenticate
Authenticate with LinkedIn using OAuth2. Opens a browser window for login.

**Parameters:** None

**Example:**
```
Use the authenticate tool
```

### Profile Management

#### get_profile
Get current user's profile information.

**Example:**
```
Get my LinkedIn profile
```

#### get_user_id
Get current user's LinkedIn ID.

**Example:**
```
Get my LinkedIn user ID
```

### Content Sharing

#### share_post
Share a text post on LinkedIn with optional media or article.

**Parameters:**
- `text` (required): The text content of the post
- `visibility` (optional): "PUBLIC" or "CONNECTIONS" (default: "PUBLIC")
- `mediaUrl` (optional): URL of an image to include
- `mediaTitle` (optional): Title for the media
- `mediaDescription` (optional): Description for the media
- `articleUrl` (optional): URL of an article to share
- `articleTitle` (optional): Title of the article
- `articleDescription` (optional): Description of the article
- `articleThumbnailUrl` (optional): Thumbnail URL for the article

**Example:**
```
Share a post on LinkedIn with text "Excited to announce our new product launch! 🚀"
```

#### share_article
Share an article/blog post on LinkedIn with commentary.

**Parameters:**
- `articleUrl` (required): URL of the article to share
- `text` (required): Commentary about the article
- `articleTitle` (optional): Title of the article
- `articleDescription` (optional): Description of the article
- `articleThumbnailUrl` (optional): Thumbnail URL
- `visibility` (optional): "PUBLIC" or "CONNECTIONS"

**Example:**
```
Share this article on LinkedIn: https://example.com/blog/ai-trends-2024
with text "Great insights on AI trends for 2024!"
```

#### share_image
Share an image on LinkedIn with caption.

**Parameters:**
- `imagePath` (required): Local path to the image file
- `text` (required): Caption for the image
- `title` (optional): Title for the image
- `description` (optional): Description for the image
- `visibility` (optional): "PUBLIC" or "CONNECTIONS"

**Example:**
```
Share the image at /Users/me/Desktop/product-demo.jpg on LinkedIn
with caption "Check out our latest product demo!"
```

### Post Management

#### get_user_posts
Get user's LinkedIn posts.

**Parameters:**
- `start` (optional): Starting index for pagination (default: 0)
- `count` (optional): Number of posts to retrieve (default: 10)

**Example:**
```
Get my last 5 LinkedIn posts
```

#### delete_post
Delete a LinkedIn post.

**Parameters:**
- `postId` (required): ID of the post to delete

**Example:**
```
Delete LinkedIn post with ID "urn:li:share:7123456789"
```

#### get_post_analytics
Get analytics for a specific post.

**Parameters:**
- `postId` (required): ID of the post

**Example:**
```
Get analytics for post "urn:li:share:7123456789"
```

### Company Management

#### search_companies
Search for companies on LinkedIn.

**Parameters:**
- `query` (required): Search query
- `start` (optional): Starting index (default: 0)
- `count` (optional): Number of results (default: 10)

**Example:**
```
Search for companies with query "artificial intelligence startups"
```

#### get_company
Get details about a specific company.

**Parameters:**
- `companyId` (required): ID of the company

**Example:**
```
Get details for company ID "1441"
```

#### share_as_company
Share a post on behalf of a company page (requires admin permissions).

**Parameters:**
- `companyId` (required): ID of the company
- `text` (required): Post content
- `visibility` (optional): "PUBLIC" or "CONNECTIONS"
- `mediaUrl` (optional): URL of media
- `articleUrl` (optional): URL of article
- `articleTitle` (optional): Article title
- `articleDescription` (optional): Article description

**Example:**
```
Share as company "1441" with text "We're hiring! Join our team."
```

## Common Workflows

### First-Time Setup
1. Configure your LinkedIn app credentials
2. Use the `authenticate` tool to log in
3. Your tokens will be saved automatically

### Share a Blog Post
```
Share this article on LinkedIn: https://myblog.com/latest-post
with text "Just published a new blog post about MCP servers!"
```

### Share with an Image
```
Share the image at /path/to/image.jpg on LinkedIn
with caption "Excited to share our latest project!"
```

### Manage Posts
```
1. Get my last 10 LinkedIn posts
2. Get analytics for post "urn:li:share:7123456789"
3. Delete post "urn:li:share:7123456789"
```

## Scopes and Permissions

The default scope includes:
- `openid`: Basic OpenID Connect
- `profile`: Access to profile information
- `email`: Access to email address
- `w_member_social`: Ability to post on behalf of the user

For company posting, you need admin access to the company page.

## Error Handling

Common errors and solutions:

### Authentication Required
Run the `authenticate` tool to log in to LinkedIn.

### Token Expired
The server automatically refreshes tokens. If refresh fails, re-authenticate.

### Permission Denied
Check that your LinkedIn app has the required products enabled.

### Rate Limiting
LinkedIn has rate limits. Space out your requests if you hit limits.

## Security Notes

1. **Never commit credentials**: Add `.linkedin-mcp.json` to `.gitignore`
2. **Token storage**: Tokens are stored locally in the config file
3. **HTTPS only**: The redirect URI for production should use HTTPS
4. **Minimal scopes**: Only request the permissions you need

## Development

### Run in development mode:
```bash
npm run dev
```

### Build:
```bash
npm run build
```

### Clean build artifacts:
```bash
npm run clean
```

## Troubleshooting

### Server won't start
- Check that all dependencies are installed
- Ensure the built file is executable
- Verify your configuration is valid

### Authentication fails
- Check your client ID and secret
- Verify the redirect URI matches exactly
- Ensure your LinkedIn app is active

### Can't share posts
- Verify you have the "Share on LinkedIn" product
- Check that your scope includes `w_member_social`
- Ensure you're authenticated

### Company posting fails
- Verify you're an admin of the company page
- Check the company ID is correct
- Some features require additional verification

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests if applicable
4. Submit a pull request

## License

ISC License

## Support

For issues or questions:
- Open an issue on GitHub
- Check the LinkedIn API documentation
- Review the MCP documentation

Last Updated On: June 14, 2025