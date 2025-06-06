# S3 MCP Server Tools Reference

This document provides detailed information about all available tools in the S3 MCP Server.

## Table of Contents

- [Bucket Operations](#bucket-operations)
- [Object Operations](#object-operations)
- [Storage Information](#storage-information)

## Bucket Operations

### list_buckets
List all buckets in the S3 account.

**Parameters:**
- None

**Returns:**
- Array of buckets with name and creation date
- Total count of buckets

**Example:**
```json
{
  "tool": "list_buckets",
  "arguments": {}
}
```

### make_bucket
Create a new bucket.

**Parameters:**
- `bucket` (string, required): Bucket name
- `region` (string, optional): Region for the bucket (default: us-east-1)

**Returns:**
- Success message with bucket name and region

**Example:**
```json
{
  "tool": "make_bucket",
  "arguments": {
    "bucket": "my-new-bucket",
    "region": "us-west-2"
  }
}
```

### remove_bucket
Remove an empty bucket.

**Parameters:**
- `bucket` (string, required): Bucket name

**Returns:**
- Success message

**Note:** The bucket must be empty before it can be removed.

**Example:**
```json
{
  "tool": "remove_bucket",
  "arguments": {
    "bucket": "my-old-bucket"
  }
}
```

### bucket_exists
Check if a bucket exists.

**Parameters:**
- `bucket` (string, required): Bucket name

**Returns:**
- Boolean indicating whether the bucket exists

**Example:**
```json
{
  "tool": "bucket_exists",
  "arguments": {
    "bucket": "my-bucket"
  }
}
```

### get_bucket_policy
Get the access policy for a bucket.

**Parameters:**
- `bucket` (string, required): Bucket name

**Returns:**
- Bucket policy as JSON string or message if no policy is set

**Example:**
```json
{
  "tool": "get_bucket_policy",
  "arguments": {
    "bucket": "my-bucket"
  }
}
```

### set_bucket_policy
Set or remove the access policy for a bucket.

**Parameters:**
- `bucket` (string, required): Bucket name
- `policy` (string, optional): Policy JSON or predefined policy (READ_ONLY, WRITE_ONLY, READ_WRITE). If not provided, removes the policy.

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "set_bucket_policy",
  "arguments": {
    "bucket": "my-bucket",
    "policy": "READ_ONLY"
  }
}
```

### get_bucket_notification
Get bucket notification configuration.

**Parameters:**
- `bucket` (string, required): Bucket name

**Returns:**
- Notification configuration as JSON

**Example:**
```json
{
  "tool": "get_bucket_notification",
  "arguments": {
    "bucket": "my-bucket"
  }
}
```

### get_bucket_versioning
Get bucket versioning configuration.

**Parameters:**
- `bucket` (string, required): Bucket name

**Returns:**
- Versioning configuration as JSON

**Example:**
```json
{
  "tool": "get_bucket_versioning",
  "arguments": {
    "bucket": "my-bucket"
  }
}
```

## Object Operations

### list_objects
List objects in a bucket with optional filtering.

**Parameters:**
- `bucket` (string, required): Bucket name
- `prefix` (string, optional): Filter objects by prefix
- `recursive` (boolean, optional): List recursively (default: false)
- `maxKeys` (number, optional): Maximum number of objects to return

**Returns:**
- Array of objects with name, size, lastModified, and etag
- Count of returned objects
- Truncated flag if maxKeys was reached

**Example:**
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

### get_object
Download an object's content.

**Parameters:**
- `bucket` (string, required): Bucket name
- `object` (string, required): Object key/path

**Returns:**
- Object content (text for text files, base64 for binary)

**Example:**
```json
{
  "tool": "get_object",
  "arguments": {
    "bucket": "my-bucket",
    "object": "documents/report.txt"
  }
}
```

### put_object
Upload an object to a bucket.

**Parameters:**
- `bucket` (string, required): Bucket name
- `object` (string, required): Object key/path
- `content` (string, required): Object content (text or base64 for binary)
- `contentType` (string, optional): MIME type (default: application/octet-stream)
- `metadata` (object, optional): Key-value pairs for object metadata

**Returns:**
- Success message with ETag

**Example:**
```json
{
  "tool": "put_object",
  "arguments": {
    "bucket": "my-bucket",
    "object": "documents/new-report.txt",
    "content": "This is the report content",
    "contentType": "text/plain",
    "metadata": {
      "author": "John Doe",
      "department": "Sales"
    }
  }
}
```

### copy_object
Copy an object from one location to another.

**Parameters:**
- `sourceBucket` (string, required): Source bucket name
- `sourceObject` (string, required): Source object key
- `destBucket` (string, required): Destination bucket name
- `destObject` (string, required): Destination object key

**Returns:**
- Success message with ETag

**Example:**
```json
{
  "tool": "copy_object",
  "arguments": {
    "sourceBucket": "source-bucket",
    "sourceObject": "original/file.pdf",
    "destBucket": "backup-bucket",
    "destObject": "backup/file.pdf"
  }
}
```

### remove_object
Delete a single object.

**Parameters:**
- `bucket` (string, required): Bucket name
- `object` (string, required): Object key/path

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "remove_object",
  "arguments": {
    "bucket": "my-bucket",
    "object": "documents/old-report.txt"
  }
}
```

### remove_objects
Delete multiple objects at once.

**Parameters:**
- `bucket` (string, required): Bucket name
- `objects` (array of strings, required): Array of object keys to delete

**Returns:**
- Success message with count of deleted objects
- Error details if some deletions failed

**Example:**
```json
{
  "tool": "remove_objects",
  "arguments": {
    "bucket": "my-bucket",
    "objects": [
      "temp/file1.txt",
      "temp/file2.txt",
      "temp/file3.txt"
    ]
  }
}
```

### stat_object
Get metadata for an object without downloading its content.

**Parameters:**
- `bucket` (string, required): Bucket name
- `object` (string, required): Object key/path

**Returns:**
- Object size, ETag, last modified date, and metadata

**Example:**
```json
{
  "tool": "stat_object",
  "arguments": {
    "bucket": "my-bucket",
    "object": "documents/report.pdf"
  }
}
```

### presigned_get_object
Generate a presigned URL for downloading an object.

**Parameters:**
- `bucket` (string, required): Bucket name
- `object` (string, required): Object key/path
- `expiry` (number, optional): URL expiry in seconds (default: 604800 = 7 days)

**Returns:**
- Presigned URL for downloading

**Example:**
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

### presigned_put_object
Generate a presigned URL for uploading an object.

**Parameters:**
- `bucket` (string, required): Bucket name
- `object` (string, required): Object key/path
- `expiry` (number, optional): URL expiry in seconds (default: 604800 = 7 days)

**Returns:**
- Presigned URL for uploading

**Example:**
```json
{
  "tool": "presigned_put_object",
  "arguments": {
    "bucket": "my-bucket",
    "object": "uploads/new-file.pdf",
    "expiry": 3600
  }
}
```

### get_object_tags
Get tags associated with an object.

**Parameters:**
- `bucket` (string, required): Bucket name
- `object` (string, required): Object key/path

**Returns:**
- Object tags as key-value pairs

**Example:**
```json
{
  "tool": "get_object_tags",
  "arguments": {
    "bucket": "my-bucket",
    "object": "documents/report.pdf"
  }
}
```

### set_object_tags
Set tags for an object.

**Parameters:**
- `bucket` (string, required): Bucket name
- `object` (string, required): Object key/path
- `tags` (object, required): Key-value pairs for tags

**Returns:**
- Success message

**Example:**
```json
{
  "tool": "set_object_tags",
  "arguments": {
    "bucket": "my-bucket",
    "object": "documents/report.pdf",
    "tags": {
      "department": "finance",
      "year": "2024",
      "confidential": "yes"
    }
  }
}
```

## Storage Information

### bucket_usage
Calculate storage usage statistics for a bucket.

**Parameters:**
- `bucket` (string, required): Bucket name

**Returns:**
- Total object count
- Total size in bytes
- Human-readable total size

**Example:**
```json
{
  "tool": "bucket_usage",
  "arguments": {
    "bucket": "my-bucket"
  }
}
```

## Best Practices

### Object Naming
- Use forward slashes (/) to create virtual directories
- Avoid special characters that might cause issues
- Use consistent naming conventions

### Performance
- Use `prefix` parameter to filter large object lists
- Set appropriate `maxKeys` to limit response size
- Use presigned URLs for direct uploads/downloads

### Security
- Always use HTTPS in production
- Implement proper bucket policies
- Use IAM roles when possible
- Rotate access keys regularly

### Error Handling
All tools include comprehensive error handling:
- Invalid bucket/object names
- Permission errors
- Network issues
- Not found errors

## Content Handling

### Text Content
Text files are returned as-is and can be uploaded directly:
```json
{
  "content": "This is plain text content"
}
```

### Binary Content
Binary files should be base64 encoded:
```json
{
  "content": "SGVsbG8gV29ybGQh..."
}
```

The server automatically detects whether content is base64 encoded.

Last Updated On: 2025-06-05