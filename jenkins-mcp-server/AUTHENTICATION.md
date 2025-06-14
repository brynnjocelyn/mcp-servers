# Jenkins MCP Server - Authentication Guide

This guide covers authentication setup and best practices for the Jenkins MCP Server.

**Last Updated On:** June 11, 2025

## Overview

The Jenkins MCP Server supports multiple authentication methods to connect to your Jenkins instance:

1. **API Token Authentication** (Recommended)
2. **Basic Authentication** (Username/Password)
3. **No Authentication** (Public Jenkins)

## API Token Authentication (Recommended)

API tokens are the most secure way to authenticate with Jenkins.

### Generating an API Token

1. **Log into Jenkins** with your user account

2. **Navigate to User Configuration**:
   - Click on your username in the top-right corner
   - Select "Configure" from the dropdown

3. **Generate API Token**:
   - Scroll to the "API Token" section
   - Click "Add new Token"
   - Give it a descriptive name (e.g., "MCP Server Token")
   - Click "Generate"
   - **Copy the token immediately** - it won't be shown again!

4. **Configure MCP Server**:
   ```json
   {
     "url": "https://jenkins.example.com",
     "username": "your-username",
     "apiToken": "11alphanumeric32characterstoken"
   }
   ```

### API Token Best Practices

- **Use descriptive names** for tokens to track their usage
- **Rotate tokens regularly** (every 90 days recommended)
- **Use different tokens** for different applications
- **Revoke unused tokens** immediately
- **Never commit tokens** to version control

## Basic Authentication

If API tokens are not available, you can use username/password authentication.

### Configuration

```json
{
  "url": "https://jenkins.example.com",
  "username": "your-username",
  "password": "your-password"
}
```

### Limitations

- Less secure than API tokens
- May not work with:
  - Single Sign-On (SSO) systems
  - Two-factor authentication (2FA)
  - LDAP/Active Directory with special policies

## Authentication Methods by Jenkins Setup

### Jenkins with LDAP/Active Directory

**Recommended**: Use API tokens
```json
{
  "url": "https://jenkins.company.com",
  "username": "DOMAIN\\username",
  "apiToken": "your-api-token"
}
```

**Alternative**: If API tokens are disabled
```json
{
  "url": "https://jenkins.company.com",
  "username": "DOMAIN\\username",
  "password": "your-ldap-password"
}
```

### Jenkins with SAML/OAuth

**Only Option**: API tokens (password auth won't work)
```json
{
  "url": "https://jenkins.sso.company.com",
  "username": "user@company.com",
  "apiToken": "your-api-token"
}
```

### Jenkins with GitHub/GitLab Integration

1. Generate a personal access token in Jenkins
2. Configure:
```json
{
  "url": "https://jenkins.example.com",
  "username": "github-username",
  "apiToken": "jenkins-api-token"
}
```

## CSRF Protection

Jenkins uses CSRF (Cross-Site Request Forgery) protection by default. The MCP server handles this automatically by:

1. Requesting a crumb token before write operations
2. Including the crumb in all POST/PUT/DELETE requests

No additional configuration needed!

## Permissions Required

The Jenkins user needs specific permissions for different operations:

### Minimum Permissions (Read-Only)
- Overall/Read
- Job/Read
- View/Read

### Standard Permissions
- Overall/Read
- Job/Read
- Job/Build
- Job/Configure
- View/Read

### Full Permissions (Administrative)
- Overall/Administer (includes all permissions)

### Granular Permissions by Tool

| Tool | Required Permission |
|------|-------------------|
| test_connection | Overall/Read |
| list_jobs | Job/Read |
| get_job | Job/Read |
| get_job_config | Job/Configure |
| create_update_job | Job/Create, Job/Configure |
| delete_job | Job/Delete |
| build_job | Job/Build |
| stop_build | Job/Cancel |
| list_nodes | Overall/Read |
| restart_jenkins | Overall/Administer |

## Troubleshooting Authentication

### Common Issues

#### 1. 401 Unauthorized

**Symptoms**: All requests fail with 401 error

**Solutions**:
- Verify username is correct
- Check API token hasn't expired
- Ensure user account is active
- Try regenerating the API token

#### 2. 403 Forbidden

**Symptoms**: Connection works but operations fail

**Solutions**:
- Check user permissions in Jenkins
- Verify the user has required permissions for the operation
- Contact Jenkins administrator for permission updates

#### 3. CSRF Token Errors

**Symptoms**: GET requests work, POST/PUT/DELETE fail

**Solutions**:
- MCP server handles this automatically
- If issues persist, check Jenkins CSRF settings
- Ensure Jenkins version is compatible

#### 4. SSO/SAML Login Issues

**Symptoms**: Password authentication fails

**Solutions**:
- Must use API tokens with SSO
- Cannot use password authentication
- Generate token through Jenkins UI

### Debug Authentication

Test your authentication setup:

1. **Test Basic Connection**:
   ```
   Use tool: test_connection
   ```

2. **Check Permissions**:
   ```
   Use tool: get_system_info
   ```

3. **Verify Job Access**:
   ```
   Use tool: list_jobs
   ```

## Security Best Practices

### 1. Token Management

- **Store securely**: Use environment variables or secure vaults
- **Rotate regularly**: Set calendar reminders for rotation
- **Limit scope**: Use minimal required permissions
- **Track usage**: Name tokens by their purpose

### 2. Network Security

- **Use HTTPS**: Always use HTTPS in production
- **Verify SSL**: Keep `verifySsl: true` unless necessary
- **Firewall rules**: Restrict Jenkins access by IP if possible

### 3. User Management

- **Service accounts**: Create dedicated accounts for automation
- **Audit logs**: Regularly review Jenkins audit logs
- **Disable unused accounts**: Remove access promptly

### 4. Configuration Security

**Never do this**:
```json
{
  "url": "https://jenkins.com",
  "username": "admin",
  "password": "admin123"  // Never commit passwords!
}
```

**Do this instead**:
```json
{
  "url": "https://jenkins.com"
  // Use environment variables for credentials
}
```

```bash
export JENKINS_USERNAME="admin"
export JENKINS_API_TOKEN="secure-token-here"
```

## Environment Variable Reference

Complete list of authentication-related environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| JENKINS_URL | Jenkins server URL | https://jenkins.example.com |
| JENKINS_USERNAME | Username for authentication | john.doe |
| JENKINS_API_TOKEN | API token (preferred) | 11abc123def456... |
| JENKINS_PASSWORD | Password (if token not available) | secretpass |
| JENKINS_VERIFY_SSL | SSL certificate verification | true |

## Multi-Instance Authentication

For multiple Jenkins instances, use different config files:

**Production**: `.jenkins-mcp-prod.json`
```json
{
  "url": "https://jenkins-prod.company.com",
  "username": "prod-service",
  "apiToken": "prod-token"
}
```

**Development**: `.jenkins-mcp-dev.json`
```json
{
  "url": "https://jenkins-dev.company.com",
  "username": "dev-service",
  "apiToken": "dev-token"
}
```

## Compliance and Auditing

### Tracking API Token Usage

1. **Name tokens descriptively**:
   - "MCP-Server-Prod-2024"
   - "CI-Automation-Dev"
   - "Monitoring-Dashboard"

2. **Document token purposes**:
   - Keep a secure record of what each token is used for
   - Include creation date and planned rotation date

3. **Regular audits**:
   - Review active tokens quarterly
   - Remove unused tokens
   - Update documentation

### Example Token Registry

| Token Name | Purpose | Created | Rotate By | Owner |
|------------|---------|---------|-----------|--------|
| MCP-Prod-2024 | Production MCP Server | 2024-01-15 | 2024-04-15 | DevOps Team |
| Monitor-Bot-Q1 | Monitoring Dashboard | 2024-02-01 | 2024-05-01 | SRE Team |
| CI-Deploy-Token | Deployment Automation | 2024-01-20 | 2024-04-20 | CI/CD Team |