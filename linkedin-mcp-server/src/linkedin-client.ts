import axios, { AxiosInstance, AxiosError } from 'axios';
import { LinkedInConfig, saveConfig } from './config-loader.js';
import express from 'express';
import open from 'open';
import { createHash, randomBytes } from 'crypto';
import qs from 'qs';

export interface LinkedInApiError {
  message: string;
  status: number;
  serviceErrorCode?: number;
}

export class LinkedInClient {
  private axios: AxiosInstance;
  private config: LinkedInConfig;
  private authServer?: any;

  constructor(config: LinkedInConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: 'https://api.linkedin.com/v2',
      headers: {
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    // Add auth header if we have an access token
    if (this.config.accessToken) {
      this.axios.defaults.headers.common['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && this.config.refreshToken) {
          // Try to refresh the token
          try {
            await this.refreshAccessToken();
            // Retry the original request
            const originalRequest = error.config;
            originalRequest.headers['Authorization'] = `Bearer ${this.config.accessToken}`;
            return this.axios(originalRequest);
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
          }
        }
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Format error responses
   */
  private formatError(error: AxiosError): LinkedInApiError {
    if (error.response) {
      const data = error.response.data as any;
      return {
        message: data.message || data.error_description || error.message,
        status: error.response.status,
        serviceErrorCode: data.serviceErrorCode,
      };
    }
    return {
      message: error.message,
      status: 0,
    };
  }

  /**
   * Start OAuth2 flow
   */
  public async authenticate(): Promise<void> {
    // Validate required configuration
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error(
        'LinkedIn client_id and client_secret are required for authentication. ' +
        'Please configure them in .linkedin-mcp.json or via environment variables:\n' +
        '  LINKEDIN_CLIENT_ID=your_client_id\n' +
        '  LINKEDIN_CLIENT_SECRET=your_client_secret'
      );
    }

    return new Promise((resolve, reject) => {
      const app = express();
      const port = 3000;
      
      // Generate state and PKCE challenge
      const state = randomBytes(16).toString('hex');
      const codeVerifier = randomBytes(32).toString('base64url');
      const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

      // OAuth authorization URL
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${qs.stringify({
        response_type: 'code',
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        state: state,
        scope: this.config.scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      })}`;

      // Handle callback
      app.get('/callback', async (req, res) => {
        const { code, state: returnedState, error } = req.query;

        if (error) {
          res.send('Authentication failed: ' + error);
          this.authServer?.close();
          reject(new Error('Authentication failed: ' + error));
          return;
        }

        if (returnedState !== state) {
          res.send('Invalid state parameter');
          this.authServer?.close();
          reject(new Error('Invalid state parameter'));
          return;
        }

        try {
          // Exchange code for tokens
          const tokenResponse = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            qs.stringify({
              grant_type: 'authorization_code',
              code,
              client_id: this.config.clientId,
              client_secret: this.config.clientSecret,
              redirect_uri: this.config.redirectUri,
              code_verifier: codeVerifier,
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );

          const { access_token, refresh_token, expires_in } = tokenResponse.data;

          // Update config
          this.config.accessToken = access_token;
          this.config.refreshToken = refresh_token;
          this.config.expiresAt = Date.now() + (expires_in * 1000);

          // Save tokens
          saveConfig({
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: this.config.expiresAt,
          });

          // Update axios headers
          this.axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          res.send(`
            <html>
              <body>
                <h1>Authentication successful!</h1>
                <p>You can close this window and return to your application.</p>
                <script>window.close();</script>
              </body>
            </html>
          `);

          this.authServer?.close();
          resolve();
        } catch (error) {
          console.error('Token exchange error:', error);
          res.send('Failed to exchange authorization code');
          this.authServer?.close();
          reject(error);
        }
      });

      // Start server
      this.authServer = app.listen(port, () => {
        console.log(`OAuth callback server listening on http://localhost:${port}`);
        console.log('Opening browser for authentication...');
        open(authUrl);
      });
    });
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        qs.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      // Update config
      this.config.accessToken = access_token;
      if (refresh_token) {
        this.config.refreshToken = refresh_token;
      }
      this.config.expiresAt = Date.now() + (expires_in * 1000);

      // Save tokens
      saveConfig({
        accessToken: access_token,
        refreshToken: this.config.refreshToken,
        expiresAt: this.config.expiresAt,
      });

      // Update axios headers
      this.axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Check if we need to authenticate or refresh
   */
  public needsAuth(): boolean {
    if (!this.config.accessToken) {
      return true;
    }
    
    // Check if token is expired
    if (this.config.expiresAt && Date.now() >= this.config.expiresAt) {
      return true;
    }
    
    return false;
  }

  /**
   * Get current user profile
   */
  public async getProfile(): Promise<any> {
    const response = await this.axios.get('/userinfo');
    return response.data;
  }

  /**
   * Get user's LinkedIn ID (needed for sharing)
   */
  public async getUserId(): Promise<string> {
    const profile = await this.getProfile();
    return profile.sub; // The 'sub' field contains the LinkedIn user ID
  }

  /**
   * Share a post on LinkedIn
   */
  public async sharePost(params: {
    text: string;
    visibility?: 'PUBLIC' | 'CONNECTIONS';
    mediaUrl?: string;
    mediaTitle?: string;
    mediaDescription?: string;
    articleUrl?: string;
    articleTitle?: string;
    articleDescription?: string;
    articleThumbnailUrl?: string;
  }): Promise<any> {
    const userId = await this.getUserId();
    
    const requestBody: any = {
      author: `urn:li:person:${userId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: params.text,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': params.visibility || 'PUBLIC',
      },
    };

    // Add media if provided
    if (params.articleUrl) {
      requestBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
      requestBody.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: params.articleUrl,
        title: {
          text: params.articleTitle || '',
        },
        description: {
          text: params.articleDescription || '',
        },
        thumbnails: params.articleThumbnailUrl ? [{
          url: params.articleThumbnailUrl,
        }] : [],
      }];
    } else if (params.mediaUrl) {
      requestBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
      requestBody.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        media: params.mediaUrl,
        title: {
          text: params.mediaTitle || '',
        },
        description: {
          text: params.mediaDescription || '',
        },
      }];
    }

    const response = await this.axios.post('/ugcPosts', requestBody);
    return response.data;
  }

  /**
   * Upload an image for sharing
   * Returns the media asset URN to use in posts
   */
  public async uploadImage(imageData: Buffer, userId?: string): Promise<string> {
    if (!userId) {
      userId = await this.getUserId();
    }

    // Step 1: Register upload
    const registerResponse = await this.axios.post('/assets?action=registerUpload', {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: `urn:li:person:${userId}`,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    });

    const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerResponse.data.value.asset;

    // Step 2: Upload the image
    await axios.put(uploadUrl, imageData, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'image/jpeg', // Adjust based on actual image type
      },
    });

    return asset;
  }

  /**
   * Get user's posts
   */
  public async getUserPosts(start: number = 0, count: number = 10): Promise<any> {
    const userId = await this.getUserId();
    const response = await this.axios.get('/ugcPosts', {
      params: {
        q: 'authors',
        authors: `urn:li:person:${userId}`,
        start,
        count,
      },
    });
    return response.data;
  }

  /**
   * Delete a post
   */
  public async deletePost(postId: string): Promise<void> {
    await this.axios.delete(`/ugcPosts/${encodeURIComponent(postId)}`);
  }

  /**
   * Get post analytics
   */
  public async getPostAnalytics(postId: string): Promise<any> {
    const response = await this.axios.get(`/socialActions/${encodeURIComponent(postId)}`);
    return response.data;
  }

  /**
   * Search for companies
   */
  public async searchCompanies(query: string, start: number = 0, count: number = 10): Promise<any> {
    const response = await this.axios.get('/companies', {
      params: {
        q: 'search',
        keywords: query,
        start,
        count,
      },
    });
    return response.data;
  }

  /**
   * Get company details
   */
  public async getCompany(companyId: string): Promise<any> {
    const response = await this.axios.get(`/companies/${companyId}`);
    return response.data;
  }

  /**
   * Share on behalf of a company page (requires additional permissions)
   */
  public async shareAsCompany(companyId: string, params: {
    text: string;
    visibility?: 'PUBLIC' | 'CONNECTIONS';
    mediaUrl?: string;
    articleUrl?: string;
    articleTitle?: string;
    articleDescription?: string;
  }): Promise<any> {
    const requestBody: any = {
      author: `urn:li:organization:${companyId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: params.text,
          },
          shareMediaCategory: params.articleUrl || params.mediaUrl ? 'ARTICLE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': params.visibility || 'PUBLIC',
      },
    };

    // Add media if provided
    if (params.articleUrl) {
      requestBody.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: params.articleUrl,
        title: {
          text: params.articleTitle || '',
        },
        description: {
          text: params.articleDescription || '',
        },
      }];
    }

    const response = await this.axios.post('/ugcPosts', requestBody);
    return response.data;
  }
}