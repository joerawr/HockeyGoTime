/**
 * PGHL MCP Client with HTTP and STDIO Transport Support
 *
 * Supports two transport modes:
 * 1. HTTP (Production): Connects to deployed PGHL MCP server via StreamableHTTP
 * 2. STDIO (Local Development): Spawns local PGHL MCP server process
 *
 * Transport selection priority:
 * - If PGHL_MCP_SERVER_PATH env var is set → STDIO
 * - If config.serverPath is provided → STDIO
 * - Otherwise → HTTP (default)
 */

import { experimental_createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { PghlMCPClientConfig } from "./pghl-types";

export class PghlMCPClient {
  private client: Awaited<
    ReturnType<typeof experimental_createMCPClient>
  > | null = null;
  private isConnected = false;
  private serverUrl: string;
  private serverPath?: string;
  private useStdio: boolean;

  constructor(private config: PghlMCPClientConfig) {
    // Determine transport mode
    this.serverPath = config.serverPath || process.env.PGHL_MCP_SERVER_PATH;
    this.useStdio = !!(config.useStdio || this.serverPath);

    // Set HTTP URL for non-STDIO mode
    this.serverUrl =
      config.serverUrl ||
      process.env.PGHL_MCP_URL ||
      "https://pghl-mcp.vercel.app/api/mcp";
  }

  /**
   * Initialize the MCP client connection via STDIO or HTTP
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log("🔗 PGHL MCP client already connected");
      return;
    }

    try {
      if (this.useStdio) {
        await this.connectViaStdio();
      } else {
        await this.connectViaHttp();
      }

      this.isConnected = true;
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
   * Connect via STDIO transport (local development)
   */
  private async connectViaStdio(): Promise<void> {
    if (!this.serverPath) {
      throw new Error(
        "PGHL_MCP_SERVER_PATH must be set for STDIO transport. " +
        "Example: export PGHL_MCP_SERVER_PATH=../pghl-mcp/dist/index.js"
      );
    }

    console.log(
      `🚀 Connecting to local PGHL MCP server via STDIO: ${this.serverPath}`,
    );

    const transport = new StdioClientTransport({
      command: "node",
      args: [this.serverPath],
    });

    this.client = await experimental_createMCPClient({
      transport,
    });

    console.log("✅ PGHL MCP client connected via STDIO");
  }

  /**
   * Connect via HTTP transport (production)
   */
  private async connectViaHttp(): Promise<void> {
    console.log(
      `🚀 Connecting to PGHL MCP server via HTTP: ${this.serverUrl}`,
    );

    const transport = new StreamableHTTPClientTransport(
      new URL(this.serverUrl),
    );

    this.client = await experimental_createMCPClient({
      transport,
    });

    console.log("✅ PGHL MCP client connected via StreamableHTTP");
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
      const transportMode = this.useStdio ? "STDIO" : "HTTP";
      console.log(`🔌 PGHL MCP client disconnected (${transportMode} connection closed)`);
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
