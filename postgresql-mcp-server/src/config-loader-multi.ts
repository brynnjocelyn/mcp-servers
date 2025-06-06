import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface PostgresConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

interface MultiServiceConfig {
  services?: {
    [serviceName: string]: PostgresConfig;
  };
  default?: PostgresConfig;
}

/**
 * Find all .postgresql-mcp.json files in subdirectories
 */
function findConfigFiles(dir: string, maxDepth: number = 3): Map<string, string> {
  const configs = new Map<string, string>();
  
  function searchDir(currentDir: string, depth: number) {
    if (depth > maxDepth) return;
    
    try {
      const configPath = join(currentDir, '.postgresql-mcp.json');
      if (existsSync(configPath)) {
        const serviceName = relative(dir, currentDir) || 'root';
        configs.set(serviceName, configPath);
      }
      
      // Search subdirectories
      const entries = readdirSync(currentDir);
      for (const entry of entries) {
        const fullPath = join(currentDir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          searchDir(fullPath, depth + 1);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  searchDir(dir, 0);
  return configs;
}

/**
 * Load configuration for multiple services
 */
export function loadMultiServiceConfig(): MultiServiceConfig {
  const rootDir = process.cwd();
  const configFiles = findConfigFiles(rootDir);
  const multiConfig: MultiServiceConfig = {
    services: {},
    default: loadDefaultConfig()
  };
  
  // Load each service configuration
  for (const [servicePath, configFile] of configFiles) {
    try {
      const configData = readFileSync(configFile, 'utf-8');
      const config = JSON.parse(configData);
      const serviceName = servicePath.replace(/\//g, '-') || 'default';
      
      if (multiConfig.services) {
        multiConfig.services[serviceName] = config;
      }
      
      console.error(`Loaded config for service: ${serviceName} from ${configFile}`);
    } catch (error) {
      console.error(`Error reading config from ${configFile}:`, error);
    }
  }
  
  return multiConfig;
}

/**
 * Get configuration for a specific service or context
 */
export function getServiceConfig(serviceName?: string): PostgresConfig {
  const multiConfig = loadMultiServiceConfig();
  
  // If service name is provided, try to get that specific config
  if (serviceName && multiConfig.services?.[serviceName]) {
    return multiConfig.services[serviceName];
  }
  
  // Try to detect service from current context (e.g., from environment variable)
  const detectedService = process.env.MCP_SERVICE_CONTEXT;
  if (detectedService && multiConfig.services?.[detectedService]) {
    return multiConfig.services[detectedService];
  }
  
  // Fall back to default
  return multiConfig.default || loadDefaultConfig();
}

/**
 * Load default configuration (existing logic)
 */
function loadDefaultConfig(): PostgresConfig {
  const config: PostgresConfig = {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    ssl: process.env.PGSSLMODE === 'require' ? true : false,
    max: parseInt(process.env.PGMAXCONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.PGIDLETIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.PGCONNECTIONTIMEOUT || '2000'),
  };
  
  return config;
}