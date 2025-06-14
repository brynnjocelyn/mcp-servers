import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface S3Config {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
  sessionToken?: string;
  partSize?: number;
  pathStyle?: boolean;
}

/**
 * Loads S3 configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export function loadConfig(): S3Config {
  // Determine config file name - check for MCP instance name first
  const mcpServerName = process.env.MCP_SERVER_NAME || 's3-mcp';
  const configFileName = `.${mcpServerName}.json`;
  const configPath = join(process.cwd(), configFileName);
  
  // Fallback to default name if custom name doesn't exist
  const defaultConfigPath = join(process.cwd(), '.s3-mcp.json');
  
  let fileConfig: Partial<S3Config> = {};
  
  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(configData);
      console.error(`Loaded config from ${configFileName}`);
    } catch (error) {
      console.error(`Error reading config file ${configFileName}:`, error);
    }
  } else if (existsSync(defaultConfigPath)) {
    try {
      const configData = readFileSync(defaultConfigPath, 'utf-8');
      fileConfig = JSON.parse(configData);
      console.error('Loaded config from .s3-mcp.json (fallback)');
    } catch (error) {
      console.error('Error reading config file .s3-mcp.json:', error);
    }
  } else {
    console.error(`No config file found. Checked: ${configFileName}, .s3-mcp.json`);
  }

  // Check for S3/MinIO URL format
  const s3Url = process.env.S3_ENDPOINT_URL || process.env.MINIO_ENDPOINT;
  if (s3Url && !fileConfig.endPoint) {
    try {
      const url = new URL(s3Url);
      fileConfig.endPoint = url.hostname;
      fileConfig.port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
      fileConfig.useSSL = url.protocol === 'https:';
    } catch (error) {
      console.error('Error parsing S3 URL:', error);
    }
  }

  // Build configuration with precedence
  const config: S3Config = {
    endPoint: fileConfig.endPoint || process.env.MINIO_ENDPOINT || process.env.S3_ENDPOINT || 'localhost',
    port: fileConfig.port || parseInt(process.env.MINIO_PORT || process.env.S3_PORT || '9000'),
    useSSL: fileConfig.useSSL !== undefined ? fileConfig.useSSL : (process.env.MINIO_USE_SSL === 'true' || process.env.S3_USE_SSL === 'true'),
    accessKey: fileConfig.accessKey || process.env.MINIO_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretKey: fileConfig.secretKey || process.env.MINIO_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
    region: fileConfig.region || process.env.MINIO_REGION || process.env.AWS_REGION || 'us-east-1',
    sessionToken: fileConfig.sessionToken || process.env.AWS_SESSION_TOKEN,
    partSize: fileConfig.partSize || (10 * 1024 * 1024), // 10MB default
    pathStyle: fileConfig.pathStyle !== undefined ? fileConfig.pathStyle : true // MinIO/local S3 typically uses path-style
  };

  // Validate required fields
  if (!config.endPoint || !config.accessKey || !config.secretKey) {
    throw new Error('Missing required S3 configuration. Please provide endPoint, accessKey, and secretKey.');
  }

  return config;
}

/**
 * Get formatted endpoint URL for display
 */
export function getEndpointUrl(config: S3Config): string {
  const protocol = config.useSSL ? 'https' : 'http';
  const port = (config.useSSL && config.port === 443) || (!config.useSSL && config.port === 80) 
    ? '' 
    : `:${config.port}`;
  return `${protocol}://${config.endPoint}${port}`;
}