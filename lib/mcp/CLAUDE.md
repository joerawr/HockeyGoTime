# MCP (Model Context Protocol) Integration

This directory contains MCP client abstractions for connecting to remote MCP servers.

## Critical Rule

**ALWAYS fetch and read the provided documentation before implementing any MCP-related code.**

## Documentation

### AI SDK MCP Tools Integration

https://ai-sdk.dev/cookbook/node/mcp-tools

This documentation covers:

- How to create MCP clients with AI SDK
- SSE, stdio, and HTTP transport options
- Tool retrieval and combination patterns
- Integration with `generateText()` and `streamText()`
- Best practices for MCP client management

## Current Transport: STDIO

HockeyGoTime uses **STDIO transport** to spawn the SCAHA MCP server as a subprocess.

### How it works:
1. `StdioClientTransport` spawns `npx @joerawr/scaha-mcp`
2. Communicates via stdin/stdout
3. Subprocess is automatically terminated when client disconnects

### Advantages:
- No separate server to run
- Works on Vercel (Node.js subprocess spawning supported)
- Self-contained deployment
- Uses published npm package

## Usage Pattern

1. Read the documentation links above before making changes
2. Follow the existing patterns in `/lib/mcp/client/`
3. Use STDIO transport for subprocess-based MCP servers (like SCAHA)
4. Use SSE transport for remote HTTP MCP servers (like Firecrawl)
5. Always handle errors and add logging
6. Load credentials from environment variables

## Important Tips

- **Never disconnect MCP clients during streaming**: When using `streamText()`, tools may be called during the stream. Closing the client prematurely causes "closed client" errors.
- **Singleton pattern for connection reuse**: Use the singleton to maintain persistent connections across requests for better performance.

- **Type compatibility**: Use `Record<string, any>` for tool return types to ensure compatibility with AI SDK's `streamText()`.
