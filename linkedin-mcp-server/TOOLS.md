# LinkedIn MCP Server Tools Reference

This document provides detailed information about all available tools in the LinkedIn MCP Server.

## Table of Contents

- [Authentication](#authentication)
- [Profile Management](#profile-management)
- [Content Sharing](#content-sharing)
- [Post Management](#post-management)
- [Company Management](#company-management)

## Authentication

### authenticate
Authenticate with LinkedIn using OAuth2. This opens a browser window for the user to log in to LinkedIn and authorize the application.

**Parameters:** None

**Returns:**
- Success message upon successful authentication
- Tokens are automatically saved for future use

**Example:**
```json
{
  "tool": "authenticate",
  "arguments": {}
}
```

**Notes:**
- This tool must be run before using any other LinkedIn tools
- The browser will open automatically
- After authorization, you can close the browser window
- Tokens are saved to `.linkedin-mcp.json`

## Profile Management

### get_profile
Get the current authenticated user's profile information.

**Parameters:** None

**Returns:**
- User's LinkedIn profile data including:
  - `sub`: LinkedIn user ID
  - `name`: Full name
  - `given_name`: First name
  - `family_name`: Last name
  - `picture`: Profile picture URL
  - `email`: Email address
  - `email_verified`: Email verification status
  - `locale`: User's locale

**Example:**
```json
{
  "tool": "get_profile",
  "arguments": {}
}
```

### get_user_id
Get the current user's LinkedIn ID (sub field from profile).

**Parameters:** None

**Returns:**
- String containing the user's LinkedIn ID

**Example:**
```json
{
  "tool": "get_user_id",
  "arguments": {}
}
```

## Content Sharing

### share_post
Share a text post on LinkedIn with optional media or article attachment.

**Parameters:**
- `text` (string, required): The text content of the post
- `visibility` (string, optional): Post visibility - "PUBLIC" or "CONNECTIONS" (default: "PUBLIC")
- `mediaUrl` (string, optional): URL of an image to include
- `mediaTitle` (string, optional): Title for the media
- `mediaDescription` (string, optional): Description for the media
- `articleUrl` (string, optional): URL of an article to share
- `articleTitle` (string, optional): Title of the article
- `articleDescription` (string, optional): Description of the article
- `articleThumbnailUrl` (string, optional): Thumbnail URL for the article

**Returns:**
- Post ID of the created post

**Examples:**

Simple text post:
```json
{
  "tool": "share_post",
  "arguments": {
    "text": "Excited to share that I'm learning about Model Context Protocol! 🚀",
    "visibility": "PUBLIC"
  }
}
```

Post with article:
```json
{
  "tool": "share_post",
  "arguments": {
    "text": "Check out this great article on AI trends",
    "articleUrl": "https://example.com/ai-trends",
    "articleTitle": "AI Trends in 2024",
    "articleDescription": "A comprehensive look at emerging AI technologies"
  }
}
```

### share_article
Specialized tool for sharing articles/blog posts with commentary.

**Parameters:**
- `articleUrl` (string, required): URL of the article to share
- `text` (string, required): Your commentary about the article
- `articleTitle` (string, optional): Title of the article
- `articleDescription` (string, optional): Description of the article
- `articleThumbnailUrl` (string, optional): Thumbnail URL for the article
- `visibility` (string, optional): "PUBLIC" or "CONNECTIONS" (default: "PUBLIC")

**Returns:**
- Post ID of the created post

**Example:**
```json
{
  "tool": "share_article",
  "arguments": {
    "articleUrl": "https://myblog.com/mcp-guide",
    "text": "Just published my guide to building MCP servers! This covers everything from authentication to deployment.",
    "articleTitle": "The Complete Guide to MCP Servers",
    "visibility": "PUBLIC"
  }
}
```

### share_image
Share an image on LinkedIn with a caption.

**Parameters:**
- `imagePath` (string, required): Local file path to the image
- `text` (string, required): Caption for the image
- `title` (string, optional): Title for the image
- `description` (string, optional): Description for the image
- `visibility` (string, optional): "PUBLIC" or "CONNECTIONS" (default: "PUBLIC")

**Returns:**
- Post ID of the created post

**Example:**
```json
{
  "tool": "share_image",
  "arguments": {
    "imagePath": "/Users/me/Desktop/product-screenshot.png",
    "text": "Introducing our new dashboard! 📊 We've completely redesigned the user experience.",
    "title": "New Dashboard Design",
    "visibility": "PUBLIC"
  }
}
```

**Supported Image Formats:**
- JPEG/JPG
- PNG
- GIF

## Post Management

### get_user_posts
Retrieve the authenticated user's LinkedIn posts.

**Parameters:**
- `start` (number, optional): Starting index for pagination (default: 0)
- `count` (number, optional): Number of posts to retrieve (default: 10, max: 100)

**Returns:**
- Array of post objects including:
  - Post ID
  - Author information
  - Post content
  - Media attachments
  - Engagement metrics
  - Timestamps

**Example:**
```json
{
  "tool": "get_user_posts",
  "arguments": {
    "start": 0,
    "count": 20
  }
}
```

### delete_post
Delete a LinkedIn post.

**Parameters:**
- `postId` (string, required): ID of the post to delete (format: "urn:li:share:...")

**Returns:**
- Success confirmation message

**Example:**
```json
{
  "tool": "delete_post",
  "arguments": {
    "postId": "urn:li:share:7140234567890123456"
  }
}
```

**Note:** This action cannot be undone.

### get_post_analytics
Get engagement analytics for a specific post.

**Parameters:**
- `postId` (string, required): ID of the post (format: "urn:li:share:...")

**Returns:**
- Analytics data including:
  - Number of likes
  - Number of comments
  - Number of shares
  - Total engagement count
  - Impression data (if available)

**Example:**
```json
{
  "tool": "get_post_analytics",
  "arguments": {
    "postId": "urn:li:share:7140234567890123456"
  }
}
```

## Company Management

### search_companies
Search for companies on LinkedIn.

**Parameters:**
- `query` (string, required): Search query for companies
- `start` (number, optional): Starting index for pagination (default: 0)
- `count` (number, optional): Number of results to retrieve (default: 10)

**Returns:**
- Array of company objects including:
  - Company ID
  - Company name
  - Description
  - Industry
  - Company size
  - Website
  - Logo URL

**Example:**
```json
{
  "tool": "search_companies",
  "arguments": {
    "query": "artificial intelligence startups San Francisco",
    "count": 20
  }
}
```

### get_company
Get detailed information about a specific company.

**Parameters:**
- `companyId` (string, required): LinkedIn company ID

**Returns:**
- Detailed company information including:
  - Full company profile
  - Specialties
  - Founded date
  - Headquarters location
  - Employee count
  - Recent updates

**Example:**
```json
{
  "tool": "get_company",
  "arguments": {
    "companyId": "1441"
  }
}
```

### share_as_company
Share a post on behalf of a company page. Requires admin permissions for the company.

**Parameters:**
- `companyId` (string, required): ID of the company to share as
- `text` (string, required): The text content of the post
- `visibility` (string, optional): "PUBLIC" or "CONNECTIONS" (default: "PUBLIC")
- `mediaUrl` (string, optional): URL of media to include
- `articleUrl` (string, optional): URL of article to share
- `articleTitle` (string, optional): Title of the article
- `articleDescription` (string, optional): Description of the article

**Returns:**
- Post ID of the created post

**Example:**
```json
{
  "tool": "share_as_company",
  "arguments": {
    "companyId": "12345",
    "text": "We're excited to announce our new product launch! Visit our website to learn more.",
    "articleUrl": "https://company.com/new-product",
    "articleTitle": "Introducing Our Latest Innovation",
    "visibility": "PUBLIC"
  }
}
```

**Requirements:**
- You must be an admin of the company page
- The company must have granted your app permission
- Additional verification may be required for some companies

## Error Handling

All tools return appropriate error messages for common scenarios:

### Authentication Errors
- **"Authentication required"**: Run the `authenticate` tool first
- **"Token expired"**: Re-authenticate using the `authenticate` tool
- **"Invalid credentials"**: Check your client ID and secret

### Permission Errors
- **"Insufficient permissions"**: Check your app's LinkedIn products
- **"Not authorized for company"**: Verify admin access to company page
- **"Scope not granted"**: User didn't grant required permissions

### API Errors
- **"Rate limit exceeded"**: Too many requests, wait before retrying
- **"Resource not found"**: Invalid post ID or company ID
- **"Invalid request"**: Check parameter formats

## Best Practices

1. **Authentication**
   - Authenticate once per session
   - Tokens are automatically refreshed
   - Re-authenticate if you get repeated auth errors

2. **Content Sharing**
   - Keep posts under 3000 characters
   - Use high-quality images (recommended: 1200x627px)
   - Include relevant hashtags in your text

3. **Rate Limiting**
   - LinkedIn has strict rate limits
   - Space out bulk operations
   - Implement exponential backoff for retries

4. **Error Handling**
   - Always handle authentication errors gracefully
   - Check for required permissions before operations
   - Validate input parameters before making requests

## LinkedIn API Limitations

1. **Post Frequency**: Avoid posting more than a few times per hour
2. **API Calls**: Limited to approximately 1000 calls per day
3. **Media Size**: Images should be under 10MB
4. **Text Length**: Posts are limited to 3000 characters
5. **Batch Operations**: Most endpoints don't support batch operations

## Common Use Cases

### Daily Blog Post Sharing
```javascript
// Share your daily blog post
share_article({
  articleUrl: "https://myblog.com/todays-post",
  text: "Today's post explores the future of AI in healthcare. What are your thoughts?",
  visibility: "PUBLIC"
})
```

### Company Announcement
```javascript
// Share company news
share_as_company({
  companyId: "12345",
  text: "We're thrilled to announce our Series B funding! This will help us expand our team and accelerate product development. Read more:",
  articleUrl: "https://company.com/series-b-announcement"
})
```

### Content Analytics Review
```javascript
// Get recent posts and their analytics
const posts = get_user_posts({ count: 10 })
for (const post of posts) {
  const analytics = get_post_analytics({ postId: post.id })
  // Review engagement metrics
}
```

Last Updated On: 2025-06-07