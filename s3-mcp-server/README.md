# S3 MCP Server

A Model Context Protocol (MCP) server that provides tools for managing S3-compatible object storage. This server enables LLMs to interact with AWS S3, MinIO, DigitalOcean Spaces, Backblaze B2, and other S3-compatible storage services through a standardized protocol.

## Overview

This MCP server exposes S3 functionality as tools that can be used by any MCP-compatible client (like Claude Desktop, Cursor, or other LLM applications). It provides comprehensive access to S3 features including bucket management, object operations, and storage administration across multiple S3-compatible providers.

## Features

### Bucket Operations
- List all buckets with creation dates
- Create new buckets with region specification
- Remove empty buckets
- Check bucket existence
- Get/Set bucket policies
- Get bucket notification configuration
- Get bucket versioning status

### Object Operations
- List objects with filtering and pagination
- Upload objects (text or binary)
- Download object content
- Copy objects between buckets
- Delete single or multiple objects
- Get object metadata and statistics
- Generate presigned URLs for upload/download
- Manage object tags

### Storage Management
- Calculate bucket storage usage
- Support for large file uploads
- Metadata management
- Content type handling

## Installation

```bash
npm install
npm run build
```

## Configuration

The S3 MCP server can be configured in three ways (in order of precedence):

1. **Local configuration file** (`.s3-mcp.json`)
2. **Environment variables**
3. **Default values**

### Configuration File (.s3-mcp.json)

Create a `.s3-mcp.json` file in your project directory:

**For MinIO:**
```json
{
  "endPoint": "localhost",
  "port": 9000,
  "useSSL": false,
  "accessKey": "minioadmin",
  "secretKey": "minioadmin",
  "region": "us-east-1",
  "pathStyle": true
}
```

**For AWS S3:**
```json
{
  "endPoint": "s3.amazonaws.com",
  "port": 443,
  "useSSL": true,
  "accessKey": "your-access-key-id",
  "secretKey": "your-secret-access-key",
  "region": "us-east-1",
  "pathStyle": false
}
```

### Environment Variables

```bash
# MinIO specific
export MINIO_ENDPOINT=localhost
export MINIO_PORT=9000
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin
export MINIO_USE_SSL=false
export MINIO_REGION=us-east-1

# Or AWS S3 compatible
export S3_ENDPOINT_URL=http://localhost:9000
export AWS_ACCESS_KEY_ID=minioadmin
export AWS_SECRET_ACCESS_KEY=minioadmin
export AWS_REGION=us-east-1
```

See [CONFIG_EXAMPLES.md](./CONFIG_EXAMPLES.md) for more configuration examples.

For a detailed guide on using MinIO with this server, see our [MinIO Configuration Guide](./MINIO_GUIDE.md).

## Usage with Claude Desktop

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "s3": {
      "command": "/path/to/s3-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MINIO_ENDPOINT": "localhost",
        "MINIO_PORT": "9000",
        "MINIO_ACCESS_KEY": "your-access-key",
        "MINIO_SECRET_KEY": "your-secret-key"
      }
    }
  }
}
```

## Available Tools

### Bucket Management
- `list_buckets` - List all buckets
- `make_bucket` - Create a new bucket
- `remove_bucket` - Remove an empty bucket
- `bucket_exists` - Check if a bucket exists
- `get_bucket_policy` - Get bucket access policy
- `set_bucket_policy` - Set bucket access policy
- `get_bucket_notification` - Get notification configuration
- `get_bucket_versioning` - Get versioning configuration

### Object Operations
- `list_objects` - List objects with optional filtering
- `get_object` - Download object content
- `put_object` - Upload an object
- `copy_object` - Copy object between buckets
- `remove_object` - Delete a single object
- `remove_objects` - Delete multiple objects
- `stat_object` - Get object metadata
- `presigned_get_object` - Generate download URL
- `presigned_put_object` - Generate upload URL
- `get_object_tags` - Get object tags
- `set_object_tags` - Set object tags

### Storage Information
- `bucket_usage` - Get storage statistics for a bucket

## Tool Examples

### Create a Bucket
```json
{
  "tool": "make_bucket",
  "arguments": {
    "bucket": "my-bucket",
    "region": "us-west-2"
  }
}
```

### Upload an Object
```json
{
  "tool": "put_object",
  "arguments": {
    "bucket": "my-bucket",
    "object": "documents/report.txt",
    "content": "This is my report content",
    "contentType": "text/plain",
    "metadata": {
      "author": "John Doe",
      "version": "1.0"
    }
  }
}
```

### List Objects
```json
{
  "tool": "list_objects",
  "arguments": {
    "bucket": "my-bucket",
    "prefix": "documents/",
    "recursive": true,
    "maxKeys": 100
  }
}
```

### Generate Presigned URL
```json
{
  "tool": "presigned_get_object",
  "arguments": {
    "bucket": "my-bucket",
    "object": "documents/report.pdf",
    "expiry": 3600
  }
}
```

### Copy Object
```json
{
  "tool": "copy_object",
  "arguments": {
    "sourceBucket": "source-bucket",
    "sourceObject": "original.jpg",
    "destBucket": "dest-bucket",
    "destObject": "backup/copy.jpg"
  }
}
```

## Binary Content Handling

The server handles both text and binary content:
- Text content is passed as-is in the `content` field
- Binary content should be base64 encoded
- The server auto-detects the content encoding
- Retrieved binary content is returned as base64

## Security Best Practices

1. **Access Keys**: Use dedicated service accounts with minimal required permissions
2. **SSL/TLS**: Enable SSL for production environments
3. **Bucket Policies**: Implement proper bucket policies for access control
4. **Network Security**: Use VPC endpoints or private networks when possible
5. **Credential Management**: Store credentials in secure vaults, not in code

## Development

### Running in Development
```bash
npm run dev
```

### Building
```bash
npm run build
```

## Troubleshooting

### Connection Issues
- Verify MinIO is running and accessible
- Check endpoint URL and port
- Ensure access keys are correct
- Check network connectivity

### Permission Errors
- Verify the access key has required permissions
- Check bucket policies
- Ensure IAM policies allow the operations

### SSL/TLS Issues
- Set `useSSL` correctly based on your MinIO setup
- For self-signed certificates, additional configuration may be needed

## License

ISC

Last Updated On: 2025-06-05