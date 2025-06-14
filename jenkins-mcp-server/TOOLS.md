# Jenkins MCP Server - Tools Reference

This document provides a comprehensive reference for all tools available in the Jenkins MCP Server.

**Last Updated On:** June 11, 2025

## Table of Contents

1. [Connection & System Tools](#connection--system-tools)
2. [Job Management Tools](#job-management-tools)
3. [Build Management Tools](#build-management-tools)
4. [Queue Management Tools](#queue-management-tools)
5. [Node Management Tools](#node-management-tools)
6. [System Administration Tools](#system-administration-tools)
7. [View Management Tools](#view-management-tools)
8. [Pipeline Tools](#pipeline-tools)

## Connection & System Tools

### test_connection

Tests the connection to the Jenkins server and verifies authentication.

**Parameters:** None

**Returns:**
- Success/failure message

**Example:**
```json
{
  "tool": "test_connection"
}
```

### get_system_info

Retrieves Jenkins version, system properties, and general information.

**Parameters:** None

**Returns:**
- Jenkins version
- System properties
- Node information
- Available job types

**Example:**
```json
{
  "tool": "get_system_info"
}
```

## Job Management Tools

### list_jobs

Lists all jobs in Jenkins or within a specific folder.

**Parameters:**
- `folderPath` (optional): Path to folder for nested jobs

**Returns:**
- Array of job objects with:
  - name
  - url
  - color (build status)
  - buildable
  - description

**Example:**
```json
{
  "tool": "list_jobs",
  "folderPath": "infrastructure/deployments"
}
```

### get_job

Gets detailed information about a specific job.

**Parameters:**
- `jobName`: Name of the job

**Returns:**
- Complete job details including:
  - Build history
  - Health reports
  - Properties
  - Last build info

**Example:**
```json
{
  "tool": "get_job",
  "jobName": "backend-api-build"
}
```

### get_job_config

Retrieves the job configuration in XML format.

**Parameters:**
- `jobName`: Name of the job

**Returns:**
- XML configuration string

**Example:**
```json
{
  "tool": "get_job_config",
  "jobName": "frontend-build"
}
```

### create_update_job

Creates a new job or updates an existing job's configuration.

**Parameters:**
- `jobName`: Name of the job
- `configXml`: Job configuration in XML format

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "create_update_job",
  "jobName": "new-deployment-job",
  "configXml": "<?xml version='1.1' encoding='UTF-8'?>..."
}
```

### delete_job

Deletes a job from Jenkins.

**Parameters:**
- `jobName`: Name of the job to delete

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "delete_job",
  "jobName": "deprecated-job"
}
```

### copy_job

Creates a copy of an existing job.

**Parameters:**
- `sourceJobName`: Name of job to copy from
- `targetJobName`: Name of new job

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "copy_job",
  "sourceJobName": "template-job",
  "targetJobName": "project-specific-job"
}
```

### set_job_enabled

Enables or disables a job.

**Parameters:**
- `jobName`: Name of the job
- `enabled`: Boolean to enable/disable

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "set_job_enabled",
  "jobName": "nightly-build",
  "enabled": false
}
```

## Build Management Tools

### build_job

Triggers a job build with optional parameters.

**Parameters:**
- `jobName`: Name of the job
- `parameters` (optional): Object with build parameters

**Returns:**
- Queue ID for the triggered build

**Example:**
```json
{
  "tool": "build_job",
  "jobName": "parameterized-deploy",
  "parameters": {
    "ENVIRONMENT": "staging",
    "VERSION": "1.2.3",
    "DRY_RUN": false
  }
}
```

### get_build

Gets information about a specific build.

**Parameters:**
- `jobName`: Name of the job
- `buildNumber`: Build number

**Returns:**
- Build details including:
  - Status
  - Duration
  - Timestamp
  - Changes
  - Culprits

**Example:**
```json
{
  "tool": "get_build",
  "jobName": "api-tests",
  "buildNumber": 42
}
```

### get_build_log

Retrieves console output from a build.

**Parameters:**
- `jobName`: Name of the job
- `buildNumber`: Build number
- `start` (optional): Starting position in log

**Returns:**
- Console log text

**Example:**
```json
{
  "tool": "get_build_log",
  "jobName": "integration-tests",
  "buildNumber": 100,
  "start": 0
}
```

### stop_build

Stops/aborts a running build.

**Parameters:**
- `jobName`: Name of the job
- `buildNumber`: Build number to stop

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "stop_build",
  "jobName": "long-running-job",
  "buildNumber": 55
}
```

### list_artifacts

Lists all artifacts from a build.

**Parameters:**
- `jobName`: Name of the job
- `buildNumber`: Build number

**Returns:**
- Array of artifacts with:
  - fileName
  - relativePath

**Example:**
```json
{
  "tool": "list_artifacts",
  "jobName": "release-build",
  "buildNumber": 123
}
```

### download_artifact

Downloads a specific artifact from a build.

**Parameters:**
- `jobName`: Name of the job
- `buildNumber`: Build number
- `artifactPath`: Relative path to artifact

**Returns:**
- Download confirmation with file size

**Example:**
```json
{
  "tool": "download_artifact",
  "jobName": "app-build",
  "buildNumber": 200,
  "artifactPath": "target/app-1.0.0.jar"
}
```

## Queue Management Tools

### get_queue

Gets the list of builds waiting in queue.

**Parameters:** None

**Returns:**
- Array of queue items with:
  - Task name
  - Why (reason for waiting)
  - ID
  - Timestamp

**Example:**
```json
{
  "tool": "get_queue"
}
```

### cancel_queue_item

Cancels a build waiting in the queue.

**Parameters:**
- `itemId`: Queue item ID to cancel

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "cancel_queue_item",
  "itemId": 12345
}
```

## Node Management Tools

### list_nodes

Lists all nodes/agents in Jenkins.

**Parameters:** None

**Returns:**
- Array of nodes with:
  - displayName
  - offline status
  - idle status
  - numExecutors

**Example:**
```json
{
  "tool": "list_nodes"
}
```

### get_node

Gets detailed information about a specific node.

**Parameters:**
- `nodeName`: Name of the node/agent

**Returns:**
- Complete node details including:
  - Labels
  - Architecture
  - Available disk space
  - Response time

**Example:**
```json
{
  "tool": "get_node",
  "nodeName": "linux-agent-01"
}
```

### set_node_offline

Toggles a node's offline status.

**Parameters:**
- `nodeName`: Name of the node/agent
- `message` (optional): Offline reason message

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "set_node_offline",
  "nodeName": "windows-agent-02",
  "message": "Maintenance window"
}
```

## System Administration Tools

### list_plugins

Lists all installed Jenkins plugins.

**Parameters:** None

**Returns:**
- Array of plugins with:
  - shortName
  - version
  - active status
  - enabled status

**Example:**
```json
{
  "tool": "list_plugins"
}
```

### restart_jenkins

Initiates a Jenkins restart.

**Parameters:**
- `safe` (optional): Perform safe restart (default: true)

**Returns:**
- Restart confirmation

**Example:**
```json
{
  "tool": "restart_jenkins",
  "safe": true
}
```

## View Management Tools

### create_view

Creates a new view in Jenkins.

**Parameters:**
- `viewName`: Name of the view
- `viewType` (optional): Type of view (default: 'ListView')

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "create_view",
  "viewName": "Frontend Projects",
  "viewType": "ListView"
}
```

## Pipeline Tools

### create_pipeline_job

Creates a new pipeline job with a Groovy script.

**Parameters:**
- `jobName`: Name of the pipeline job
- `pipelineScript`: Pipeline script in Groovy
- `description` (optional): Job description

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "create_pipeline_job",
  "jobName": "automated-deployment",
  "pipelineScript": "pipeline {\n    agent any\n    stages {\n        stage('Deploy') {\n            steps {\n                sh 'deploy.sh'\n            }\n        }\n    }\n}",
  "description": "Automated deployment pipeline"
}
```

## Error Codes and Troubleshooting

### Common Error Scenarios

1. **401 Unauthorized**: Check API token or credentials
2. **403 Forbidden**: User lacks required permissions
3. **404 Not Found**: Job or resource doesn't exist
4. **500 Server Error**: Jenkins internal error
5. **Timeout**: Increase timeout in configuration

### Best Practices

1. Always test connection before performing operations
2. Use API tokens instead of passwords
3. Handle queue IDs when triggering builds
4. Check job existence before operations
5. Monitor node status before assigning builds
6. Backup job configurations before major changes