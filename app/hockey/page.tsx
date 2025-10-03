import ChatAssistant from "@/components/chat/chat-assistant";

export default function HockeyGoTimePage() {
  return (
    <div className="h-screen bg-background flex flex-col max-w-4xl mx-auto overflow-hidden">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">HockeyGoTime 🏒</h1>
        <p className="text-sm text-muted-foreground mt-1">
          SCAHA Schedule Assistant - Ask me about games, times, and opponents!
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatAssistant api="/api/hockey-chat" />
      </div>
    </div>
  );
}
