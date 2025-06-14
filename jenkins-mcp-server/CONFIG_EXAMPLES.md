# Jenkins MCP Server - Configuration Examples

This document provides configuration examples for various Jenkins setups and use cases.

**Last Updated On:** June 14, 2025

## Configuration Overview

The Jenkins MCP server supports **instance-specific configuration** using the `MCP_SERVER_NAME` environment variable. This allows you to manage multiple Jenkins instances with different configurations.

**Configuration File Resolution:**
1. **Instance-specific**: `.{MCP_SERVER_NAME}.json` (e.g., `.prod-jenkins.json`)
2. **Default fallback**: `.jenkins-mcp.json`
3. **Environment variables**: Always available as fallback

**Benefits of Instance-Specific Configs:**
- **Multiple Jenkins instances** (development, staging, production)
- **Different credentials** per environment
- **Environment isolation** and security
- **Claude Code compatibility** for CLI usage

## Basic Configuration

### Local Jenkins Instance

**Default config** (`.jenkins-mcp.json`):
```json
{
  "url": "http://localhost:8080",
  "username": "admin",
  "password": "admin123"
}
```

**Instance-specific config** (`.dev-jenkins.json`):
```json
{
  "url": "http://localhost:8080",
  "username": "dev-user",
  "apiToken": "dev-api-token-here",
  "timeout": 15000
}
```

### Production Configuration with All Features

`.jenkins-mcp.json`:
```json
{
  "url": "https://jenkins.company.com",
  "username": "service-account",
  "apiToken": "11b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "timeout": 30000,
  "verifySsl": true,
  "maxRetries": 3
}
```

Environment variables:
```bash
# Debugging
export JENKINS_DEBUG="false"
export JENKINS_LOG_LEVEL="INFO"

# Rate limiting
export JENKINS_MAX_REQUESTS_PER_MINUTE="60"
export JENKINS_MAX_CONCURRENT_REQUESTS="5"
export JENKINS_BURST_SIZE="10"

# Sampling
export JENKINS_SAMPLE_BUILD_LOGS="0.5"
export JENKINS_SAMPLE_ARTIFACTS="0.3"
export JENKINS_SAMPLE_SYSTEM_INFO="0.1"
```

### Jenkins with API Token (Recommended)

`.jenkins-mcp.json`:
```json
{
  "url": "https://jenkins.company.com",
  "username": "john.doe",
  "apiToken": "11b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "timeout": 30000,
  "verifySsl": true
}
```

## Environment Variable Configuration

### Basic Setup

```bash
export JENKINS_URL="https://jenkins.company.com"
export JENKINS_USERNAME="john.doe"
export JENKINS_API_TOKEN="11b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### Complete Environment Configuration

```bash
# Connection settings
export JENKINS_URL="https://jenkins.company.com"
export JENKINS_USERNAME="john.doe"
export JENKINS_API_TOKEN="11b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# Optional settings
export JENKINS_TIMEOUT="60000"          # 60 seconds
export JENKINS_VERIFY_SSL="true"        # SSL verification
export JENKINS_MAX_RETRIES="5"          # Retry failed requests
export JENKINS_PROJECT_ROOT="/workspace" # Working directory
```

## Claude Desktop Configuration

### Basic Setup

```json
{
  "mcpServers": {
    "jenkins": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/jenkins-mcp-server/dist/mcp-server.js"],
      "env": {
        "JENKINS_URL": "https://jenkins.company.com",
        "JENKINS_USERNAME": "your-username",
        "JENKINS_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Multiple Jenkins Instances

```json
{
  "mcpServers": {
    "jenkins-prod": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/jenkins-mcp-server/dist/mcp-server.js"],
      "env": {
        "JENKINS_URL": "https://jenkins-prod.company.com",
        "JENKINS_USERNAME": "prod-user",
        "JENKINS_API_TOKEN": "prod-token"
      }
    },
    "jenkins-dev": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/jenkins-mcp-server/dist/mcp-server.js"],
      "env": {
        "JENKINS_URL": "https://jenkins-dev.company.com",
        "JENKINS_USERNAME": "dev-user",
        "JENKINS_API_TOKEN": "dev-token"
      }
    }
  }
}
```

## Advanced Configurations

### Jenkins Behind Proxy

`.jenkins-mcp.json`:
```json
{
  "url": "https://jenkins.internal.company.com",
  "username": "service-account",
  "apiToken": "token-here",
  "timeout": 45000,
  "verifySsl": false,
  "maxRetries": 5
}
```

### Jenkins with Custom Certificate

`.jenkins-mcp.json`:
```json
{
  "url": "https://jenkins.secure.company.com",
  "username": "secure-user",
  "apiToken": "secure-token",
  "verifySsl": true,
  "timeout": 30000
}
```

Note: For custom certificates, ensure they're properly installed in your system's certificate store.

### High-Performance Configuration

`.jenkins-mcp.json`:
```json
{
  "url": "https://jenkins.company.com",
  "username": "perf-user",
  "apiToken": "perf-token",
  "timeout": 120000,
  "maxRetries": 10,
  "verifySsl": true
}
```

## Security Best Practices

### Using Environment Variables for Secrets

Never store credentials in config files. Use environment variables:

`.jenkins-mcp.json`:
```json
{
  "url": "https://jenkins.company.com",
  "timeout": 30000,
  "verifySsl": true
}
```

Then set credentials via environment:
```bash
export JENKINS_USERNAME="your-username"
export JENKINS_API_TOKEN="your-secure-token"
```

### Read-Only Access Configuration

For safety, use a Jenkins user with limited permissions:

```json
{
  "url": "https://jenkins.company.com",
  "username": "readonly-bot",
  "apiToken": "readonly-token",
  "timeout": 30000
}
```

## Troubleshooting Configurations

### Debug Configuration

Enable verbose logging by setting environment variables:

```bash
export JENKINS_URL="https://jenkins.company.com"
export JENKINS_USERNAME="debug-user"
export JENKINS_API_TOKEN="debug-token"
export NODE_ENV="development"
export DEBUG="*"
```

### Testing Connection

Minimal configuration to test connectivity:

```json
{
  "url": "https://jenkins.company.com"
}
```

Then test with:
```
Use the test_connection tool to verify connectivity
```

## Pipeline Job Examples

### Simple Pipeline Configuration

When creating pipeline jobs, here's a basic template:

```groovy
pipeline {
    agent any
    
    parameters {
        string(name: 'VERSION', defaultValue: '1.0.0', description: 'Version to build')
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'], description: 'Target environment')
    }
    
    stages {
        stage('Build') {
            steps {
                echo "Building version ${params.VERSION}"
                sh 'make build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'make test'
            }
        }
        
        stage('Deploy') {
            when {
                expression { params.ENVIRONMENT == 'prod' }
            }
            steps {
                sh "make deploy ENV=${params.ENVIRONMENT}"
            }
        }
    }
    
    post {
        success {
            echo 'Build successful!'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
```

### Parameterized Build Example

Triggering a build with parameters:

```json
{
  "jobName": "multi-env-deploy",
  "parameters": {
    "BRANCH": "release/2.0",
    "ENVIRONMENT": "staging",
    "RUN_TESTS": true,
    "NOTIFICATION_EMAIL": "team@company.com"
  }
}
```

## Common Use Cases

### CI/CD Pipeline Management

Configuration for a typical CI/CD setup:

```json
{
  "url": "https://ci.company.com",
  "username": "ci-bot",
  "apiToken": "ci-bot-token",
  "timeout": 60000,
  "maxRetries": 5
}
```

### Multi-Branch Pipeline Support

For working with multi-branch pipelines:

```json
{
  "url": "https://jenkins.company.com",
  "username": "pipeline-manager",
  "apiToken": "pipeline-token",
  "projectRoot": "/workspace/pipelines"
}
```

### Monitoring and Alerting

Configuration for monitoring Jenkins:

```json
{
  "url": "https://jenkins.company.com",
  "username": "monitor-bot",
  "apiToken": "monitor-token",
  "timeout": 15000,
  "maxRetries": 3
}
```

## Migration Guide

### From Password to API Token

1. Generate API token in Jenkins:
   - Go to User → Configure → API Token
   - Click "Add new Token"
   - Copy the generated token

2. Update configuration:

Before:
```json
{
  "url": "https://jenkins.company.com",
  "username": "user",
  "password": "password123"
}
```

After:
```json
{
  "url": "https://jenkins.company.com",
  "username": "user",
  "apiToken": "11b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

### From HTTP to HTTPS

When migrating to HTTPS:

```json
{
  "url": "https://jenkins.company.com",
  "username": "user",
  "apiToken": "token",
  "verifySsl": true
}
```

If using self-signed certificates:
```json
{
  "url": "https://jenkins.company.com",
  "username": "user",
  "apiToken": "token",
  "verifySsl": false
}
```