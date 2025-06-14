import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
/**
 * Load configuration from multiple sources
 */
export function loadConfig() {
    // Load .env file if it exists
    dotenv.config();
    // Log where we're looking for config
    console.error(`Looking for Jenkins config in: ${process.cwd()}`);
    // Check for local config file
    const configPath = join(process.cwd(), '.jenkins-mcp.json');
    let fileConfig = {};
    console.error(`Checking for config file at: ${configPath}`);
    if (existsSync(configPath)) {
        try {
            const configContent = readFileSync(configPath, 'utf-8');
            fileConfig = JSON.parse(configContent);
            console.error(`Successfully loaded configuration from: ${configPath}`);
        }
        catch (error) {
            console.error('Error reading config file:', error);
        }
    }
    else {
        console.error(`No config file found at: ${configPath}`);
        console.error('Will use environment variables or defaults');
    }
    // Build configuration with precedence: file > env > defaults
    const config = {
        url: fileConfig.url || process.env.JENKINS_URL || 'http://localhost:8080',
        username: fileConfig.username || process.env.JENKINS_USERNAME,
        password: fileConfig.password || process.env.JENKINS_PASSWORD,
        apiToken: fileConfig.apiToken || process.env.JENKINS_API_TOKEN,
        timeout: fileConfig.timeout || parseInt(process.env.JENKINS_TIMEOUT || '30000'),
        verifySsl: fileConfig.verifySsl !== undefined ?
            fileConfig.verifySsl :
            process.env.JENKINS_VERIFY_SSL !== 'false',
        projectRoot: fileConfig.projectRoot || process.env.JENKINS_PROJECT_ROOT || process.cwd(),
        maxRetries: fileConfig.maxRetries || parseInt(process.env.JENKINS_MAX_RETRIES || '3')
    };
    // Validate configuration
    if (!config.url) {
        throw new Error('Jenkins URL is required');
    }
    // Ensure URL doesn't end with slash
    config.url = config.url.replace(/\/$/, '');
    // Validate authentication
    if (!config.apiToken && (!config.username || !config.password)) {
        console.error('Warning: No authentication configured. Some operations may fail.');
    }
    // Log connection details (mask sensitive info)
    console.error('Jenkins MCP Server Configuration:');
    console.error(`  URL: ${config.url}`);
    console.error(`  Username: ${config.username || 'Not configured'}`);
    console.error(`  Auth Method: ${config.apiToken ? 'API Token' : config.password ? 'Password' : 'None'}`);
    console.error(`  Timeout: ${config.timeout}ms`);
    console.error(`  SSL Verification: ${config.verifySsl ? 'Enabled' : 'Disabled'}`);
    console.error(`  Max Retries: ${config.maxRetries}`);
    return config;
}
//# sourceMappingURL=config-loader.js.map