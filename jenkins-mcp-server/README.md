# Jenkins MCP Server

A Model Context Protocol (MCP) server that provides comprehensive tools and resources for managing Jenkins CI/CD operations. This server enables AI assistants to interact with Jenkins instances for build automation, pipeline management, job configuration, and system administration.

**Last Updated On:** December 13, 2024

## Overview

The Jenkins MCP server exposes Jenkins functionality through a standardized interface, allowing LLMs to:
- Manage jobs and pipelines through tools
- Access job configurations and build logs as resources
- Trigger and monitor builds with rate limiting
- Handle build artifacts with sampling
- Manage nodes and plugins
- Perform system administration tasks
- Debug operations with comprehensive logging

## Features

### Job Management
- List all jobs with details (status, description, buildable state)
- Create and update job configurations
- Delete jobs
- Copy existing jobs
- Enable/disable jobs
- Get job configuration (XML)

### Build Operations
- Trigger builds with parameters
- Get build information and status
- Retrieve console logs
- Stop/abort running builds
- List and download build artifacts

### Pipeline Support
- Create pipeline jobs with Groovy scripts
- Update pipeline definitions
- Full support for Jenkins Pipeline as Code

### Queue Management
- View queued builds
- Cancel queued items
- Monitor queue status

### Node/Agent Management
- List all nodes/agents
- Get node information
- Take nodes offline/online
- Monitor node status

### System Administration
- Get Jenkins version and system info
- List installed plugins
- Restart Jenkins (safe/immediate)
- Create views

### Resources (New in v1.1.0)
- Job configuration XML files
- Latest build logs
- System information
- Queue status
- Automatic sampling for resource-intensive operations

### Performance & Reliability
- Rate limiting to prevent overwhelming Jenkins
- Request sampling for expensive operations
- Comprehensive error handling
- Debug logging with environment controls

## Installation

```bash
npm install
npm run build
```

## Configuration

The Jenkins MCP server can be configured through multiple sources (in order of precedence):

### 1. Configuration File (.jenkins-mcp.json)

Create a `.jenkins-mcp.json` file in your project directory:

```json
{
  "url": "https://jenkins.example.com",
  "username": "your-username",
  "apiToken": "your-api-token",
  "timeout": 30000,
  "verifySsl": true,
  "maxRetries": 3
}
```

### 2. Environment Variables

```bash
export JENKINS_URL="https://jenkins.example.com"
export JENKINS_USERNAME="your-username"
export JENKINS_API_TOKEN="your-api-token"
export JENKINS_PASSWORD="your-password"  # If not using API token
export JENKINS_TIMEOUT="30000"
export JENKINS_VERIFY_SSL="true"
export JENKINS_MAX_RETRIES="3"

# Debugging and Logging
export JENKINS_LOG_LEVEL="INFO"  # ERROR, WARN, INFO, DEBUG
export JENKINS_DEBUG="true"      # Enable debug logging

# Rate Limiting
export JENKINS_MAX_REQUESTS_PER_MINUTE="60"
export JENKINS_MAX_CONCURRENT_REQUESTS="5"
export JENKINS_BURST_SIZE="10"

# Sampling (0.0 to 1.0)
export JENKINS_SAMPLE_BUILD_LOGS="0.5"    # Sample 50% of build log requests
export JENKINS_SAMPLE_ARTIFACTS="0.3"     # Sample 30% of artifact requests
export JENKINS_SAMPLE_SYSTEM_INFO="0.1"   # Sample 10% of system info requests
```

### 3. Authentication Methods

The server supports two authentication methods:

#### API Token (Recommended)
1. Log into Jenkins
2. Go to User → Configure → API Token
3. Generate a new token
4. Use with username in configuration

#### Basic Authentication
- Use username and password
- Less secure than API tokens
- May not work if SSO is enabled

## Usage with Claude Desktop

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "jenkins": {
      "command": "/path/to/jenkins-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "JENKINS_URL": "https://jenkins.example.com",
        "JENKINS_USERNAME": "your-username",
        "JENKINS_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Available Tools

### Connection & System Tools

#### test_connection
Test connection to Jenkins server
```typescript
// No parameters required
```

#### get_system_info
Get Jenkins version and system information
```typescript
// No parameters required
```

### Job Management Tools

#### list_jobs
List all jobs in Jenkins or in a specific folder
```typescript
{
  folderPath?: string  // Optional path for nested jobs
}
```

#### get_job
Get detailed information about a specific job
```typescript
{
  jobName: string  // Name of the job
}
```

#### get_job_config
Get job configuration in XML format
```typescript
{
  jobName: string  // Name of the job
}
```

#### create_update_job
Create a new job or update existing job configuration
```typescript
{
  jobName: string,    // Name of the job
  configXml: string   // Job configuration in XML format
}
```

#### delete_job
Delete a job from Jenkins
```typescript
{
  jobName: string  // Name of the job to delete
}
```

#### copy_job
Copy an existing job to create a new one
```typescript
{
  sourceJobName: string,  // Name of job to copy from
  targetJobName: string   // Name of new job
}
```

#### set_job_enabled
Enable or disable a job
```typescript
{
  jobName: string,  // Name of the job
  enabled: boolean  // Enable or disable
}
```

### Build Management Tools

#### build_job
Trigger a job build with optional parameters
```typescript
{
  jobName: string,               // Name of the job
  parameters?: Record<string, any>  // Optional build parameters
}
```

#### get_build
Get information about a specific build
```typescript
{
  jobName: string,     // Name of the job
  buildNumber: number  // Build number
}
```

#### get_build_log
Get console output log from a build
```typescript
{
  jobName: string,     // Name of the job
  buildNumber: number, // Build number
  start?: number       // Starting position (default: 0)
}
```

#### stop_build
Stop/abort a running build
```typescript
{
  jobName: string,     // Name of the job
  buildNumber: number  // Build number to stop
}
```

#### list_artifacts
List artifacts from a build
```typescript
{
  jobName: string,     // Name of the job
  buildNumber: number  // Build number
}
```

#### download_artifact
Download a specific artifact from a build
```typescript
{
  jobName: string,     // Name of the job
  buildNumber: number, // Build number
  artifactPath: string // Relative path to artifact
}
```

### Queue Management Tools

#### get_queue
Get list of queued builds
```typescript
// No parameters required
```

#### cancel_queue_item
Cancel a queued build
```typescript
{
  itemId: number  // Queue item ID to cancel
}
```

### Node Management Tools

#### list_nodes
List all nodes/agents in Jenkins
```typescript
// No parameters required
```

#### get_node
Get information about a specific node
```typescript
{
  nodeName: string  // Name of the node/agent
}
```

#### set_node_offline
Take a node offline or bring it online
```typescript
{
  nodeName: string,  // Name of the node/agent
  message?: string   // Optional offline message
}
```

### System Administration Tools

#### list_plugins
List installed Jenkins plugins
```typescript
// No parameters required
```

#### restart_jenkins
Restart Jenkins (safe restart by default)
```typescript
{
  safe?: boolean  // Perform safe restart (default: true)
}
```

### View Management Tools

#### create_view
Create a new view in Jenkins
```typescript
{
  viewName: string,   // Name of the view
  viewType?: string   // Type of view (default: 'ListView')
}
```

### Pipeline Tools

#### create_pipeline_job
Create a new pipeline job with Groovy script
```typescript
{
  jobName: string,         // Name of the pipeline job
  pipelineScript: string,  // Pipeline script (Groovy)
  description?: string     // Optional job description
}
```

## Available Resources

The Jenkins MCP server exposes various Jenkins data as resources that can be accessed by MCP clients:

### Job Resources
- **Job Configuration**: `jenkins://job/{jobName}/config`
  - Returns the job's XML configuration
  - Useful for backup, analysis, or replication

- **Latest Build Log**: `jenkins://job/{jobName}/lastBuild/log`
  - Returns console output from the most recent build
  - Automatically sampled to prevent overwhelming the server

### System Resources
- **System Information**: `jenkins://system/info`
  - Jenkins version, plugins, and configuration
  - Sampled to reduce load on Jenkins

- **Queue Status**: `jenkins://queue/status`
  - Current build queue information
  - Shows pending builds and wait reasons

### Resource Sampling

To prevent overwhelming Jenkins with resource requests, the server implements sampling:
- Build logs: 50% sampling rate by default
- System info: 10% sampling rate by default
- Configure via environment variables

## Example Usage

### Creating a Simple Pipeline Job

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building...'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying...'
            }
        }
    }
}
```

### Triggering a Parameterized Build

```json
{
  "jobName": "my-parameterized-job",
  "parameters": {
    "BRANCH": "main",
    "ENVIRONMENT": "staging",
    "RUN_TESTS": true
  }
}
```

## Error Handling

The server includes comprehensive error handling:
- Network timeouts and retries
- Authentication failures
- Invalid job names or build numbers
- Permission errors
- Jenkins availability issues

## Security Considerations

1. **API Tokens**: Always use API tokens instead of passwords when possible
2. **HTTPS**: Use HTTPS connections to Jenkins
3. **Permissions**: Ensure the Jenkins user has appropriate permissions
4. **SSL Verification**: Keep SSL verification enabled in production
5. **Credentials**: Store credentials securely, never in source code

## Troubleshooting

### Connection Issues
- Verify Jenkins URL is correct
- Check firewall and network settings
- Ensure Jenkins is accessible from your machine

### Authentication Failures
- Verify username and API token/password
- Check if user has required permissions
- Ensure CSRF protection is properly handled

### Job Operations
- Verify job names are correct (case-sensitive)
- Check folder paths for nested jobs
- Ensure user has job configuration permissions

### Debugging

Enable debug logging to troubleshoot issues:

```bash
export JENKINS_DEBUG="true"
export JENKINS_LOG_LEVEL="DEBUG"
```

Check logs for:
- API request/response details
- Rate limiting information
- Sampling statistics
- Error stack traces

### Performance Issues

If experiencing slow responses:
- Adjust rate limiting settings
- Increase sampling rates for less critical operations
- Check Jenkins server load
- Monitor concurrent request limits

## License

ISC