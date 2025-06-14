# Ceph MCP Server Tools Reference

This document provides detailed information about all tools available in the Ceph MCP Server.

## Cluster Operations

### get_cluster_status
Get the overall status of the Ceph cluster.

**Parameters:** None

**Returns:** Cluster status including health, monitors, OSDs, pools, and PGs.

**Example:**
```json
{
  "fsid": "a7f3e7d6-4bdc-11ee-961d-c7b262605968",
  "health": "HEALTH_OK",
  "monmap": {
    "epoch": 3,
    "num_mons": 3
  },
  "osdmap": {
    "epoch": 42,
    "num_osds": 12,
    "num_up_osds": 12,
    "num_in_osds": 12
  }
}
```

### get_cluster_health
Get the health status of the Ceph cluster.

**Parameters:** None

**Returns:** Health status with any warnings or errors.

### get_config
Get cluster configuration values.

**Parameters:**
- `section` (optional): Configuration section
- `name` (optional): Configuration parameter name

**Returns:** Configuration values.

### set_config
Set cluster configuration values.

**Parameters:**
- `section`: Configuration section (e.g., "mon", "osd", "mds")
- `name`: Configuration parameter name
- `value`: Configuration value

**Returns:** Confirmation of configuration change.

## Pool Operations

### list_pools
List all pools in the cluster.

**Parameters:** None

**Returns:** Array of pools with details like ID, name, size, and usage.

### create_pool
Create a new pool.

**Parameters:**
- `name`: Name of the new pool
- `pg_num`: Number of placement groups (default: 128)

**Returns:** Confirmation of pool creation.

### delete_pool
Delete a pool (use with caution - this is destructive).

**Parameters:**
- `pool_name`: Name of the pool to delete

**Returns:** Confirmation of pool deletion.

**Note:** Requires confirmation flags and appropriate permissions.

### get_pool_stats
Get statistics for pools.

**Parameters:**
- `pool_name` (optional): Specific pool name, or all pools if not specified

**Returns:** Pool statistics including usage, objects, and throughput.

## Object Operations

### list_objects
List objects in a pool.

**Parameters:**
- `pool_name`: Name of the pool

**Returns:** Array of object names in the pool.

### delete_object
Delete an object from a pool.

**Parameters:**
- `pool`: Pool name
- `object_name`: Object name

**Returns:** Confirmation of object deletion.

## OSD Operations

### list_osds
List all OSDs in the cluster.

**Parameters:** None

**Returns:** Array of OSD IDs.

### get_osd_tree
Get the OSD tree showing the cluster topology.

**Parameters:** None

**Returns:** Hierarchical tree showing hosts, racks, and OSDs.

### get_osd_stats
Get OSD usage statistics.

**Parameters:** None

**Returns:** Statistics for each OSD including usage, weight, and variance.

## Monitor Operations

### get_monitor_status
Get monitor status.

**Parameters:** None

**Returns:** Current monitor quorum and status.

### list_monitors
List all monitors in the cluster.

**Parameters:** None

**Returns:** Detailed monitor information including addresses and ranks.

## Placement Group Operations

### get_pg_stats
Get placement group statistics.

**Parameters:** None

**Returns:** PG state summary and statistics.

### list_pgs
List placement groups.

**Parameters:** None

**Returns:** Array of PGs with their states and mappings.

## MDS/CephFS Operations

### get_mds_status
Get metadata server status.

**Parameters:** None

**Returns:** MDS map and active MDS daemons.

### list_filesystems
List CephFS filesystems.

**Parameters:** None

**Returns:** Array of filesystems with their metadata and data pools.

## RBD (Block Device) Operations

### list_rbd_images
List RBD (RADOS Block Device) images.

**Parameters:**
- `pool_name` (optional): Specific pool, or default pool if not specified

**Returns:** Array of RBD image names.

### create_rbd_image
Create a new RBD image.

**Parameters:**
- `name`: Image name
- `size`: Image size (e.g., "10G", "1T")
- `pool` (optional): Pool name

**Returns:** Confirmation of image creation.

### delete_rbd_image
Delete an RBD image.

**Parameters:**
- `name`: Image name
- `pool` (optional): Pool name

**Returns:** Confirmation of image deletion.

### get_rbd_image_info
Get information about an RBD image.

**Parameters:**
- `name`: Image name
- `pool` (optional): Pool name

**Returns:** Image details including size, features, and snapshots.

## RADOS Gateway (S3) Operations

### list_rgw_users
List RADOS Gateway (S3) users.

**Parameters:** None

**Returns:** Array of user IDs.

### create_rgw_user
Create a new RADOS Gateway user.

**Parameters:**
- `uid`: User ID
- `display_name`: Display name

**Returns:** User details including access keys.

**Example Response:**
```json
{
  "user_id": "testuser",
  "display_name": "Test User",
  "keys": [{
    "access_key": "ABCDEFGHIJKLMNOP",
    "secret_key": "abcdefghijklmnopqrstuvwxyz1234567890"
  }]
}
```

### get_rgw_user_info
Get information about a RADOS Gateway user.

**Parameters:**
- `uid`: User ID

**Returns:** Complete user information including quotas and statistics.

### delete_rgw_user
Delete a RADOS Gateway user.

**Parameters:**
- `uid`: User ID

**Returns:** Confirmation of user deletion.

### list_rgw_buckets
List all RADOS Gateway buckets.

**Parameters:** None

**Returns:** Array of bucket names.

### get_rgw_bucket_stats
Get statistics for a RADOS Gateway bucket.

**Parameters:**
- `bucket`: Bucket name

**Returns:** Bucket statistics including size, object count, and owner.

## Error Handling

All tools return structured errors with:
- `error`: Error message
- `code`: Error code (e.g., "COMMAND_FAILED", "NOT_FOUND")
- `details`: Additional error context

## Usage Examples

### Monitor Cluster Health
```javascript
// Get overall health
await get_cluster_health()

// Get detailed status
await get_cluster_status()

// Check specific pool
await get_pool_stats({ pool_name: "mypool" })
```

### Manage RBD Images
```javascript
// Create a 10GB image
await create_rbd_image({ 
  name: "myimage", 
  size: "10G", 
  pool: "rbd" 
})

// List images
await list_rbd_images({ pool_name: "rbd" })

// Get image details
await get_rbd_image_info({ 
  name: "myimage", 
  pool: "rbd" 
})
```

### S3 User Management
```javascript
// Create S3 user
await create_rgw_user({
  uid: "s3user",
  display_name: "S3 Application User"
})

// List all buckets
await list_rgw_buckets()

// Get bucket statistics
await get_rgw_bucket_stats({ 
  bucket: "my-bucket" 
})
```

Last Updated On: 2025-01-06