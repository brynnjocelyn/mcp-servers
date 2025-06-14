#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { loadConfig } from './config-loader.js';
import { LinkedInClient } from './linkedin-client.js';
import { readFileSync } from 'fs';
// Authentication Schema
const AuthenticateSchema = z.object({});
// Profile Schemas
const GetProfileSchema = z.object({});
const GetUserIdSchema = z.object({});
// Post Sharing Schemas
const SharePostSchema = z.object({
    text: z.string().describe('The text content of the post'),
    visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().default('PUBLIC').describe('Post visibility'),
    mediaUrl: z.string().optional().describe('URL of an image to include'),
    mediaTitle: z.string().optional().describe('Title for the media'),
    mediaDescription: z.string().optional().describe('Description for the media'),
    articleUrl: z.string().optional().describe('URL of an article to share'),
    articleTitle: z.string().optional().describe('Title of the article'),
    articleDescription: z.string().optional().describe('Description of the article'),
    articleThumbnailUrl: z.string().optional().describe('Thumbnail URL for the article'),
});
const ShareArticleSchema = z.object({
    articleUrl: z.string().describe('URL of the article to share'),
    text: z.string().describe('Commentary about the article'),
    articleTitle: z.string().optional().describe('Title of the article (auto-fetched if not provided)'),
    articleDescription: z.string().optional().describe('Description of the article'),
    articleThumbnailUrl: z.string().optional().describe('Thumbnail URL for the article'),
    visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().default('PUBLIC'),
});
const ShareImageSchema = z.object({
    imagePath: z.string().describe('Local path to the image file'),
    text: z.string().describe('Caption for the image'),
    title: z.string().optional().describe('Title for the image'),
    description: z.string().optional().describe('Description for the image'),
    visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().default('PUBLIC'),
});
// Post Management Schemas
const GetUserPostsSchema = z.object({
    start: z.number().optional().default(0).describe('Starting index for pagination'),
    count: z.number().optional().default(10).describe('Number of posts to retrieve'),
});
const DeletePostSchema = z.object({
    postId: z.string().describe('ID of the post to delete'),
});
const GetPostAnalyticsSchema = z.object({
    postId: z.string().describe('ID of the post to get analytics for'),
});
// Company Schemas
const SearchCompaniesSchema = z.object({
    query: z.string().describe('Search query for companies'),
    start: z.number().optional().default(0).describe('Starting index for pagination'),
    count: z.number().optional().default(10).describe('Number of results to retrieve'),
});
const GetCompanySchema = z.object({
    companyId: z.string().describe('ID of the company'),
});
const ShareAsCompanySchema = z.object({
    companyId: z.string().describe('ID of the company to share as'),
    text: z.string().describe('The text content of the post'),
    visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().default('PUBLIC'),
    mediaUrl: z.string().optional().describe('URL of media to include'),
    articleUrl: z.string().optional().describe('URL of article to share'),
    articleTitle: z.string().optional().describe('Title of the article'),
    articleDescription: z.string().optional().describe('Description of the article'),
});
/**
 * Create an MCP server for LinkedIn operations
 */
const server = new Server({
    name: 'linkedin-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize LinkedIn client
let linkedInClient = null;
async function initializeClient() {
    try {
        const config = loadConfig();
        linkedInClient = new LinkedInClient(config);
        // Check if we need to authenticate
        if (linkedInClient.needsAuth()) {
            console.error('LinkedIn authentication required. Use the "authenticate" tool to log in.');
        }
        else {
            console.error('LinkedIn client initialized successfully');
        }
    }
    catch (error) {
        console.error('Failed to initialize LinkedIn client:', error);
        linkedInClient = null;
    }
}
// Initialize on startup
initializeClient().catch(console.error);
/**
 * Ensure client is initialized and authenticated
 */
async function ensureClient() {
    if (!linkedInClient) {
        throw new Error('LinkedIn client not initialized. Check configuration.');
    }
    if (linkedInClient.needsAuth()) {
        throw new Error('Authentication required. Please use the "authenticate" tool first.');
    }
    return linkedInClient;
}
/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // Authentication
            {
                name: 'authenticate',
                description: 'Authenticate with LinkedIn using OAuth2',
                inputSchema: zodToJsonSchema(AuthenticateSchema),
            },
            // Profile
            {
                name: 'get_profile',
                description: 'Get current user profile information',
                inputSchema: zodToJsonSchema(GetProfileSchema),
            },
            {
                name: 'get_user_id',
                description: 'Get current user LinkedIn ID',
                inputSchema: zodToJsonSchema(GetUserIdSchema),
            },
            // Sharing
            {
                name: 'share_post',
                description: 'Share a text post on LinkedIn with optional media or article',
                inputSchema: zodToJsonSchema(SharePostSchema),
            },
            {
                name: 'share_article',
                description: 'Share an article/blog post on LinkedIn with commentary',
                inputSchema: zodToJsonSchema(ShareArticleSchema),
            },
            {
                name: 'share_image',
                description: 'Share an image on LinkedIn with caption',
                inputSchema: zodToJsonSchema(ShareImageSchema),
            },
            // Post Management
            {
                name: 'get_user_posts',
                description: 'Get user\'s LinkedIn posts',
                inputSchema: zodToJsonSchema(GetUserPostsSchema),
            },
            {
                name: 'delete_post',
                description: 'Delete a LinkedIn post',
                inputSchema: zodToJsonSchema(DeletePostSchema),
            },
            {
                name: 'get_post_analytics',
                description: 'Get analytics for a specific post',
                inputSchema: zodToJsonSchema(GetPostAnalyticsSchema),
            },
            // Companies
            {
                name: 'search_companies',
                description: 'Search for companies on LinkedIn',
                inputSchema: zodToJsonSchema(SearchCompaniesSchema),
            },
            {
                name: 'get_company',
                description: 'Get details about a specific company',
                inputSchema: zodToJsonSchema(GetCompanySchema),
            },
            {
                name: 'share_as_company',
                description: 'Share a post on behalf of a company page (requires admin permissions)',
                inputSchema: zodToJsonSchema(ShareAsCompanySchema),
            },
        ],
    };
});
/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            // Authentication
            case 'authenticate': {
                if (!linkedInClient) {
                    const config = loadConfig();
                    linkedInClient = new LinkedInClient(config);
                }
                await linkedInClient.authenticate();
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Successfully authenticated with LinkedIn! You can now use all LinkedIn tools.',
                        },
                    ],
                };
            }
            // Profile
            case 'get_profile': {
                const client = await ensureClient();
                const profile = await client.getProfile();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(profile, null, 2),
                        },
                    ],
                };
            }
            case 'get_user_id': {
                const client = await ensureClient();
                const userId = await client.getUserId();
                return {
                    content: [
                        {
                            type: 'text',
                            text: userId,
                        },
                    ],
                };
            }
            // Sharing
            case 'share_post': {
                const client = await ensureClient();
                const params = SharePostSchema.parse(args);
                const result = await client.sharePost(params);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Post shared successfully!\nPost ID: ${result.id}`,
                        },
                    ],
                };
            }
            case 'share_article': {
                const client = await ensureClient();
                const params = ShareArticleSchema.parse(args);
                const result = await client.sharePost({
                    text: params.text,
                    visibility: params.visibility,
                    articleUrl: params.articleUrl,
                    articleTitle: params.articleTitle,
                    articleDescription: params.articleDescription,
                    articleThumbnailUrl: params.articleThumbnailUrl,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Article shared successfully!\nPost ID: ${result.id}`,
                        },
                    ],
                };
            }
            case 'share_image': {
                const client = await ensureClient();
                const params = ShareImageSchema.parse(args);
                // Read image file
                const imageData = readFileSync(params.imagePath);
                // Upload image
                const mediaAsset = await client.uploadImage(imageData);
                // Share post with image
                const result = await client.sharePost({
                    text: params.text,
                    visibility: params.visibility,
                    mediaUrl: mediaAsset,
                    mediaTitle: params.title,
                    mediaDescription: params.description,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Image shared successfully!\nPost ID: ${result.id}`,
                        },
                    ],
                };
            }
            // Post Management
            case 'get_user_posts': {
                const client = await ensureClient();
                const params = GetUserPostsSchema.parse(args);
                const posts = await client.getUserPosts(params.start, params.count);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(posts, null, 2),
                        },
                    ],
                };
            }
            case 'delete_post': {
                const client = await ensureClient();
                const { postId } = DeletePostSchema.parse(args);
                await client.deletePost(postId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Post ${postId} deleted successfully`,
                        },
                    ],
                };
            }
            case 'get_post_analytics': {
                const client = await ensureClient();
                const { postId } = GetPostAnalyticsSchema.parse(args);
                const analytics = await client.getPostAnalytics(postId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(analytics, null, 2),
                        },
                    ],
                };
            }
            // Companies
            case 'search_companies': {
                const client = await ensureClient();
                const params = SearchCompaniesSchema.parse(args);
                const companies = await client.searchCompanies(params.query, params.start, params.count);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(companies, null, 2),
                        },
                    ],
                };
            }
            case 'get_company': {
                const client = await ensureClient();
                const { companyId } = GetCompanySchema.parse(args);
                const company = await client.getCompany(companyId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(company, null, 2),
                        },
                    ],
                };
            }
            case 'share_as_company': {
                const client = await ensureClient();
                const params = ShareAsCompanySchema.parse(args);
                const result = await client.shareAsCompany(params.companyId, {
                    text: params.text,
                    visibility: params.visibility,
                    mediaUrl: params.mediaUrl,
                    articleUrl: params.articleUrl,
                    articleTitle: params.articleTitle,
                    articleDescription: params.articleDescription,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Post shared as company successfully!\nPost ID: ${result.id}`,
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        console.error(`Error executing ${name}:`, error);
        // Special handling for auth errors
        if (error instanceof Error && error.message.includes('Authentication required')) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Authentication required. Please run the "authenticate" tool first to log in to LinkedIn.',
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
/**
 * Start the server
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('LinkedIn MCP server started');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map