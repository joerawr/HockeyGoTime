/**
 * PGHL MCP Client using HTTP Transport
 *
 * Connects to remotely deployed PGHL MCP server via StreamableHTTP
 * Note: Uses HTTP instead of Stdio because Vercel serverless doesn't support npx (no write access to home dir)
 */

import { experimental_createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { PghlMCPClientConfig } from "./pghl-types";

export class PghlMCPClient {
  private client: Awaited<
    ReturnType<typeof experimental_createMCPClient>
  > | null = null;
  private isConnected = false;
  private serverUrl: string;

  constructor(private config: PghlMCPClientConfig) {
    this.serverUrl =
      config.serverUrl ||
      process.env.PGHL_MCP_URL ||
      "https://pghl-mcp.vercel.app/api/mcp";
  }

  /**
   * Initialize the MCP client connection via StreamableHTTP
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log("🔗 PGHL MCP client already connected");
      return;
    }

    try {
      console.log(
        `🚀 Connecting to PGHL MCP server via HTTP: ${this.serverUrl}`,
      );

      const transport = new StreamableHTTPClientTransport(
        new URL(this.serverUrl),
      );

      this.client = await experimental_createMCPClient({
        transport,
      });

      this.isConnected = true;
      console.log("✅ PGHL MCP client connected via StreamableHTTP");
    } catch (error) {
      console.error("💥 Failed to connect to PGHL MCP server:", error);
      throw new Error(
        `Failed to connect to PGHL MCP server: ${
          error instanceof Error ? error.message : String(error)
        }`,
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
      console.log("🔌 PGHL MCP client disconnected (HTTP connection closed)");
    } catch (error) {
      console.error("⚠️ Error during PGHL MCP client disconnect:", error);
    }
  }

  /**
   * Get all available PGHL tools
   */
  async getTools(): Promise<Record<string, any>> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    if (!this.client) {
      throw new Error("PGHL MCP client not initialized");
    }

    try {
      console.log("🔧 Retrieving PGHL MCP tools...");
      const tools = await this.client.tools();
      console.log(`✅ Retrieved ${Object.keys(tools).length} PGHL tools`);
      return tools;
    } catch (error) {
      console.error("💥 Failed to retrieve PGHL tools:", error);
      throw new Error(
        `Failed to retrieve PGHL tools: ${
          error instanceof Error ? error.message : String(error)
        }`,
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
 * Singleton instance for PGHL MCP client
 */
let pghlClientInstance: PghlMCPClient | null = null;

/**
 * Get or create a PGHL MCP client instance
 */
export function getPghlMCPClient(serverUrl?: string): PghlMCPClient {
  if (!pghlClientInstance) {
    pghlClientInstance = new PghlMCPClient({ serverUrl });
  }

  return pghlClientInstance;
}

/**
 * Reset the singleton instance (useful for testing or reconfiguration)
 */
export function resetPghlMCPClient(): void {
  if (pghlClientInstance) {
    pghlClientInstance.disconnect().catch(console.error);
    pghlClientInstance = null;
  }
}
