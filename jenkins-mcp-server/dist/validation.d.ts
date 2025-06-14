/**
 * Input validation utilities for Jenkins MCP Server
 * Implements security best practices from MCP documentation
 */
/**
 * Validate and sanitize job names
 * Jenkins job names have specific requirements
 */
export declare function validateJobName(name: string): string;
/**
 * Validate Groovy pipeline scripts
 * Basic validation to prevent obvious security issues
 */
export declare function validatePipelineScript(script: string): string;
/**
 * Validate XML configuration
 * Prevents XXE and other XML attacks
 */
export declare function validateXmlConfig(xml: string): string;
/**
 * Validate build parameters
 * Ensures parameters are safe to pass to Jenkins
 */
export declare function validateBuildParameters(params: Record<string, any>): Record<string, any>;
/**
 * Validate folder paths
 * Prevents directory traversal attacks
 */
export declare function validateFolderPath(path: string): string;
//# sourceMappingURL=validation.d.ts.map