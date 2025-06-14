import { LinkedInConfig } from './config-loader.js';
export interface LinkedInApiError {
    message: string;
    status: number;
    serviceErrorCode?: number;
}
export declare class LinkedInClient {
    private axios;
    private config;
    private authServer?;
    constructor(config: LinkedInConfig);
    /**
     * Format error responses
     */
    private formatError;
    /**
     * Start OAuth2 flow
     */
    authenticate(): Promise<void>;
    /**
     * Refresh access token using refresh token
     */
    private refreshAccessToken;
    /**
     * Check if we need to authenticate or refresh
     */
    needsAuth(): boolean;
    /**
     * Get current user profile
     */
    getProfile(): Promise<any>;
    /**
     * Get user's LinkedIn ID (needed for sharing)
     */
    getUserId(): Promise<string>;
    /**
     * Share a post on LinkedIn
     */
    sharePost(params: {
        text: string;
        visibility?: 'PUBLIC' | 'CONNECTIONS';
        mediaUrl?: string;
        mediaTitle?: string;
        mediaDescription?: string;
        articleUrl?: string;
        articleTitle?: string;
        articleDescription?: string;
        articleThumbnailUrl?: string;
    }): Promise<any>;
    /**
     * Upload an image for sharing
     * Returns the media asset URN to use in posts
     */
    uploadImage(imageData: Buffer, userId?: string): Promise<string>;
    /**
     * Get user's posts
     */
    getUserPosts(start?: number, count?: number): Promise<any>;
    /**
     * Delete a post
     */
    deletePost(postId: string): Promise<void>;
    /**
     * Get post analytics
     */
    getPostAnalytics(postId: string): Promise<any>;
    /**
     * Search for companies
     */
    searchCompanies(query: string, start?: number, count?: number): Promise<any>;
    /**
     * Get company details
     */
    getCompany(companyId: string): Promise<any>;
    /**
     * Share on behalf of a company page (requires additional permissions)
     */
    shareAsCompany(companyId: string, params: {
        text: string;
        visibility?: 'PUBLIC' | 'CONNECTIONS';
        mediaUrl?: string;
        articleUrl?: string;
        articleTitle?: string;
        articleDescription?: string;
    }): Promise<any>;
}
//# sourceMappingURL=linkedin-client.d.ts.map