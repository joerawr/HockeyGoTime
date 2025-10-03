/**
 * SCAHA MCP Client using STDIO Transport
 * Connects to local scaha.net-mcp server
 * AI SDK MCP Integration: https://ai-sdk.dev/cookbook/node/mcp-tools
 */

import { experimental_createMCPClient } from "ai";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { MCPClientConfig } from "./scaha-types";

export class SchahaMCPClient {
  private client: Awaited<
    ReturnType<typeof experimental_createMCPClient>
  > | null = null;
  private serverPath: string;
  private isConnected: boolean = false;

  constructor(config: MCPClientConfig) {
    this.serverPath = config.serverPath;
  }

  /**
   * Initialize the MCP client connection via STDIO
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log("🔗 SCAHA MCP client already connected");
      return;
    }

    try {
      console.log("🚀 Connecting to SCAHA MCP server via STDIO...");
      console.log(`   Server path: ${this.serverPath}`);

      const transport = new StdioClientTransport({
        command: "node",
        args: [this.serverPath],
      });

      this.client = await experimental_createMCPClient({
        transport,
      });

      this.isConnected = true;
      console.log("✅ SCAHA MCP client connected successfully");
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
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.close();
      this.client = null;
      this.isConnected = false;
      console.log("🔌 SCAHA MCP client disconnected");
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
 */
export function getSchahaMCPClient(serverPath?: string): SchahaMCPClient {
  if (!schahaClientInstance) {
    const path =
      serverPath ||
      process.env.SCAHA_MCP_SERVER_PATH ||
      "../scaha.net-mcp/dist/server.js";

    schahaClientInstance = new SchahaMCPClient({ serverPath: path });
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
