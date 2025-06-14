/**
 * Input validation utilities for Jenkins MCP Server
 * Implements security best practices from MCP documentation
 */

import { z } from 'zod';

/**
 * Validate and sanitize job names
 * Jenkins job names have specific requirements
 */
export function validateJobName(name: string): string {
  // Jenkins job name pattern: alphanumeric, dash, underscore, space, dot
  const validPattern = /^[a-zA-Z0-9_\-\s\.]+$/;
  
  if (!validPattern.test(name)) {
    throw new Error('Invalid job name. Use only letters, numbers, dash, underscore, space, or dot.');
  }
  
  // Prevent path traversal
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw new Error('Job name cannot contain path traversal characters');
  }
  
  // Length limits
  if (name.length === 0 || name.length > 255) {
    throw new Error('Job name must be between 1 and 255 characters');
  }
  
  return name.trim();
}

/**
 * Validate Groovy pipeline scripts
 * Basic validation to prevent obvious security issues
 */
export function validatePipelineScript(script: string): string {
  // Check for potentially dangerous commands
  const dangerousPatterns = [
    /System\.exit/i,
    /Runtime\.getRuntime/i,
    /ProcessBuilder/i,
    /new\s+File\s*\(\s*['"]\//i,  // Absolute file paths
    /\.execute\(\)/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(script)) {
      throw new Error('Pipeline script contains potentially dangerous code patterns');
    }
  }
  
  // Size limit (1MB)
  if (script.length > 1024 * 1024) {
    throw new Error('Pipeline script exceeds maximum size of 1MB');
  }
  
  return script;
}

/**
 * Validate XML configuration
 * Prevents XXE and other XML attacks
 */
export function validateXmlConfig(xml: string): string {
  // Check for external entity declarations
  if (xml.includes('<!ENTITY') || xml.includes('<!DOCTYPE')) {
    throw new Error('XML configuration cannot contain DTD or entity declarations');
  }
  
  // Check for SYSTEM references
  if (xml.includes('SYSTEM')) {
    throw new Error('XML configuration cannot contain SYSTEM references');
  }
  
  // Size limit (10MB)
  if (xml.length > 10 * 1024 * 1024) {
    throw new Error('XML configuration exceeds maximum size of 10MB');
  }
  
  return xml;
}

/**
 * Validate build parameters
 * Ensures parameters are safe to pass to Jenkins
 */
export function validateBuildParameters(params: Record<string, any>): Record<string, any> {
  const validated: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    // Validate parameter names
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      throw new Error(`Invalid parameter name: ${key}`);
    }
    
    // Validate parameter values based on type
    if (typeof value === 'string') {
      // Limit string length
      if (value.length > 10000) {
        throw new Error(`Parameter ${key} value exceeds maximum length`);
      }
      validated[key] = value;
    } else if (typeof value === 'number') {
      validated[key] = value;
    } else if (typeof value === 'boolean') {
      validated[key] = value;
    } else {
      // Convert other types to string
      validated[key] = String(value);
    }
  }
  
  return validated;
}

/**
 * Validate folder paths
 * Prevents directory traversal attacks
 */
export function validateFolderPath(path: string): string {
  // Remove any path traversal attempts
  if (path.includes('..') || path.includes('~')) {
    throw new Error('Folder path cannot contain path traversal characters');
  }
  
  // Ensure path uses forward slashes
  const normalizedPath = path.replace(/\\/g, '/');
  
  // Remove leading/trailing slashes
  const cleanPath = normalizedPath.replace(/^\/+|\/+$/g, '');
  
  // Validate each segment
  const segments = cleanPath.split('/');
  for (const segment of segments) {
    if (segment.length === 0) continue;
    validateJobName(segment);
  }
  
  return cleanPath;
}