import axios from 'axios';
import FormData from 'form-data';
import { Logger } from './logging.js';
import { RateLimiter } from './rate-limiter.js';
/**
 * Jenkins API client for interacting with Jenkins instances
 */
export class JenkinsClient {
    constructor(config) {
        this.config = config;
        this.rateLimiter = new RateLimiter();
        Logger.info('Initializing Jenkins client', {
            url: config.url,
            username: config.username || 'anonymous',
            authType: config.apiToken ? 'api-token' : config.password ? 'password' : 'none'
        });
        // Setup axios instance with auth
        const axiosConfig = {
            baseURL: config.url,
            timeout: config.timeout,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        };
        // Configure authentication
        if (config.apiToken && config.username) {
            axiosConfig.auth = {
                username: config.username,
                password: config.apiToken
            };
        }
        else if (config.username && config.password) {
            axiosConfig.auth = {
                username: config.username,
                password: config.password
            };
        }
        // SSL verification
        if (!config.verifySsl) {
            axiosConfig.httpsAgent = new (require('https').Agent)({
                rejectUnauthorized: false
            });
        }
        this.client = axios.create(axiosConfig);
        // Add request interceptor for crumb and logging
        this.client.interceptors.request.use(async (config) => {
            const startTime = Date.now();
            config.metadata = { startTime };
            // Log request
            Logger.logRequest(config.method?.toUpperCase() || 'GET', `${config.baseURL}${config.url}`, config.params);
            // Add CSRF crumb for write operations
            if (['post', 'put', 'delete'].includes(config.method?.toLowerCase() || '')) {
                await this.ensureCrumb();
                if (this.crumbIssuer) {
                    config.headers[this.crumbIssuer.crumbRequestField] = this.crumbIssuer.crumb;
                }
            }
            return config;
        });
        // Add response interceptor for logging
        this.client.interceptors.response.use((response) => {
            const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
            Logger.logResponse(response.config.method?.toUpperCase() || 'GET', `${response.config.baseURL}${response.config.url}`, response.status, duration);
            return response;
        }, (error) => {
            if (error.response) {
                const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
                Logger.logResponse(error.config?.method?.toUpperCase() || 'GET', `${error.config?.baseURL}${error.config?.url}`, error.response.status, duration);
                Logger.error(`Jenkins API error: ${error.response.status}`, error.response.data);
            }
            else {
                Logger.error('Network error', error);
            }
            return Promise.reject(error);
        });
    }
    /**
     * Get CSRF protection crumb
     */
    async ensureCrumb() {
        if (this.crumbIssuer)
            return;
        try {
            const response = await this.client.get('/crumbIssuer/api/json');
            this.crumbIssuer = {
                crumb: response.data.crumb,
                crumbRequestField: response.data.crumbRequestField
            };
        }
        catch (error) {
            // Jenkins might not have CSRF protection enabled
            console.error('Failed to get crumb, CSRF protection might be disabled');
        }
    }
    /**
     * Test connection to Jenkins
     */
    async testConnection() {
        return this.rateLimiter.execute(async () => {
            try {
                Logger.info('Testing connection to Jenkins', {
                    url: this.config.url,
                    username: this.config.username || 'anonymous'
                });
                const response = await this.client.get('/api/json');
                Logger.info('Jenkins connection test successful', {
                    jenkinsVersion: response.data.description || 'Unknown',
                    mode: response.data.mode || 'Unknown'
                });
                return true;
            }
            catch (error) {
                Logger.error('Jenkins connection test failed', {
                    url: this.config.url,
                    username: this.config.username || 'anonymous',
                    error: error.message || error
                });
                return false;
            }
        });
    }
    /**
     * Get Jenkins version and system info
     */
    async getSystemInfo() {
        const response = await this.client.get('/api/json');
        return response.data;
    }
    /**
     * List all jobs with pagination support
     */
    async listJobs(folderPath, limit, offset) {
        return this.rateLimiter.execute(async () => {
            const path = folderPath ? `/job/${folderPath}/api/json` : '/api/json';
            const response = await this.client.get(path, {
                params: { tree: 'jobs[name,url,color,buildable,description,lastBuild[number,result,timestamp]]' }
            });
            const allJobs = response.data.jobs || [];
            const total = allJobs.length;
            // Apply pagination if requested
            if (limit !== undefined && offset !== undefined) {
                const paginatedJobs = allJobs.slice(offset, offset + limit);
                return {
                    jobs: paginatedJobs,
                    total,
                    hasMore: offset + limit < total
                };
            }
            return {
                jobs: allJobs,
                total,
                hasMore: false
            };
        });
    }
    /**
     * Get job details
     */
    async getJob(jobName) {
        const response = await this.client.get(`/job/${jobName}/api/json`);
        return response.data;
    }
    /**
     * Get job configuration (XML)
     */
    async getJobConfig(jobName) {
        const response = await this.client.get(`/job/${jobName}/config.xml`, {
            headers: { 'Accept': 'application/xml' }
        });
        return response.data;
    }
    /**
     * Create or update job configuration
     */
    async createOrUpdateJob(jobName, configXml) {
        try {
            // Try to update existing job
            await this.client.post(`/job/${jobName}/config.xml`, configXml, {
                headers: { 'Content-Type': 'application/xml' }
            });
        }
        catch (error) {
            if (error.response?.status === 404) {
                // Job doesn't exist, create it
                await this.client.post('/createItem', configXml, {
                    params: { name: jobName },
                    headers: { 'Content-Type': 'application/xml' }
                });
            }
            else {
                throw error;
            }
        }
    }
    /**
     * Delete a job
     */
    async deleteJob(jobName) {
        await this.client.post(`/job/${jobName}/doDelete`);
    }
    /**
     * Build a job
     */
    async buildJob(jobName, parameters, onProgress) {
        if (onProgress) {
            onProgress(`Preparing to build job: ${jobName}`);
        }
        let response;
        if (parameters && Object.keys(parameters).length > 0) {
            // Build with parameters
            const form = new FormData();
            for (const [key, value] of Object.entries(parameters)) {
                form.append(key, value);
            }
            response = await this.client.post(`/job/${jobName}/buildWithParameters`, form, {
                headers: form.getHeaders()
            });
        }
        else {
            // Build without parameters
            response = await this.client.post(`/job/${jobName}/build`);
        }
        // Extract queue item ID from Location header
        const location = response.headers.location;
        const match = location?.match(/\/queue\/item\/(\d+)\//);
        return match ? parseInt(match[1]) : 0;
    }
    /**
     * Get build info
     */
    async getBuild(jobName, buildNumber) {
        const response = await this.client.get(`/job/${jobName}/${buildNumber}/api/json`);
        return response.data;
    }
    /**
     * Get build log
     */
    async getBuildLog(jobName, buildNumber, start = 0) {
        const response = await this.client.get(`/job/${jobName}/${buildNumber}/logText/progressiveText`, {
            params: { start },
            headers: { 'Accept': 'text/plain' }
        });
        return response.data;
    }
    /**
     * Stop a build
     */
    async stopBuild(jobName, buildNumber) {
        await this.client.post(`/job/${jobName}/${buildNumber}/stop`);
    }
    /**
     * Get queue info
     */
    async getQueue() {
        const response = await this.client.get('/queue/api/json');
        return response.data.items || [];
    }
    /**
     * Cancel queue item
     */
    async cancelQueueItem(itemId) {
        await this.client.post(`/queue/cancelItem`, null, {
            params: { id: itemId }
        });
    }
    /**
     * List build artifacts
     */
    async listArtifacts(jobName, buildNumber) {
        const response = await this.client.get(`/job/${jobName}/${buildNumber}/api/json`, {
            params: { tree: 'artifacts[fileName,relativePath]' }
        });
        return response.data.artifacts || [];
    }
    /**
     * Download artifact
     */
    async downloadArtifact(jobName, buildNumber, artifactPath) {
        const response = await this.client.get(`/job/${jobName}/${buildNumber}/artifact/${artifactPath}`, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    }
    /**
     * List nodes/agents
     */
    async listNodes() {
        const response = await this.client.get('/computer/api/json', {
            params: { tree: 'computer[displayName,offline,idle,numExecutors]' }
        });
        return response.data.computer || [];
    }
    /**
     * Get node info
     */
    async getNode(nodeName) {
        const response = await this.client.get(`/computer/${nodeName}/api/json`);
        return response.data;
    }
    /**
     * Take node offline
     */
    async setNodeOffline(nodeName, message = '') {
        await this.client.post(`/computer/${nodeName}/toggleOffline`, null, {
            params: { offlineMessage: message }
        });
    }
    /**
     * List installed plugins
     */
    async listPlugins() {
        const response = await this.client.get('/pluginManager/api/json', {
            params: { tree: 'plugins[shortName,version,active,enabled]' }
        });
        return response.data.plugins || [];
    }
    /**
     * Restart Jenkins
     */
    async restart(safe = true) {
        const endpoint = safe ? '/safeRestart' : '/restart';
        await this.client.post(endpoint);
    }
    /**
     * Create a view
     */
    async createView(viewName, viewType = 'ListView') {
        const viewXml = `<?xml version="1.0" encoding="UTF-8"?>
<${viewType}>
  <name>${viewName}</name>
  <filterExecutors>false</filterExecutors>
  <filterQueue>false</filterQueue>
  <properties class="hudson.model.View$PropertyList"/>
  <jobNames/>
  <columns>
    <hudson.views.StatusColumn/>
    <hudson.views.WeatherColumn/>
    <hudson.views.JobColumn/>
    <hudson.views.LastSuccessColumn/>
    <hudson.views.LastFailureColumn/>
    <hudson.views.LastDurationColumn/>
    <hudson.views.BuildButtonColumn/>
  </columns>
</${viewType}>`;
        await this.client.post('/createView', viewXml, {
            params: { name: viewName },
            headers: { 'Content-Type': 'application/xml' }
        });
    }
    /**
     * Enable/disable a job
     */
    async setJobEnabled(jobName, enabled) {
        const endpoint = enabled ? 'enable' : 'disable';
        await this.client.post(`/job/${jobName}/${endpoint}`);
    }
}
//# sourceMappingURL=jenkins-client.js.map