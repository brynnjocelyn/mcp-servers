import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  connectionTimeoutMillis?: number;
  query_timeout?: number;
  statement_timeout?: number;
  idle_in_transaction_session_timeout?: number;
  max?: number; // Maximum number of clients in the pool
}

/**
 * Loads PostgreSQL configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export function loadConfig(): PostgresConfig {
  // Determine config file name - check for MCP instance name first
  const mcpServerName = process.env.MCP_SERVER_NAME || 'postgresql-mcp';
  const configFileName = `.${mcpServerName}.json`;
  const configPath = join(process.cwd(), configFileName);
  
  // Fallback to default name if custom name doesn't exist
  const defaultConfigPath = join(process.cwd(), '.postgresql-mcp.json');
  
  let fileConfig: Partial<PostgresConfig> = {};
  
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
      console.error('Loaded config from .postgresql-mcp.json (fallback)');
    } catch (error) {
      console.error('Error reading config file .postgresql-mcp.json:', error);
    }
  } else {
    console.error(`No config file found. Checked: ${configFileName}, .postgresql-mcp.json`);
  }

  // Build configuration with precedence
  const config: PostgresConfig = {
    host: fileConfig.host || process.env.PGHOST || 'localhost',
    port: fileConfig.port || parseInt(process.env.PGPORT || '5432'),
    database: fileConfig.database || process.env.PGDATABASE || 'postgres',
    user: fileConfig.user || process.env.PGUSER || 'postgres',
    password: fileConfig.password || process.env.PGPASSWORD || '',
    ssl: fileConfig.ssl !== undefined ? fileConfig.ssl : process.env.PGSSLMODE === 'require',
    connectionTimeoutMillis: fileConfig.connectionTimeoutMillis || 30000,
    query_timeout: fileConfig.query_timeout || 30000,
    statement_timeout: fileConfig.statement_timeout || 30000,
    idle_in_transaction_session_timeout: fileConfig.idle_in_transaction_session_timeout || 60000,
    max: fileConfig.max || 10
  };

  // Handle SSL configuration from environment
  if (process.env.PGSSLMODE && !fileConfig.ssl) {
    if (process.env.PGSSLMODE === 'disable') {
      config.ssl = false;
    } else if (process.env.PGSSLMODE === 'require') {
      config.ssl = true;
    }
  }

  // Validate required fields
  if (!config.host || !config.database || !config.user) {
    throw new Error('Missing required PostgreSQL configuration. Please provide host, database, and user.');
  }

  return config;
}