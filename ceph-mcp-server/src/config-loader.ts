import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Configuration for the Ceph MCP Server
 */
export interface CephConfig {
  // Ceph cluster connection settings
  cluster_name?: string;
  monitor_hosts?: string[];
  username?: string;
  keyring_path?: string;
  
  // API settings (if using REST API)
  api_url?: string;
  api_username?: string;
  api_password?: string;
  api_key?: string;
  
  // Connection settings
  timeout?: number;
  pool_name?: string;
  
  // Feature flags
  enable_s3?: boolean;
  enable_rbd?: boolean;
  enable_cephfs?: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: CephConfig = {
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
export function loadConfig(): CephConfig {
  let config: CephConfig = { ...DEFAULT_CONFIG };

  // Determine config file name - check for MCP instance name first
  const mcpServerName = process.env.MCP_SERVER_NAME || 'ceph-mcp';
  const configFileName = `.${mcpServerName}.json`;
  const configPath = path.join(process.cwd(), configFileName);
  
  // Fallback to default name if custom name doesn't exist
  const defaultConfigPath = path.join(process.cwd(), '.ceph-mcp.json');
  
  // 1. Check for local config file in current directory
  if (fs.existsSync(configPath)) {
    try {
      const localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...localConfig };
      console.error(`Loaded config from ${configFileName}`);
    } catch (error) {
      console.error(`Error reading config file ${configFileName}:`, error);
    }
  } else if (fs.existsSync(defaultConfigPath)) {
    try {
      const localConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
      config = { ...config, ...localConfig };
      console.error('Loaded config from .ceph-mcp.json (fallback)');
    } catch (error) {
      console.error('Error reading config file .ceph-mcp.json:', error);
    }
  } else {
    console.error(`No config file found. Checked: ${configFileName}, .ceph-mcp.json`);
  }

  // 2. Check for global config file in home directory
  const globalConfigPath = path.join(os.homedir(), '.ceph-mcp.json');
  if (fs.existsSync(globalConfigPath)) {
    try {
      const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
      // Local config takes precedence over global
      config = { ...globalConfig, ...config };
    } catch (error) {
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