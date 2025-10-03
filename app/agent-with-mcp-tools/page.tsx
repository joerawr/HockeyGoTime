import ChatAssistant from "@/components/chat/chat-assistant";

export default function AgentWithMCPToolsPage() {
  return (
    <div className="h-screen bg-background flex flex-col max-w-4xl mx-auto overflow-hidden">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Agent with MCP Tools</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatAssistant api="/api/agent-with-mcp-tools" />
      </div>
    </div>
  );
}
