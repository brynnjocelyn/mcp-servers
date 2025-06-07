"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareClient = void 0;
const axios_1 = __importDefault(require("axios"));
class CloudflareClient {
    client;
    config;
    constructor(config) {
        this.config = config;
        // Create axios instance
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 30000,
            headers: this.getAuthHeaders()
        });
        // Add response interceptor for error handling
        this.client.interceptors.response.use(response => response, error => {
            if (error.response?.data) {
                const cfError = error.response.data;
                const errorMessages = cfError.errors?.map((e) => e.message).join(', ') || 'Unknown error';
                throw new Error(`Cloudflare API error: ${errorMessages}`);
            }
            throw error;
        });
    }
    /**
     * Get authentication headers based on configuration
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.config.apiToken) {
            headers['Authorization'] = `Bearer ${this.config.apiToken}`;
        }
        else if (this.config.apiKey && this.config.email) {
            headers['X-Auth-Key'] = this.config.apiKey;
            headers['X-Auth-Email'] = this.config.email;
        }
        return headers;
    }
    /**
     * Make a GET request
     */
    async get(path, params) {
        const response = await this.client.get(path, { params });
        return response.data;
    }
    /**
     * Make a POST request
     */
    async post(path, data) {
        const response = await this.client.post(path, data);
        return response.data;
    }
    /**
     * Make a PUT request
     */
    async put(path, data) {
        const response = await this.client.put(path, data);
        return response.data;
    }
    /**
     * Make a PATCH request
     */
    async patch(path, data) {
        const response = await this.client.patch(path, data);
        return response.data;
    }
    /**
     * Make a DELETE request
     */
    async delete(path) {
        const response = await this.client.delete(path);
        return response.data;
    }
    /**
     * Verify API token
     */
    async verifyToken() {
        try {
            const response = await this.get('/user/tokens/verify');
            return response.success;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get user details
     */
    async getUser() {
        const response = await this.get('/user');
        return response.result;
    }
    /**
     * List all zones with pagination support
     */
    async listAllZones(params) {
        const allZones = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
            const response = await this.get('/zones', { ...params, page, per_page: 50 });
            allZones.push(...response.result);
            if (response.result_info) {
                hasMore = page * response.result_info.per_page < response.result_info.total_count;
                page++;
            }
            else {
                hasMore = false;
            }
        }
        return allZones;
    }
    /**
     * Get account ID (if not provided in config)
     */
    async getAccountId() {
        if (this.config.accountId) {
            return this.config.accountId;
        }
        const user = await this.getUser();
        if (user.accounts && user.accounts.length > 0) {
            return user.accounts[0].id;
        }
        throw new Error('No account ID found');
    }
}
exports.CloudflareClient = CloudflareClient;
//# sourceMappingURL=cloudflare-client.js.map