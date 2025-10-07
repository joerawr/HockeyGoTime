/**
 * SCAHA MCP Client using HTTP Transport
 *
 * Issue #3: Switch from STDIO to HTTP transport for SCAHA MCP server
 * Connects to remotely deployed SCAHA MCP server via SSE/HTTP
 *
 * AI SDK MCP Integration: https://ai-sdk.dev/cookbook/node/mcp-tools
 */

import { experimental_createMCPClient } from "ai";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { MCPClientConfig } from "./scaha-types";

export class SchahaMCPClient {
  private client: Awaited<
    ReturnType<typeof experimental_createMCPClient>
  > | null = null;
  private isConnected: boolean = false;
  private serverUrl: string;

  constructor(private config: MCPClientConfig) {
    // Issue #3: Use deployed HTTP endpoint instead of spawning subprocess
    this.serverUrl = config.serverUrl ||
      process.env.SCAHA_MCP_URL ||
      "https://scaha-f8aah2x4h-joe-rogers-projects.vercel.app/api/mcp";
  }

  /**
   * Initialize the MCP client connection via HTTP/SSE
   * Issue #3: Connects to deployed SCAHA MCP server instead of spawning subprocess
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log("🔗 SCAHA MCP client already connected");
      return;
    }

    try {
      console.log(`🚀 Connecting to SCAHA MCP server via HTTP: ${this.serverUrl}`);

      const transport = new SSEClientTransport(new URL(this.serverUrl));

      this.client = await experimental_createMCPClient({
        transport,
      });

      this.isConnected = true;
      console.log("✅ SCAHA MCP client connected via HTTP/SSE");
    } catch (error) {
      console.error("💥 Failed to connect to SCAHA MCP server:", error);
      throw new Error(
        `Failed to connect to SCAHA MCP server: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Disconnect the MCP client
   * Issue #3: Closes HTTP connection (no subprocess to terminate)
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.close();
      this.client = null;
      this.isConnected = false;
      console.log("🔌 SCAHA MCP client disconnected (HTTP connection closed)");
    } catch (error) {
      console.error("⚠️ Error during MCP client disconnect:", error);
    }
  }

  /**
   * Get all available SCAHA tools
   * Returns tools that can be used with AI SDK's generateText/streamText
   */
  async getTools(): Promise<Record<string, any>> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    if (!this.client) {
      throw new Error("MCP client not initialized");
    }

    try {
      console.log("🔧 Retrieving SCAHA MCP tools...");
      const tools = await this.client.tools();
      console.log(`✅ Retrieved ${Object.keys(tools).length} SCAHA tools`);
      return tools;
    } catch (error) {
      console.error("💥 Failed to retrieve SCAHA tools:", error);
      throw new Error(
        `Failed to retrieve SCAHA tools: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get the connection status
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the underlying MCP client instance
   */
  getClient() {
    return this.client;
  }
}

/**
 * Singleton instance for SCAHA MCP client
 */
let schahaClientInstance: SchahaMCPClient | null = null;

/**
 * Get or create a SCAHA MCP client instance
 * Issue #3: Now uses HTTP transport to deployed MCP server
 */
export function getSchahaMCPClient(serverUrl?: string): SchahaMCPClient {
  if (!schahaClientInstance) {
    schahaClientInstance = new SchahaMCPClient({
      serverPath: "", // Not used for HTTP, kept for type compatibility
      serverUrl: serverUrl, // Optional override for HTTP endpoint
    });
  }

  return schahaClientInstance;
}

/**
 * Reset the singleton instance (useful for testing or reconfiguration)
 */
export function resetSchahaMCPClient(): void {
  if (schahaClientInstance) {
    schahaClientInstance.disconnect().catch(console.error);
    schahaClientInstance = null;
  }
}
