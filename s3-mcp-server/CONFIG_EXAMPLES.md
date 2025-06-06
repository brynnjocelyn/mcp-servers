# S3 MCP Server Configuration Examples

This document provides configuration examples for the S3 MCP Server.

## Configuration Methods

The S3 MCP Server can be configured in three ways (in order of precedence):

1. **Local configuration file** (`.s3-mcp.json`)
2. **Environment variables**
3. **Default values**

## Configuration File Examples

### MinIO Configurations

#### Basic Local MinIO (.s3-mcp.json)

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

#### MinIO with Custom Credentials

```json
{
  "endPoint": "localhost",
  "port": 9000,
  "useSSL": false,
  "accessKey": "your-custom-access-key",
  "secretKey": "your-custom-secret-key",
  "region": "us-east-1",
  "pathStyle": true
}
```

#### MinIO Running in Docker

```json
{
  "endPoint": "host.docker.internal",
  "port": 9000,
  "useSSL": false,
  "accessKey": "minioadmin",
  "secretKey": "minioadmin",
  "pathStyle": true
}
```

#### Production MinIO with SSL

```json
{
  "endPoint": "minio.example.com",
  "port": 443,
  "useSSL": true,
  "accessKey": "your-access-key",
  "secretKey": "your-secret-key",
  "region": "us-east-1",
  "pathStyle": true
}
```

#### MinIO on Custom Port

```json
{
  "endPoint": "192.168.1.100",
  "port": 9005,
  "useSSL": false,
  "accessKey": "minioadmin",
  "secretKey": "minioadmin",
  "pathStyle": true
}
```

### AWS S3 Configuration

```json
{
  "endPoint": "s3.amazonaws.com",
  "port": 443,
  "useSSL": true,
  "accessKey": "AKIAIOSFODNN7EXAMPLE",
  "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-west-2",
  "pathStyle": false
}
```

### DigitalOcean Spaces Configuration

```json
{
  "endPoint": "nyc3.digitaloceanspaces.com",
  "port": 443,
  "useSSL": true,
  "accessKey": "your-spaces-key",
  "secretKey": "your-spaces-secret",
  "region": "nyc3"
}
```

### Backblaze B2 Configuration

```json
{
  "endPoint": "s3.us-west-002.backblazeb2.com",
  "port": 443,
  "useSSL": true,
  "accessKey": "your-b2-key-id",
  "secretKey": "your-b2-application-key",
  "region": "us-west-002"
}
```

### Development Configuration with Custom Port

```json
{
  "endPoint": "localhost",
  "port": 9001,
  "useSSL": false,
  "accessKey": "dev-access-key",
  "secretKey": "dev-secret-key",
  "partSize": 5242880
}
```

## Environment Variables

### MinIO Specific Variables

```bash
export MINIO_ENDPOINT=localhost
export MINIO_PORT=9000
export MINIO_USE_SSL=false
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin
export MINIO_REGION=us-east-1
```

### AWS S3 Compatible Variables

```bash
export S3_ENDPOINT_URL=https://s3.amazonaws.com
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_REGION=us-west-2
export AWS_SESSION_TOKEN=optional-session-token
```

### Combined URL Format

```bash
# MinIO
export MINIO_ENDPOINT=http://localhost:9000

# S3
export S3_ENDPOINT_URL=https://s3.us-east-1.amazonaws.com
```

## Claude Desktop Configuration

### Basic MinIO Setup

```json
{
  "mcpServers": {
    "s3": {
      "command": "/path/to/s3-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MINIO_ENDPOINT": "localhost",
        "MINIO_PORT": "9000",
        "MINIO_ACCESS_KEY": "minioadmin",
        "MINIO_SECRET_KEY": "minioadmin"
      }
    }
  }
}
```

### AWS S3 Setup

```json
{
  "mcpServers": {
    "s3": {
      "command": "/path/to/s3-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "S3_ENDPOINT_URL": "https://s3.amazonaws.com",
        "AWS_ACCESS_KEY_ID": "your-access-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret-key",
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

### Multiple Storage Providers

```json
{
  "mcpServers": {
    "minio-local": {
      "command": "/path/to/s3-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MINIO_ENDPOINT": "localhost",
        "MINIO_PORT": "9000",
        "MINIO_ACCESS_KEY": "local-key",
        "MINIO_SECRET_KEY": "local-secret"
      }
    },
    "aws-s3": {
      "command": "/path/to/s3-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "S3_ENDPOINT_URL": "https://s3.amazonaws.com",
        "AWS_ACCESS_KEY_ID": "aws-key",
        "AWS_SECRET_ACCESS_KEY": "aws-secret"
      }
    },
    "digitalocean-spaces": {
      "command": "/path/to/s3-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MINIO_ENDPOINT": "nyc3.digitaloceanspaces.com",
        "MINIO_PORT": "443",
        "MINIO_USE_SSL": "true",
        "MINIO_ACCESS_KEY": "spaces-key",
        "MINIO_SECRET_KEY": "spaces-secret"
      }
    }
  }
}
```

## Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endPoint` | string | `localhost` | S3 endpoint hostname |
| `port` | number | `9000` | S3 endpoint port |
| `useSSL` | boolean | `false` | Use HTTPS connection |
| `accessKey` | string | `minioadmin` | Access key ID |
| `secretKey` | string | `minioadmin` | Secret access key |
| `region` | string | `us-east-1` | S3 region |
| `sessionToken` | string | undefined | AWS session token |
| `partSize` | number | `10485760` | Part size for multipart uploads (10MB) |
| `pathStyle` | boolean | `true` | Use path-style URLs (required for MinIO) |

## S3-Compatible Services

### AWS S3
```json
{
  "endPoint": "s3.amazonaws.com",
  "port": 443,
  "useSSL": true,
  "pathStyle": false
}
```

### Google Cloud Storage
```json
{
  "endPoint": "storage.googleapis.com",
  "port": 443,
  "useSSL": true,
  "accessKey": "GOOGTS7C7FUP3AIRVJTE2BCDKINBTES3HC2GY5CBFJLCQ",
  "secretKey": "bGoa+V7g/yqDXvKRqq+JTFn4uQZbPiQJo4pf9RzJ"
}
```

### Wasabi
```json
{
  "endPoint": "s3.wasabisys.com",
  "port": 443,
  "useSSL": true,
  "region": "us-east-1"
}
```

### Linode Object Storage
```json
{
  "endPoint": "us-east-1.linodeobjects.com",
  "port": 443,
  "useSSL": true,
  "region": "us-east-1"
}
```

## Troubleshooting

### Connection Refused
- Ensure MinIO/S3 service is running
- Check endpoint and port are correct
- Verify firewall rules allow connection
- For MinIO: default port is 9000 (API) and 9001 (Console)

### Invalid Credentials
- Double-check access key and secret key
- MinIO default credentials: `minioadmin/minioadmin`
- Ensure credentials have necessary permissions
- For AWS, check IAM policies
- For MinIO, check user policies in MinIO Console

### SSL/TLS Errors
- Set `useSSL` according to your endpoint
- For self-signed certificates, additional Node.js configuration may be needed
- Ensure port matches SSL setting (typically 443 for SSL, 80/9000 for non-SSL)

### Region Errors
- Specify the correct region for your buckets
- Some services require specific region formats
- AWS S3 requires exact region names (e.g., "us-east-1", not "US East")

### Path Style vs Virtual Host Style
- MinIO typically requires `pathStyle: true`
- AWS S3 uses `pathStyle: false` (virtual host style)
- Some S3-compatible services support both

## Performance Tuning

### Part Size
Adjust `partSize` for large file uploads:
- Default: 10MB (good for most use cases)
- Large files: 50-100MB parts
- Slow connections: 5MB parts

```json
{
  "partSize": 52428800
}
```

### Connection Pooling
The MinIO client handles connection pooling automatically, but you can influence it through:
- Using persistent connections
- Proper error handling and retry logic
- Avoiding connection leaks

Last Updated On: 2025-06-05