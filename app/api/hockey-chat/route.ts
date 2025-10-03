import { HOCKEY_SYSTEM_INSTRUCTIONS } from "@/components/agent/hockey-prompt";
import { getSchahaMCPClient } from "@/lib/mcp";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages array is required", { status: 400 });
    }

    const modelMessages = convertToModelMessages(messages);

    // Initialize SCAHA MCP client
    console.log("🚀 Initializing SCAHA MCP client...");
    const schahaClient = getSchahaMCPClient();
    await schahaClient.connect();

    // Retrieve SCAHA tools (get_schedule)
    const tools = await schahaClient.getTools();

    console.log(
      `🔧 HockeyGoTime has access to ${Object.keys(tools).length} SCAHA MCP tools`
    );

    // Wrap tools to log when they are called
    const wrappedTools = Object.fromEntries(
      Object.entries(tools).map(([toolName, toolDef]) => [
        toolName,
        {
          ...toolDef,
          execute: async (args: any) => {
            console.log(`\n🏒 Tool called: ${toolName}`);
            console.log(`   Input:`, JSON.stringify(args, null, 2));
            const result = await toolDef.execute(args);
            console.log(`   Output:`, JSON.stringify(result, null, 2));
            return result;
          },
        },
      ])
    );

    const result = streamText({
      model: openai("gpt-4o"), // Using gpt-4o as gpt-5 may not be available yet
      system: HOCKEY_SYSTEM_INSTRUCTIONS,
      messages: modelMessages,
      tools: wrappedTools,
      onFinish: async () => {
        // Close the MCP client after streaming completes
        // This is critical to avoid "closed client" errors
        console.log("🔌 Stream finished, disconnecting SCAHA MCP client...");
        await schahaClient.disconnect();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("💥 Hockey chat API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
