# Configuring MinIO with S3 MCP Server for Local Development

## Summary

A comprehensive guide on setting up MinIO as a local S3-compatible object storage system and configuring it with the S3 MCP server for AI-assisted development using Claude Code, enabling seamless local testing and development of S3-based applications.

## The Challenge

When developing applications that use Amazon S3 for object storage, testing against the actual AWS S3 service can be:
- **Costly**: Every operation incurs charges
- **Slow**: Network latency affects development speed
- **Risky**: Accidental operations on production data
- **Complex**: Requires AWS credentials and proper IAM configuration

MinIO provides a perfect solution as a locally-hosted, S3-compatible object storage server that mimics the S3 API, allowing you to develop and test S3 operations locally before deploying to production.

## What is MinIO?

MinIO is a high-performance, S3-compatible object storage system that can run on your local machine, in containers, or on bare metal servers. It provides:
- Full S3 API compatibility
- Web-based console for management
- Multi-tenant support
- Erasure coding and bitrot protection
- Docker and Kubernetes native

## Setting Up MinIO

### Option 1: Docker Installation (Recommended)

```bash
# Create a directory for MinIO data
mkdir -p ~/minio/data

# Run MinIO using Docker
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -v ~/minio/data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

### Option 2: Binary Installation

```bash
# Download MinIO binary (macOS example)
brew install minio/stable/minio

# Or download directly
wget https://dl.min.io/server/minio/release/darwin-amd64/minio
chmod +x minio

# Start MinIO server
MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin123 \
./minio server ~/minio/data --console-address ":9001"
```

### Option 3: Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  minio:
    image: quay.io/minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio_data:
```

Run with: `docker-compose up -d`

## Accessing MinIO

Once running, MinIO provides two interfaces:
- **API Endpoint**: http://localhost:9000 (S3-compatible API)
- **Web Console**: http://localhost:9001 (Management UI)

Log into the web console using the root credentials you configured.

## Creating Buckets and Access Keys

### Using the Web Console

1. Navigate to http://localhost:9001
2. Login with your root credentials
3. Go to "Buckets" → "Create Bucket"
4. Create a bucket named `my-app-bucket`
5. Go to "Access Keys" → "Create Access Key"
6. Save the generated Access Key and Secret Key

### Using MinIO Client (mc)

```bash
# Install MinIO Client
brew install minio/stable/mc

# Configure mc with your MinIO instance
mc alias set local http://localhost:9000 minioadmin minioadmin123

# Create a bucket
mc mb local/my-app-bucket

# List buckets
mc ls local
```

## Configuring S3 MCP Server for MinIO

### Installation

First, ensure you have the S3 MCP server installed:

```bash
# Clone the repository
git clone https://github.com/modelcontextprotocol/servers.git
cd servers/src/s3

# Install dependencies
npm install

# Build the server
npm run build
```

### Configuration in Claude Desktop

Add the S3 MCP server to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "s3-minio": {
      "command": "/path/to/s3-mcp-server/dist/index.js",
      "args": [],
      "env": {
        "AWS_ENDPOINT_URL": "http://localhost:9000",
        "AWS_ACCESS_KEY_ID": "your-access-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret-key",
        "AWS_REGION": "us-east-1",
        "AWS_FORCE_PATH_STYLE": "true"
      }
    }
  }
}
```

**Important Configuration Notes:**
- `AWS_ENDPOINT_URL`: Points to your local MinIO instance
- `AWS_FORCE_PATH_STYLE`: Must be `true` for MinIO compatibility
- `AWS_REGION`: Can be any valid region (MinIO ignores this but it's required)

### Alternative: Project-Specific Configuration

Create a `.s3-mcp.json` file in your project directory:

```json
{
  "endpoint": "http://localhost:9000",
  "accessKeyId": "your-access-key",
  "secretAccessKey": "your-secret-key",
  "region": "us-east-1",
  "forcePathStyle": true
}
```

## Using S3 MCP with MinIO in Claude Code

Once configured, you can use Claude Code to interact with your MinIO instance:

### Basic Operations

```
"List all buckets in my MinIO instance"
"Create a new bucket called 'test-bucket'"
"Upload this file to the 'my-app-bucket' bucket"
"List all objects in the 'my-app-bucket' bucket"
"Download 'config.json' from the 'my-app-bucket' bucket"
```

### Advanced Operations

```
"Generate a presigned URL for 'document.pdf' in 'my-app-bucket' that expires in 1 hour"
"Set up lifecycle rules to delete objects older than 30 days in 'temp-bucket'"
"Enable versioning on the 'important-data' bucket"
"Copy all objects from 'source-bucket' to 'backup-bucket'"
```

## Development Workflow

### 1. Local Development Setup

```bash
# Start MinIO
docker-compose up -d

# Create development buckets
mc mb local/dev-uploads
mc mb local/dev-processed
mc mb local/dev-archives

# Set bucket policies if needed
mc anonymous set download local/dev-uploads
```

### 2. Application Configuration

Configure your application to use MinIO in development:

```javascript
// config/development.js
module.exports = {
  s3: {
    endpoint: 'http://localhost:9000',
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  }
};

// config/production.js
module.exports = {
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  }
};
```

### 3. Testing with Claude Code

Use Claude Code to test S3 operations before implementing them:

```
"Using s3-minio, create a function that uploads images with automatic thumbnail generation"
"Help me implement multipart upload for large files using the MinIO instance"
"Create a batch processing script that moves processed files between buckets"
```

## Advanced MinIO Features

### Multi-Tenant Setup

Configure multiple MinIO instances for different environments:

```json
{
  "mcpServers": {
    "s3-minio-dev": {
      "command": "/path/to/s3-mcp-server/dist/index.js",
      "env": {
        "AWS_ENDPOINT_URL": "http://localhost:9000",
        "AWS_ACCESS_KEY_ID": "dev-access-key",
        "AWS_SECRET_ACCESS_KEY": "dev-secret-key"
      }
    },
    "s3-minio-staging": {
      "command": "/path/to/s3-mcp-server/dist/index.js",
      "env": {
        "AWS_ENDPOINT_URL": "http://localhost:9002",
        "AWS_ACCESS_KEY_ID": "staging-access-key",
        "AWS_SECRET_ACCESS_KEY": "staging-secret-key"
      }
    }
  }
}
```

### Distributed MinIO

For testing distributed storage scenarios:

```bash
# Start a 4-node MinIO cluster
docker-compose -f docker-compose-distributed.yml up -d
```

### MinIO with TLS

For testing secure connections:

```bash
# Generate self-signed certificates
mkdir -p ~/.minio/certs
openssl req -new -x509 -days 365 -nodes \
  -keyout ~/.minio/certs/private.key \
  -out ~/.minio/certs/public.crt

# Start MinIO with TLS
docker run -d \
  --name minio-tls \
  -p 9000:9000 \
  -p 9001:9001 \
  -v ~/minio/data:/data \
  -v ~/.minio/certs:/root/.minio/certs \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  quay.io/minio/minio server /data --console-address ":9001"
```

Update MCP configuration for TLS:

```json
{
  "AWS_ENDPOINT_URL": "https://localhost:9000",
  "NODE_TLS_REJECT_UNAUTHORIZED": "0"  // Only for self-signed certs
}
```

## Best Practices

1. **Separate Environments**: Use different MinIO instances or buckets for dev/test/staging
2. **Access Control**: Create specific access keys with limited permissions for applications
3. **Backup Strategy**: Regularly backup MinIO data directories
4. **Monitoring**: Use MinIO's Prometheus metrics for monitoring
5. **Version Control**: Don't commit MinIO credentials to repositories

## Common Issues and Solutions

### Connection Refused

```bash
# Check if MinIO is running
docker ps | grep minio

# Check MinIO logs
docker logs minio

# Verify port availability
lsof -i :9000
```

### Signature Mismatch Errors

Ensure `AWS_FORCE_PATH_STYLE` is set to `true` in your configuration.

### CORS Issues

Configure CORS in MinIO for browser-based uploads:

```bash
# Create cors.json
cat > cors.json <<EOF
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"]
  }]
}
EOF

# Apply CORS configuration
mc cors set cors.json local/my-app-bucket
```

### Performance Tuning

For better performance with large files:

```bash
# Increase MinIO's memory limit
docker run -d \
  --name minio \
  -m 4g \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -v ~/minio/data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

## Migration to Production S3

When ready to deploy to AWS S3:

1. **Update Configuration**: Change endpoint from MinIO to S3
2. **Test Credentials**: Verify AWS credentials work
3. **Data Migration**: Use `mc mirror` to sync data if needed
4. **Update Policies**: Ensure S3 bucket policies match MinIO setup

```bash
# Sync MinIO bucket to S3
mc alias set s3 https://s3.amazonaws.com AWS_ACCESS_KEY AWS_SECRET_KEY
mc mirror local/my-app-bucket s3/prod-app-bucket
```

## Conclusion

MinIO provides an excellent local development environment for S3-based applications. Combined with the S3 MCP server and Claude Code, you can:

- Develop and test S3 operations without cloud costs
- Iterate quickly with local storage
- Test advanced S3 features like versioning and lifecycle policies
- Ensure your application works correctly before deploying to production

This setup creates a powerful development workflow where AI assistance through Claude Code can help you implement complex S3 operations while testing against a local, S3-compatible storage system.

## Action Items

- [ ] Install MinIO using your preferred method
- [ ] Create access keys for development use
- [ ] Configure S3 MCP server to connect to MinIO
- [ ] Test basic S3 operations through Claude Code
- [ ] Set up project-specific MinIO configurations
- [ ] Document MinIO access credentials securely
- [ ] Create backup strategy for MinIO data

## References

- [MinIO Documentation](https://docs.min.io)
- [MinIO Client (mc) Guide](https://docs.min.io/docs/minio-client-complete-guide.html)
- [S3 MCP Server Repository](https://github.com/modelcontextprotocol/servers/tree/main/src/s3)
- [AWS S3 API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)

Last Updated On: 2025-06-05