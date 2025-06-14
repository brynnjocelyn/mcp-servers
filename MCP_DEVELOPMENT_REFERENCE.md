# MCP Development Reference

This document contains comprehensive Model Context Protocol (MCP) documentation and best practices for building MCP servers.

**Last Updated On:** December 13, 2025

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to LLMs. Think of it as a "universal USB-C port for AI applications" that connects AI models to various data sources and tools.

### Core Purpose
- Pre-built integrations for LLMs
- Flexibility to switch between LLM providers
- Best practices for data security
- Modular connection between AI models and data/tools

## Architecture Overview

### Core Components
1. **MCP Hosts**: AI tools wanting to access data (e.g., Claude Desktop, IDEs)
2. **MCP Clients**: Protocol clients maintaining 1:1 connections with servers
3. **MCP Servers**: Programs exposing specific capabilities
4. **Local Data Sources**: Computer files/databases
5. **Remote Services**: External systems accessible via APIs

### Message Flow
- **Requests**: Expect a response
- **Results**: Successful request responses
- **Errors**: Indicate request failures
- **Notifications**: One-way messages without response

### Connection Lifecycle
1. **Initialization**: Exchange protocol versions and capabilities
2. **Message Exchange**: Request-response interactions and notifications
3. **Termination**: Clean shutdown or error conditions

## Core Concepts

### 1. Resources
Resources are how servers expose data and content to clients and LLMs.

**Resource Types:**
- **Text Resources**: UTF-8 encoded (source code, configs, logs, JSON/XML)
- **Binary Resources**: Base64 encoded (images, PDFs, audio/video)

**URI Structure:** `[protocol]://[host]/[path]`
- Examples: `file:///home/user/report.pdf`, `postgres://database/customers/schema`

**Best Practices:**
- Use clear, descriptive names and URIs
- Set appropriate MIME types
- Implement resource templates for dynamic content
- Validate URIs before processing
- Consider pagination for large resource lists

### 2. Tools
Tools enable servers to expose executable functionality to clients.

**Key Components:**
- Unique name identifier
- Optional description
- Input schema (JSON Schema)
- Optional behavioral hints (`readOnlyHint`, `destructiveHint`, `idempotentHint`)

**Implementation Patterns:**
```typescript
// Example tool definition with Zod
const GetWeatherSchema = z.object({
  latitude: z.number().describe("Location latitude"),
  longitude: z.number().describe("Location longitude")
});
```

**Best Practices:**
- Provide clear, descriptive names
- Use detailed JSON Schema definitions
- Include examples in descriptions
- Implement proper error handling
- Validate all input parameters
- Consider rate limiting

### 3. Prompts
Prompts are predefined, reusable templates for standardizing LLM interactions.

**Key Features:**
- Accept dynamic arguments
- Include context from resources
- Chain multiple interactions
- Surface as UI elements (like slash commands)

**Structure:**
```typescript
{
  name: string;              // Unique identifier
  description?: string;      // Human-readable description
  arguments?: [              // Optional dynamic arguments
    {
      name: string;
      description?: string;
      required?: boolean;
    }
  ]
}
```

### 4. Transports
Transports handle the communication layer between clients and servers.

**Types:**
1. **stdio**: Local process communication
   - Best for command-line tools and local integrations
   - Simple input/output stream communication

2. **HTTP/SSE**: Remote communication
   - HTTP POST for client-to-server
   - Server-Sent Events for server-to-client
   - Supports stateful sessions

**Security Considerations:**
- Use TLS for network transport
- Validate client credentials
- Implement proper authentication
- Bind local servers to localhost only

### 5. Sampling
Sampling allows servers to request LLM completions through clients.

**Workflow:**
1. Server sends sampling request
2. Client reviews and modifies if needed
3. Client generates LLM completion
4. Client returns result to server

**Use Cases:**
- Reading and analyzing resources
- Making context-based decisions
- Generating structured data
- Handling multi-step tasks

## Development Guidelines

### Server Implementation Checklist
1. [ ] Initialize server instance with appropriate SDK
2. [ ] Define helper functions for API interactions
3. [ ] Implement tool execution handlers with error handling
4. [ ] Configure server transport (usually stdio)
5. [ ] Add comprehensive logging
6. [ ] Implement input validation using schemas
7. [ ] Test with MCP Inspector
8. [ ] Document all tools and parameters

### Best Practices

#### Security
- Validate and sanitize all inputs
- Implement access controls
- Use parameterized queries for databases
- Encrypt sensitive data in transit
- Audit tool usage
- Protect credentials and tokens

#### Error Handling
- Use try-catch blocks for all tools
- Return descriptive error messages
- Set `isError` flag in responses
- Log errors with context
- Handle network failures gracefully

#### Performance
- Implement connection pooling for databases
- Use pagination for large datasets
- Consider caching frequently accessed data
- Implement rate limiting
- Monitor resource usage

#### Code Quality
- Use TypeScript for type safety
- Follow consistent naming (snake_case for tools)
- Write comprehensive JSDoc comments
- Use Zod schemas for validation
- Keep functions focused and single-purpose

## Debugging Strategies

### Tools Available
1. **MCP Inspector**: Interactive debugging interface
2. **Claude Desktop Developer Tools**: Integration testing with logs
3. **Custom Logging**: Structured logging with context

### Common Issues
- Working directory uncertainties
- Environment variable limitations
- Server initialization problems
- Connection failures
- Authentication errors

### Debugging Workflow
1. Start with MCP Inspector for isolated testing
2. Implement structured logging
3. Test in target environment (e.g., Claude Desktop)
4. Monitor logs for errors
5. Use Chrome DevTools for web-based debugging

## Quick Reference Links

### Core Documentation
- **Introduction**: https://modelcontextprotocol.io/introduction
- **Server Quickstart**: https://modelcontextprotocol.io/quickstart/server
- **Architecture**: https://modelcontextprotocol.io/docs/concepts/architecture
- **Resources**: https://modelcontextprotocol.io/docs/concepts/resources
- **Tools**: https://modelcontextprotocol.io/docs/concepts/tools
- **Prompts**: https://modelcontextprotocol.io/docs/concepts/prompts
- **Transports**: https://modelcontextprotocol.io/docs/concepts/transports
- **Sampling**: https://modelcontextprotocol.io/docs/concepts/sampling
- **Debugging**: https://modelcontextprotocol.io/docs/tools/debugging

## Common Patterns

### Tool Definition Pattern
```typescript
const toolSchema = z.object({
  param1: z.string().describe("Parameter description"),
  param2: z.number().optional().describe("Optional parameter")
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "tool_name",
    description: "Clear description of what the tool does",
    inputSchema: zodToJsonSchema(toolSchema)
  }]
}));
```

### Error Response Pattern
```typescript
try {
  // Tool implementation
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
} catch (error) {
  return {
    content: [{ type: "text", text: `Error: ${error.message}` }],
    isError: true
  };
}
```

### Configuration Loading Pattern
```typescript
// Priority: Local config > Environment variables > Defaults
const config = loadConfig([
  `.${service}-mcp.json`,
  process.env.SERVICE_URL,
  'http://localhost:8080'
]);
```