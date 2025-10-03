import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col gap-4">
        <Link
          href="/hockey"
          className="text-center text-2xl font-bold text-primary hover:underline"
        >
          🏒 HockeyGoTime - SCAHA Schedule Assistant
        </Link>

        <div className="mt-8 border-t pt-8">
          <p className="text-sm text-muted-foreground text-center mb-4">Other Examples:</p>
          <div className="flex flex-col gap-2">
            <Link href="/simple-agent" className="text-center text-sm">
              Simple Agent
            </Link>
            <Link href="/rag-agent" className="text-center text-sm">
              RAG Agent
            </Link>
            <Link href="/agent-with-mcp-tools" className="text-center text-sm">
              Agent with MCP Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
