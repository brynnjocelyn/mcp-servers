#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { loadConfig } from './config-loader.js';
import { JenkinsClient } from './jenkins-client.js';
import { Logger } from './logging.js';
import { samplers } from './rate-limiter.js';
import { 
  validateJobName, 
  validatePipelineScript, 
  validateXmlConfig, 
  validateBuildParameters,
  validateFolderPath 
} from './validation.js';

// Tool parameter schemas
const TestConnectionSchema = z.object({});

const GetSystemInfoSchema = z.object({});

const ListJobsSchema = z.object({
  folderPath: z.string().optional().describe('Path to folder (for nested jobs)'),
});

const GetJobSchema = z.object({
  jobName: z.string().describe('Name of the job'),
});

const GetJobConfigSchema = z.object({
  jobName: z.string().describe('Name of the job'),
});

const CreateUpdateJobSchema = z.object({
  jobName: z.string().describe('Name of the job'),
  configXml: z.string().describe('Job configuration in XML format'),
});

const DeleteJobSchema = z.object({
  jobName: z.string().describe('Name of the job to delete'),
});

const BuildJobSchema = z.object({
  jobName: z.string().describe('Name of the job to build'),
  parameters: z.record(z.any()).optional().describe('Build parameters'),
});

const GetBuildSchema = z.object({
  jobName: z.string().describe('Name of the job'),
  buildNumber: z.number().describe('Build number'),
});

const GetBuildLogSchema = z.object({
  jobName: z.string().describe('Name of the job'),
  buildNumber: z.number().describe('Build number'),
  start: z.number().optional().default(0).describe('Starting position in log'),
});

const StopBuildSchema = z.object({
  jobName: z.string().describe('Name of the job'),
  buildNumber: z.number().describe('Build number to stop'),
});

const GetQueueSchema = z.object({});

const CancelQueueItemSchema = z.object({
  itemId: z.number().describe('Queue item ID to cancel'),
});

const ListArtifactsSchema = z.object({
  jobName: z.string().describe('Name of the job'),
  buildNumber: z.number().describe('Build number'),
});

const DownloadArtifactSchema = z.object({
  jobName: z.string().describe('Name of the job'),
  buildNumber: z.number().describe('Build number'),
  artifactPath: z.string().describe('Relative path to artifact'),
});

const ListNodesSchema = z.object({});

const GetNodeSchema = z.object({
  nodeName: z.string().describe('Name of the node/agent'),
});

const SetNodeOfflineSchema = z.object({
  nodeName: z.string().describe('Name of the node/agent'),
  message: z.string().optional().default('').describe('Offline message'),
});

const ListPluginsSchema = z.object({});

const RestartSchema = z.object({
  safe: z.boolean().optional().default(true).describe('Perform safe restart'),
});

const CreateViewSchema = z.object({
  viewName: z.string().describe('Name of the view'),
  viewType: z.string().optional().default('ListView').describe('Type of view (ListView, MyView, etc.)'),
});

const SetJobEnabledSchema = z.object({
  jobName: z.string().describe('Name of the job'),
  enabled: z.boolean().describe('Enable or disable the job'),
});

const CreatePipelineJobSchema = z.object({
  jobName: z.string().describe('Name of the pipeline job'),
  pipelineScript: z.string().describe('Pipeline script (Groovy)'),
  description: z.string().optional().describe('Job description'),
});

const CopyJobSchema = z.object({
  sourceJobName: z.string().describe('Name of job to copy from'),
  targetJobName: z.string().describe('Name of new job'),
});

/**
 * Create an MCP server for Jenkins operations
 */
const server = new Server(
  {
    name: 'jenkins-mcp-server',
    version: '1.2.1',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Load configuration and create Jenkins client
const config = loadConfig();
const jenkinsClient = new JenkinsClient(config);

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Connection & System Tools
      {
        name: 'test_connection',
        description: 'Test connection to Jenkins server',
        inputSchema: zodToJsonSchema(TestConnectionSchema),
      },
      {
        name: 'get_system_info',
        description: 'Get Jenkins version and system information',
        inputSchema: zodToJsonSchema(GetSystemInfoSchema),
      },
      
      // Job Management Tools
      {
        name: 'list_jobs',
        description: 'List all jobs in Jenkins or in a specific folder',
        inputSchema: zodToJsonSchema(ListJobsSchema),
      },
      {
        name: 'get_job',
        description: 'Get detailed information about a specific job',
        inputSchema: zodToJsonSchema(GetJobSchema),
      },
      {
        name: 'get_job_config',
        description: 'Get job configuration in XML format',
        inputSchema: zodToJsonSchema(GetJobConfigSchema),
      },
      {
        name: 'create_update_job',
        description: 'Create a new job or update existing job configuration',
        inputSchema: zodToJsonSchema(CreateUpdateJobSchema),
      },
      {
        name: 'delete_job',
        description: 'Delete a job from Jenkins',
        inputSchema: zodToJsonSchema(DeleteJobSchema),
      },
      {
        name: 'copy_job',
        description: 'Copy an existing job to create a new one',
        inputSchema: zodToJsonSchema(CopyJobSchema),
      },
      {
        name: 'set_job_enabled',
        description: 'Enable or disable a job',
        inputSchema: zodToJsonSchema(SetJobEnabledSchema),
      },
      
      // Build Management Tools
      {
        name: 'build_job',
        description: 'Trigger a job build with optional parameters',
        inputSchema: zodToJsonSchema(BuildJobSchema),
      },
      {
        name: 'get_build',
        description: 'Get information about a specific build',
        inputSchema: zodToJsonSchema(GetBuildSchema),
      },
      {
        name: 'get_build_log',
        description: 'Get console output log from a build',
        inputSchema: zodToJsonSchema(GetBuildLogSchema),
      },
      {
        name: 'stop_build',
        description: 'Stop/abort a running build',
        inputSchema: zodToJsonSchema(StopBuildSchema),
      },
      {
        name: 'list_artifacts',
        description: 'List artifacts from a build',
        inputSchema: zodToJsonSchema(ListArtifactsSchema),
      },
      {
        name: 'download_artifact',
        description: 'Download a specific artifact from a build',
        inputSchema: zodToJsonSchema(DownloadArtifactSchema),
      },
      
      // Queue Management Tools
      {
        name: 'get_queue',
        description: 'Get list of queued builds',
        inputSchema: zodToJsonSchema(GetQueueSchema),
      },
      {
        name: 'cancel_queue_item',
        description: 'Cancel a queued build',
        inputSchema: zodToJsonSchema(CancelQueueItemSchema),
      },
      
      // Node Management Tools
      {
        name: 'list_nodes',
        description: 'List all nodes/agents in Jenkins',
        inputSchema: zodToJsonSchema(ListNodesSchema),
      },
      {
        name: 'get_node',
        description: 'Get information about a specific node',
        inputSchema: zodToJsonSchema(GetNodeSchema),
      },
      {
        name: 'set_node_offline',
        description: 'Take a node offline or bring it online',
        inputSchema: zodToJsonSchema(SetNodeOfflineSchema),
      },
      
      // System Administration Tools
      {
        name: 'list_plugins',
        description: 'List installed Jenkins plugins',
        inputSchema: zodToJsonSchema(ListPluginsSchema),
      },
      {
        name: 'restart_jenkins',
        description: 'Restart Jenkins (safe restart by default)',
        inputSchema: zodToJsonSchema(RestartSchema),
      },
      
      // View Management Tools
      {
        name: 'create_view',
        description: 'Create a new view in Jenkins',
        inputSchema: zodToJsonSchema(CreateViewSchema),
      },
      
      // Pipeline Tools
      {
        name: 'create_pipeline_job',
        description: 'Create a new pipeline job with Groovy script',
        inputSchema: zodToJsonSchema(CreatePipelineJobSchema),
      },
    ],
  };
});

/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();
  
  Logger.info(`Executing tool: ${name}`, args);

  try {
    let result;
    switch (name) {
      // Connection & System Tools
      case 'test_connection': {
        const isConnected = await jenkinsClient.testConnection();
        return {
          content: [{
            type: 'text',
            text: isConnected ? 
              'Successfully connected to Jenkins server' : 
              'Failed to connect to Jenkins server'
          }]
        };
      }

      case 'get_system_info': {
        const info = await jenkinsClient.getSystemInfo();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(info, null, 2)
          }]
        };
      }

      // Job Management Tools
      case 'list_jobs': {
        const params = ListJobsSchema.parse(args);
        const result = await jenkinsClient.listJobs(params.folderPath);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      case 'get_job': {
        const params = GetJobSchema.parse(args);
        const job = await jenkinsClient.getJob(params.jobName);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(job, null, 2)
          }]
        };
      }

      case 'get_job_config': {
        const params = GetJobConfigSchema.parse(args);
        const config = await jenkinsClient.getJobConfig(params.jobName);
        return {
          content: [{
            type: 'text',
            text: config
          }]
        };
      }

      case 'create_update_job': {
        const params = CreateUpdateJobSchema.parse(args);
        const validatedName = validateJobName(params.jobName);
        const validatedXml = validateXmlConfig(params.configXml);
        await jenkinsClient.createOrUpdateJob(validatedName, validatedXml);
        return {
          content: [{
            type: 'text',
            text: `Job '${validatedName}' created/updated successfully`
          }]
        };
      }

      case 'delete_job': {
        const params = DeleteJobSchema.parse(args);
        await jenkinsClient.deleteJob(params.jobName);
        return {
          content: [{
            type: 'text',
            text: `Job '${params.jobName}' deleted successfully`
          }]
        };
      }

      case 'copy_job': {
        const params = CopyJobSchema.parse(args);
        const sourceConfig = await jenkinsClient.getJobConfig(params.sourceJobName);
        await jenkinsClient.createOrUpdateJob(params.targetJobName, sourceConfig);
        return {
          content: [{
            type: 'text',
            text: `Job '${params.sourceJobName}' copied to '${params.targetJobName}' successfully`
          }]
        };
      }

      case 'set_job_enabled': {
        const params = SetJobEnabledSchema.parse(args);
        await jenkinsClient.setJobEnabled(params.jobName, params.enabled);
        return {
          content: [{
            type: 'text',
            text: `Job '${params.jobName}' ${params.enabled ? 'enabled' : 'disabled'} successfully`
          }]
        };
      }

      // Build Management Tools
      case 'build_job': {
        const params = BuildJobSchema.parse(args);
        const validatedName = validateJobName(params.jobName);
        const validatedParams = params.parameters ? 
          validateBuildParameters(params.parameters) : undefined;
        const queueId = await jenkinsClient.buildJob(validatedName, validatedParams);
        return {
          content: [{
            type: 'text',
            text: `Build triggered successfully. Queue ID: ${queueId}`
          }]
        };
      }

      case 'get_build': {
        const params = GetBuildSchema.parse(args);
        const build = await jenkinsClient.getBuild(params.jobName, params.buildNumber);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(build, null, 2)
          }]
        };
      }

      case 'get_build_log': {
        const params = GetBuildLogSchema.parse(args);
        const log = await jenkinsClient.getBuildLog(
          params.jobName, 
          params.buildNumber, 
          params.start
        );
        return {
          content: [{
            type: 'text',
            text: log
          }]
        };
      }

      case 'stop_build': {
        const params = StopBuildSchema.parse(args);
        await jenkinsClient.stopBuild(params.jobName, params.buildNumber);
        return {
          content: [{
            type: 'text',
            text: `Build #${params.buildNumber} of job '${params.jobName}' stopped successfully`
          }]
        };
      }

      case 'list_artifacts': {
        const params = ListArtifactsSchema.parse(args);
        const artifacts = await jenkinsClient.listArtifacts(params.jobName, params.buildNumber);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(artifacts, null, 2)
          }]
        };
      }

      case 'download_artifact': {
        const params = DownloadArtifactSchema.parse(args);
        const data = await jenkinsClient.downloadArtifact(
          params.jobName,
          params.buildNumber,
          params.artifactPath
        );
        return {
          content: [{
            type: 'text',
            text: `Artifact downloaded successfully. Size: ${data.length} bytes`
          }]
        };
      }

      // Queue Management Tools
      case 'get_queue': {
        const queue = await jenkinsClient.getQueue();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(queue, null, 2)
          }]
        };
      }

      case 'cancel_queue_item': {
        const params = CancelQueueItemSchema.parse(args);
        await jenkinsClient.cancelQueueItem(params.itemId);
        return {
          content: [{
            type: 'text',
            text: `Queue item ${params.itemId} cancelled successfully`
          }]
        };
      }

      // Node Management Tools
      case 'list_nodes': {
        const nodes = await jenkinsClient.listNodes();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(nodes, null, 2)
          }]
        };
      }

      case 'get_node': {
        const params = GetNodeSchema.parse(args);
        const node = await jenkinsClient.getNode(params.nodeName);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(node, null, 2)
          }]
        };
      }

      case 'set_node_offline': {
        const params = SetNodeOfflineSchema.parse(args);
        await jenkinsClient.setNodeOffline(params.nodeName, params.message);
        return {
          content: [{
            type: 'text',
            text: `Node '${params.nodeName}' offline status toggled successfully`
          }]
        };
      }

      // System Administration Tools
      case 'list_plugins': {
        const plugins = await jenkinsClient.listPlugins();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(plugins, null, 2)
          }]
        };
      }

      case 'restart_jenkins': {
        const params = RestartSchema.parse(args);
        await jenkinsClient.restart(params.safe);
        return {
          content: [{
            type: 'text',
            text: `Jenkins ${params.safe ? 'safe ' : ''}restart initiated`
          }]
        };
      }

      // View Management Tools
      case 'create_view': {
        const params = CreateViewSchema.parse(args);
        await jenkinsClient.createView(params.viewName, params.viewType);
        return {
          content: [{
            type: 'text',
            text: `View '${params.viewName}' created successfully`
          }]
        };
      }

      // Pipeline Tools
      case 'create_pipeline_job': {
        const params = CreatePipelineJobSchema.parse(args);
        const pipelineXml = `<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>${params.description || ''}</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition">
    <script>${params.pipelineScript}</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>`;
        
        await jenkinsClient.createOrUpdateJob(params.jobName, pipelineXml);
        return {
          content: [{
            type: 'text',
            text: `Pipeline job '${params.jobName}' created successfully`
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    // Log successful tool execution
    const duration = Date.now() - startTime;
    Logger.logTool(name, args, duration);
    
    // Return the result (already returned in each case)
  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.error(`Tool execution failed: ${name}`, error);
    Logger.logTool(name, args, duration);
    
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
});

/**
 * Handler for listing available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  Logger.info('Listing available resources');
  
  try {
    const jobsResult = await jenkinsClient.listJobs();
    const resources = [];

    // Add job configuration resources
    for (const job of jobsResult.jobs) {
      resources.push({
        uri: `jenkins://job/${encodeURIComponent(job.name)}/config`,
        name: `${job.name} Configuration`,
        description: `Job configuration XML for ${job.name}`,
        mimeType: 'application/xml'
      });

      // Add latest build log resource if job has builds
      if (job.lastBuild) {
        resources.push({
          uri: `jenkins://job/${encodeURIComponent(job.name)}/lastBuild/log`,
          name: `${job.name} Latest Build Log`,
          description: `Console output from the latest build of ${job.name}`,
          mimeType: 'text/plain'
        });
      }
    }

    // Add system resources
    resources.push({
      uri: 'jenkins://system/info',
      name: 'Jenkins System Information',
      description: 'Jenkins version and system configuration',
      mimeType: 'application/json'
    });

    resources.push({
      uri: 'jenkins://queue/status',
      name: 'Build Queue Status',
      description: 'Current build queue information',
      mimeType: 'application/json'
    });

    Logger.info(`Listed ${resources.length} resources`);
    return { resources };
  } catch (error) {
    Logger.error('Failed to list resources', error);
    return { resources: [] };
  }
});

/**
 * Handler for reading a specific resource
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const startTime = Date.now();
  const { uri } = request.params;
  Logger.logResource(uri, 'read');

  try {
    // Parse the URI
    const url = new URL(uri);
    if (url.protocol !== 'jenkins:') {
      throw new Error('Invalid resource URI protocol');
    }

    const pathParts = url.pathname.split('/').filter(p => p);
    
    // Handle different resource types
    if (pathParts[0] === 'job' && pathParts.length >= 3) {
      const jobName = decodeURIComponent(pathParts[1]);
      const resourceType = pathParts[2];

      if (resourceType === 'config') {
        // Get job configuration
        const config = await jenkinsClient.getJobConfig(jobName);
        const duration = Date.now() - startTime;
        Logger.logResource(uri, 'read', duration);
        
        return {
          contents: [{
            uri,
            mimeType: 'application/xml',
            text: config
          }]
        };
      } else if (resourceType === 'lastBuild' && pathParts[3] === 'log') {
        // Check if we should sample this request
        if (!samplers.buildLogs.shouldSample()) {
          Logger.info('Build log request sampled out', { uri });
          return {
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: '[Sampled out - too many build log requests]'
            }]
          };
        }

        // Get latest build log
        const job = await jenkinsClient.getJob(jobName);
        if (!job.lastBuild) {
          throw new Error('No builds found for this job');
        }
        
        const log = await jenkinsClient.getBuildLog(jobName, job.lastBuild.number);
        const duration = Date.now() - startTime;
        Logger.logResource(uri, 'read', duration);
        
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: log
          }]
        };
      }
    } else if (pathParts[0] === 'system' && pathParts[1] === 'info') {
      // Check if we should sample this request
      if (!samplers.systemInfo.shouldSample()) {
        Logger.info('System info request sampled out');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ sampled: true, message: 'Request sampled out' })
          }]
        };
      }

      // Get system info
      const info = await jenkinsClient.getSystemInfo();
      const duration = Date.now() - startTime;
      Logger.logResource(uri, 'read', duration);
      
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(info, null, 2)
        }]
      };
    } else if (pathParts[0] === 'queue' && pathParts[1] === 'status') {
      // Get queue status
      const queue = await jenkinsClient.getQueue();
      const duration = Date.now() - startTime;
      Logger.logResource(uri, 'read', duration);
      
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(queue, null, 2)
        }]
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  } catch (error) {
    Logger.error(`Failed to read resource: ${uri}`, error);
    return {
      contents: [{
        uri,
        mimeType: 'text/plain',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
});

/**
 * Handler for listing available prompts
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'deploy-pipeline',
        description: 'Create a deployment pipeline for a microservice',
        arguments: [
          {
            name: 'service_name',
            description: 'Name of the microservice',
            required: true
          },
          {
            name: 'environments',
            description: 'Comma-separated list of environments (e.g., dev,staging,prod)',
            required: true
          },
          {
            name: 'repo_url',
            description: 'Git repository URL',
            required: true
          },
          {
            name: 'branch',
            description: 'Git branch to deploy from',
            required: false
          }
        ]
      },
      {
        name: 'troubleshoot-build',
        description: 'Analyze and troubleshoot a failed build',
        arguments: [
          {
            name: 'job_name',
            description: 'Name of the job with failing builds',
            required: true
          },
          {
            name: 'build_number',
            description: 'Specific build number to analyze (optional, defaults to last failed)',
            required: false
          }
        ]
      },
      {
        name: 'setup-monitoring',
        description: 'Set up monitoring and notifications for a job',
        arguments: [
          {
            name: 'job_name',
            description: 'Name of the job to monitor',
            required: true
          },
          {
            name: 'email',
            description: 'Email address for notifications',
            required: true
          },
          {
            name: 'slack_webhook',
            description: 'Slack webhook URL (optional)',
            required: false
          }
        ]
      },
      {
        name: 'backup-jobs',
        description: 'Create a backup of job configurations',
        arguments: [
          {
            name: 'job_pattern',
            description: 'Pattern to match job names (e.g., "frontend-*")',
            required: false
          },
          {
            name: 'output_format',
            description: 'Output format: xml or json',
            required: false
          }
        ]
      }
    ]
  };
});

/**
 * Handler for getting a specific prompt
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'deploy-pipeline':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I need to create a deployment pipeline for a microservice with these details:
- Service Name: ${args?.service_name || '[SERVICE_NAME]'}
- Environments: ${args?.environments || 'dev,staging,prod'}
- Repository: ${args?.repo_url || '[REPO_URL]'}
- Branch: ${args?.branch || 'main'}

Please create a Jenkins pipeline that:
1. Checks out code from the repository
2. Runs tests
3. Builds a Docker image
4. Deploys to each environment with manual approval for production
5. Includes proper error handling and notifications`
            }
          }
        ]
      };

    case 'troubleshoot-build':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please help me troubleshoot the failing Jenkins job: ${args?.job_name || '[JOB_NAME]'}
${args?.build_number ? `Build number: ${args.build_number}` : 'Analyze the last failed build'}

Please:
1. Check the build log for errors
2. Identify the root cause of the failure
3. Suggest fixes for common issues
4. Recommend preventive measures`
            }
          }
        ]
      };

    case 'setup-monitoring':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Set up monitoring for Jenkins job: ${args?.job_name || '[JOB_NAME]'}
Notification email: ${args?.email || '[EMAIL]'}
${args?.slack_webhook ? `Slack webhook: ${args.slack_webhook}` : ''}

Please configure:
1. Email notifications for build failures
2. Success notifications after failed builds
3. Build duration alerts if builds take too long
4. ${args?.slack_webhook ? 'Slack integration for team notifications' : 'Suggest Slack integration setup'}
5. Build health metrics and trends`
            }
          }
        ]
      };

    case 'backup-jobs':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a backup of Jenkins job configurations.
${args?.job_pattern ? `Job pattern: ${args.job_pattern}` : 'Backup all jobs'}
${args?.output_format ? `Format: ${args.output_format}` : 'Format: XML'}

Please:
1. List all jobs matching the pattern
2. Export their configurations
3. Create a structured backup with timestamps
4. Suggest a restoration procedure
5. Recommend backup automation strategies`
            }
          }
        ]
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

/**
 * Start the server
 */
async function main() {
  Logger.info('Starting Jenkins MCP server', { version: '1.2.1' });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Jenkins MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});