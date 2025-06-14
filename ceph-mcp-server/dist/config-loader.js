"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    cluster_name: 'ceph',
    timeout: 30000,
    pool_name: 'default',
    enable_s3: true,
    enable_rbd: true,
    enable_cephfs: true
};
/**
 * Loads configuration from multiple sources with precedence
 */
function loadConfig() {
    let config = { ...DEFAULT_CONFIG };
    // 1. Check for local config file in current directory
    const localConfigPath = path_1.default.join(process.cwd(), '.ceph-mcp.json');
    if (fs_1.default.existsSync(localConfigPath)) {
        try {
            const localConfig = JSON.parse(fs_1.default.readFileSync(localConfigPath, 'utf8'));
            config = { ...config, ...localConfig };
        }
        catch (error) {
            console.error(`Error reading local config file: ${error}`);
        }
    }
    // 2. Check for global config file in home directory
    const globalConfigPath = path_1.default.join(os_1.default.homedir(), '.ceph-mcp.json');
    if (fs_1.default.existsSync(globalConfigPath)) {
        try {
            const globalConfig = JSON.parse(fs_1.default.readFileSync(globalConfigPath, 'utf8'));
            // Local config takes precedence over global
            config = { ...globalConfig, ...config };
        }
        catch (error) {
            console.error(`Error reading global config file: ${error}`);
        }
    }
    // 3. Override with environment variables
    if (process.env.CEPH_CLUSTER_NAME) {
        config.cluster_name = process.env.CEPH_CLUSTER_NAME;
    }
    if (process.env.CEPH_MONITOR_HOSTS) {
        config.monitor_hosts = process.env.CEPH_MONITOR_HOSTS.split(',').map(h => h.trim());
    }
    if (process.env.CEPH_USERNAME) {
        config.username = process.env.CEPH_USERNAME;
    }
    if (process.env.CEPH_KEYRING_PATH) {
        config.keyring_path = process.env.CEPH_KEYRING_PATH;
    }
    if (process.env.CEPH_API_URL) {
        config.api_url = process.env.CEPH_API_URL;
    }
    if (process.env.CEPH_API_USERNAME) {
        config.api_username = process.env.CEPH_API_USERNAME;
    }
    if (process.env.CEPH_API_PASSWORD) {
        config.api_password = process.env.CEPH_API_PASSWORD;
    }
    if (process.env.CEPH_API_KEY) {
        config.api_key = process.env.CEPH_API_KEY;
    }
    if (process.env.CEPH_POOL_NAME) {
        config.pool_name = process.env.CEPH_POOL_NAME;
    }
    if (process.env.CEPH_TIMEOUT) {
        config.timeout = parseInt(process.env.CEPH_TIMEOUT, 10);
    }
    return config;
}
//# sourceMappingURL=config-loader.js.map